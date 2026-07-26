import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveDashboardUrl } from '@/lib/routing/dashboard-resolver';

export interface AuthResult {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    id: string;
    role: string;
    organization_id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
  };
  /** All roles this user holds (profile.role + any user_roles entries). Use this for inline role checks instead of profile.role to support multi-role users. */
  effectiveRoles: string[];
}

/**
 * Require user to have one of the specified roles.
 * Redirects to /login?redirect=<current-path> if not authenticated.
 * Redirects to /unauthorized if authenticated but wrong role.
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Preserve the requested path so login can return the user here
    const headersList = await headers();
    const rawUrl =
      headersList.get('x-pathname') ||
      headersList.get('x-url') ||
      headersList.get('x-invoke-path') ||
      '';
    // Default redirect: /admin-login (the marketing login page that handles all roles).
    // This is the entry point for all authenticated portals.
    let returnPath = '/admin-login';
    if (rawUrl) {
      try {
        const u = new URL(rawUrl, 'http://localhost');
        returnPath = u.pathname + (u.search || '');
      } catch {
        // malformed — use default from DashboardResolver
      }
    }
    // Always use relative /login and /unauthorized — middleware handles cross-domain routing.
    // The x-pathname header set by middleware gives us the actual requested path.
    redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Profile row missing — authenticated but no profile record.
  // Redirect to /unauthorized for handling.
  if (!profile) {
    redirect('/unauthorized');
  }

  // Load secondary roles from user_roles table (multi-role users)
  const { data: userRoleRows } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);
  const secondaryRoles = (userRoleRows || [])
    .map((r: any) => r.roles?.name)
    .filter(Boolean) as string[];

  const effectiveRoles = Array.from(new Set([profile.role, ...secondaryRoles]));

  const allowed = effectiveRoles.some((r) => allowedRoles.includes(r));

  if (!allowed) {
    redirect('/unauthorized');
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    effectiveRoles,
  };
}

/**
 * Check if user has specific role (returns boolean, doesn't redirect)
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return (
    profile?.role === requiredRole || profile?.role === 'admin' || profile?.role === 'super_admin'
  );
}
