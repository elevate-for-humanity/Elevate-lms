import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

function expandAllowedRoles(allowedRoles: string[]): string[] {
  const expanded = new Set(allowedRoles);
  // Routes that allow admin should also include org_admin
  if (expanded.has('admin')) {
    expanded.add('org_admin');
  }
  // Routes that allow staff should also include org_admin
  if (expanded.has('staff')) {
    expanded.add('org_admin');
  }
  return Array.from(expanded);
}

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
    avatar_url?: string | null;
    onboarding_completed?: boolean | null;
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
      headersList.get('referer') ||
      '';
    let returnPath = '/learner/dashboard';
    if (rawUrl) {
      try {
        const u = new URL(rawUrl, 'http://localhost');
        returnPath = u.pathname + (u.search || '');
      } catch {
        // malformed — use default
      }
    }
    // Admin app has no /login page — redirect to /admin-login on the LMS.
    // SERVICE_ROLE=admin is set in the admin container environment.
    const loginPath =
      process.env.SERVICE_ROLE === 'admin'
        ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/login?redirect=${encodeURIComponent(returnPath)}`
        : `/login?redirect=${encodeURIComponent(returnPath)}`;
    redirect(loginPath);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Profile row missing — authenticated but no profile record.
  // This happens when the handle_new_user trigger fails silently (e.g. tenants
  // table empty, constraint violation) or when a user is created via admin API
  // without going through the normal signup flow.
  // Do not send to /unauthorized — the user is legitimate, just incomplete.
  // Admin users are exempt: they land on the admin app which has its own recovery.
  if (!profile) {
    if (process.env.SERVICE_ROLE === 'admin') {
      redirect(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/unauthorized`);
    }
    redirect('/onboarding/learner?reason=profile_missing');
  }

  // Load secondary roles from user_roles table (multi-role users).
  // Select both the FK-joined name and the direct `role` TEXT column as fallback.
  const { data: userRoleRows } = await supabase
    .from('user_roles')
    .select('role, roles(name)')
    .eq('user_id', user.id);
  const secondaryRoles = (userRoleRows || [])
    .flatMap((r: any) => [r.roles?.name, r.role])
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .map((v) => v.trim());

  const effectiveRoles = Array.from(new Set([profile.role, ...secondaryRoles]));
  const expandedAllowedRoles = expandAllowedRoles(allowedRoles);

  const allowed = effectiveRoles.some((r) => expandedAllowedRoles.includes(r));

  if (!allowed) {
    const unauthorizedPath =
      process.env.SERVICE_ROLE === 'admin'
        ? `${process.env.NEXT_PUBLIC_SITE_URL || ''}/unauthorized`
        : '/unauthorized';
    redirect(unauthorizedPath);
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

  if (!profile?.role) return false;
  const expandedAllowedRoles = expandAllowedRoles([requiredRole]);
  return expandedAllowedRoles.includes(profile.role);
}
