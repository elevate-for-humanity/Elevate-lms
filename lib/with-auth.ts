// lib/with-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { AuthedUser, AuthHandler, WithAuthOptions } from '@/types/auth';
import {
  hasAnyRole,
  normalizeRoles,
  type UserRole,
} from '@/lib/rbac/role-matrix';

/**
 * Resolve the authenticated API identity using the same role model as portal
 * page guards. profiles.role remains the primary role; user_roles contributes
 * secondary roles. Supabase cookie refresh uses the current SSR getAll/setAll
 * contract so route handlers can persist refreshed credentials when allowed.
 */
async function getAuthedUser(_req: NextRequest): Promise<{
  user: AuthedUser;
  effectiveRoles: string[];
} | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Middleware is the primary request-boundary refresher for Admin/LMS.
          }
        },
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
  ]);

  const secondaryRoles = (roleRows ?? [])
    .map((row) => (row as { roles?: { name?: unknown } | null }).roles?.name)
    .filter((role): role is string => typeof role === 'string');
  const effectiveRoles = normalizeRoles([profile?.role, ...secondaryRoles]);

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      role: (profile?.role as UserRole | null) ?? null,
    },
    effectiveRoles,
  };
}

function canSatisfyRequestedRoles(
  effectiveRoles: string[],
  requestedRoles: readonly UserRole[],
): boolean {
  // A route that explicitly asks for super_admin and does not include admin is
  // a privileged boundary, not a portal-access role set. Preserve that exact
  // requirement instead of applying the normal platform-admin override.
  const superAdminOnlyBoundary =
    requestedRoles.includes('super_admin') && !requestedRoles.includes('admin');

  return hasAnyRole(effectiveRoles, requestedRoles, {
    adminOverride: !superAdminOnlyBoundary,
  });
}

/** Wrap a Next route handler and inject the authenticated user into context. */
export function withAuth<TParams = Record<string, string>>(
  handler: AuthHandler<TParams>,
  options: WithAuthOptions = {},
) {
  return async (
    req: NextRequest,
    context: { params?: Promise<TParams> } = {},
  ): Promise<Response> => {
    const auth = await getAuthedUser(req);

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      options.roles &&
      options.roles.length > 0 &&
      !canSatisfyRequestedRoles(auth.effectiveRoles, options.roles)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = context.params ? await context.params : ({} as TParams);
    return handler(req, { params, user: auth.user });
  };
}
