// lib/with-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasAnyRole, normalizeRole, normalizeRoles } from '@/lib/rbac/role-matrix';
import type { AuthedUser, AuthHandler, WithAuthOptions } from '@/types/auth';

async function getAuthedUser(): Promise<AuthedUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const [{ data: profile, error: profileError }, { data: roleRows, error: roleError }] =
    await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
    ]);

  if (profileError || roleError) return null;

  const secondaryRoles = (roleRows ?? [])
    .map((row: any) => row?.roles?.name)
    .filter((value: unknown): value is string => typeof value === 'string');
  const role = normalizeRole(profile?.role);
  const effectiveRoles = normalizeRoles([role, ...secondaryRoles]);

  if (!effectiveRoles.length) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    role,
    effectiveRoles,
  };
}

/**
 * Wrap a Next.js route handler with canonical Supabase authentication and RBAC.
 * The route receives resolved Next 15 params plus the authenticated user on the
 * context and as the compatibility third argument.
 */
export function withAuth<TParams = Record<string, string>>(
  handler: AuthHandler<TParams>,
  options: WithAuthOptions = {},
) {
  return async (req: NextRequest, context: { params: Promise<TParams> }) => {
    const user = await getAuthedUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      options.roles?.length &&
      !hasAnyRole(user.effectiveRoles, options.roles, { adminOverride: true })
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    return handler(
      req,
      {
        params,
        user,
        id: user.id,
        email: user.email,
        role: user.role,
        effectiveRoles: user.effectiveRoles,
      },
      user,
    );
  };
}
