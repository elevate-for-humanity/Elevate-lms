import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeError } from '@/lib/api/safe-error';

type Role = 'admin' | 'super_admin' | 'staff' | 'instructor' | 'student';

interface WithAuthOptions {
  /** Roles allowed to call this route. Defaults to ['admin', 'super_admin']. */
  roles?: Role[];
}

type AuthedHandler = (
  req: NextRequest,
  ctx: { user: { id: string; email: string }; role: Role }
) => Promise<NextResponse> | NextResponse;

/**
 * Centralized auth wrapper for API routes.
 *
 * Usage:
 *   export const GET = withAuth(async (req, { user, role }) => {
 *     // business logic only — auth is already verified
 *   }, { roles: ['admin', 'super_admin'] });
 */
export function withAuth(handler: AuthedHandler, options: WithAuthOptions = {}) {
  const allowedRoles: Role[] = options.roles ?? ['admin', 'super_admin'];

  return async function (req: NextRequest): Promise<NextResponse> {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return safeError('Unauthorized', 401);
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return safeError('Unauthorized', 401);
      }

      if (!allowedRoles.includes(profile.role as Role)) {
        return safeError('Forbidden', 403);
      }

      return await handler(req, {
        user: { id: user.id, email: user.email ?? '' },
        role: profile.role as Role,
      });
    } catch (err) {
      return safeError('Internal server error', 500);
    }
  };
}
