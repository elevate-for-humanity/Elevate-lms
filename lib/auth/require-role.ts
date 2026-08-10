import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import {
  hasAnyRole,
  normalizeRoles,
  type UserRole,
} from '@/lib/rbac/role-matrix';

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
  /** All normalized roles this user holds (profile.role + user_roles). */
  effectiveRoles: string[];
}

async function resolveCurrentPath(): Promise<string> {
  const headersList = await headers();
  const fromHeader =
    headersList.get('x-pathname') ||
    headersList.get('x-url') ||
    headersList.get('x-invoke-path') ||
    '';

  if (fromHeader) {
    try {
      const url = new URL(fromHeader, 'http://localhost');
      return url.pathname + (url.search || '');
    } catch {
      // malformed URL — fall through to cookie
    }
  }

  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('__efh_pathname');
    if (cookie?.value) return cookie.value;
  } catch {
    // cookies() can throw during static prerender
  }

  return '';
}

/**
 * Canonical role guard for portal pages.
 *
 * - Reads both profile.role and user_roles.
 * - Normalizes historical aliases (sponsor→employer, host_shop_admin→host_shop,
 *   barber_apprentice→apprentice, etc.).
 * - Admin/super_admin have platform-wide portal override; tenant-sensitive data
 *   loaders must still require a concrete tenant/partner context.
 */
export async function requireRole(
  allowedRoles: readonly (UserRole | string)[],
): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const currentPath = await resolveCurrentPath();
    if (currentPath) {
      redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) redirect('/unauthorized');

  const { data: userRoleRows } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  const secondaryRoles = (userRoleRows || [])
    .map((row: any) => row.roles?.name)
    .filter((role: unknown): role is string => typeof role === 'string');

  const effectiveRoles = normalizeRoles([profile.role, ...secondaryRoles]);

  if (!hasAnyRole(effectiveRoles, allowedRoles, { adminOverride: true })) {
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

export async function hasRole(requiredRole: UserRole | string): Promise<boolean> {
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

  const { data: userRoleRows } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  const secondaryRoles = (userRoleRows || [])
    .map((row: any) => row.roles?.name)
    .filter((role: unknown): role is string => typeof role === 'string');
  const effectiveRoles = normalizeRoles([profile?.role, ...secondaryRoles]);

  return hasAnyRole(effectiveRoles, [requiredRole], { adminOverride: true });
}
