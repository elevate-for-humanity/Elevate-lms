// lib/with-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { AuthedUser, UserRole, AuthHandler, WithAuthOptions } from '@/types/auth';

// Get the current user + role from Supabase
async function getAuthedUser(req: NextRequest): Promise<AuthedUser | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  // Adjust table/columns if your profile schema is different
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    role: (profile?.role as UserRole | null) ?? null,
  };
}

/**
 * Wraps a route handler and injects `user`.
 * Usage:
 * export const GET = withAuth(async (req, ctx, user) => { ... }, { roles: ['admin'] });
 */
export function withAuth<TParams = Record<string, string>>(
  handler: AuthHandler<TParams>,
  options: WithAuthOptions = {},
) {
  return async (req: NextRequest, context: { params: Promise<TParams> }) => {
    const user = await getAuthedUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (options.roles && options.roles.length > 0) {
      if (!user.role || !options.roles.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Await params for Next.js 15
    const params = await context.params;
    return handler(req, { params, user });
  };
}
