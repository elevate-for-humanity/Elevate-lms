import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
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
 * Resolve the current request pathname for post-login redirect.
 *
 * Priority:
 *  1. x-pathname header  — set by middleware (works in Edge runtime)
 *  2. __efh_pathname cookie — set by middleware as fallback for standalone
 *                             Node.js deployments where headers() doesn't
 *                             carry Edge-set custom headers to server components
 *  3. ''                 — no usable path; caller must handle
 */
async function resolveCurrentPath(): Promise<string> {
  const headersList = await headers();
  const fromHeader =
    headersList.get('x-pathname') ||
    headersList.get('x-url') ||
    headersList.get('x-invoke-path') ||
    '';

  if (fromHeader) {
    try {
      const u = new URL(fromHeader, 'http://localhost');
      return u.pathname + (u.search || '');
    } catch {
      // malformed URL — fall through to cookie
    }
  }

  // Cookie fallback: set by middleware for standalone Node.js runtimes
  // where Edge headers() are not propagated to server components.
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('__efh_pathname');
    if (cookie?.value) {
      return cookie.value;
    }
  } catch {
    // cookies() throws during static prerender
  }

  return '';
}

/**
 * Require user to have one of the specified roles.
 * Redirects to /admin-login?redirect=<current-path> if not authenticated.
 * Redirects to /unauthorized if authenticated but wrong role.
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const currentPath = await resolveCurrentPath();

    if (currentPath) {
      redirect(`/admin-login?redirect=${encodeURIComponent(currentPath)}`);
    }
    // No usable path; send to the unified marketing login entry.
    redirect('/admin-login');
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
