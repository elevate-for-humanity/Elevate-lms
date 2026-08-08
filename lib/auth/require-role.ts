import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';

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
  /** All roles this user holds (profile.role + any user_roles entries). */
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
 * Require user to have one of the specified roles.
 *
 * Authentication always enters through /login. Marketing /login performs a
 * same-purpose handoff to the canonical LMS login; the LMS owns the login UI.
 * Do not send shared portal code to the removed /admin-login alias.
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const currentPath = await resolveCurrentPath();
    if (currentPath) {
      redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/unauthorized');

  const { data: userRoleRows } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);
  const secondaryRoles = (userRoleRows || [])
    .map((row: any) => row.roles?.name)
    .filter(Boolean) as string[];

  const effectiveRoles = Array.from(new Set([profile.role, ...secondaryRoles]));
  const allowed = effectiveRoles.some((role) => allowedRoles.includes(role));

  if (!allowed) redirect('/unauthorized');

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    effectiveRoles,
  };
}

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

  if (profile?.role === requiredRole || profile?.role === 'admin' || profile?.role === 'super_admin') {
    return true;
  }

  const { data: userRoleRows } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  return (userRoleRows || []).some((row: any) => row.roles?.name === requiredRole);
}
