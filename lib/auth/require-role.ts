import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { hasAnyRole, normalizeRoles, type UserRole } from '@/lib/rbac/role-matrix';

export interface AuthResult {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    id: string;
    role: string;
    organization_id?: string | null;
    tenant_id?: string | null;
    program_holder_id?: string | null;
    email?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    company_name?: string | null;
    verified?: boolean | null;
  };
  effectiveRoles: UserRole[];
}

const HOST_SHOP_MEMBERSHIP_ROLES = new Set([
  'owner',
  'partner_admin',
  'admin',
  'supervisor',
  'mentor',
  'manager',
]);

function membershipDerivedRoles(rows: any[] | null | undefined): UserRole[] {
  const hasActiveHostShopMembership = (rows || []).some((row: any) =>
    row?.status === 'active' && HOST_SHOP_MEMBERSHIP_ROLES.has(String(row?.role || '').trim().toLowerCase()),
  );
  return hasActiveHostShopMembership ? ['host_shop'] : [];
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
      // fall through to cookie
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

export async function requireRole(allowedRoles: readonly (UserRole | string)[]): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const currentPath = await resolveCurrentPath();
    if (currentPath) redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
    redirect('/login');
  }

  const [{ data: profile }, { data: userRoleRows }, { data: partnerMembershipRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
    supabase.from('partner_users').select('partner_id, role, status').eq('user_id', user.id).eq('status', 'active'),
  ]);

  if (!profile) redirect('/unauthorized');

  const secondaryRoles = (userRoleRows || [])
    .map((row: any) => row.roles?.name)
    .filter((value: unknown): value is string => typeof value === 'string');
  const effectiveRoles = normalizeRoles([
    profile.role,
    ...secondaryRoles,
    ...membershipDerivedRoles(partnerMembershipRows),
  ]);

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

export async function hasRole(requiredRole: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const [{ data: profile }, { data: userRoleRows }, { data: partnerMembershipRows }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
    supabase.from('partner_users').select('partner_id, role, status').eq('user_id', user.id).eq('status', 'active'),
  ]);

  const secondaryRoles = (userRoleRows || [])
    .map((row: any) => row.roles?.name)
    .filter((value: unknown): value is string => typeof value === 'string');
  const effectiveRoles = normalizeRoles([
    profile?.role,
    ...secondaryRoles,
    ...membershipDerivedRoles(partnerMembershipRows),
  ]);

  return hasAnyRole(effectiveRoles, [requiredRole], { adminOverride: true });
}
