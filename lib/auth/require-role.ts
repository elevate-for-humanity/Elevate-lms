import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
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
    avatar_url?: string | null;
    verified?: boolean | null;
    is_active?: boolean | null;
    suspended?: boolean | null;
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
  const hasActiveHostShopMembership = (rows || []).some(
    (row: any) =>
      row?.status === 'active' &&
      HOST_SHOP_MEMBERSHIP_ROLES.has(
        String(row?.role || '')
          .trim()
          .toLowerCase(),
      ),
  );
  return hasActiveHostShopMembership ? ['host_shop'] : [];
}

/**
 * An archived Program Holder who is now Host Shop-only must not regain
 * Employer/Admin/Program Holder access from legacy user_roles grants.
 * Preserve those historical grant rows in the database for audit; only
 * constrain effective session permissions. Other multi-role shops are untouched.
 */
export function scopeArchivedHostShopRoles(
  effectiveRoles: UserRole[],
  profileRole: unknown,
  holderArchived: boolean,
): UserRole[] {
  return profileRole === 'host_shop' && holderArchived
    ? ['host_shop']
    : effectiveRoles;
}

async function enforceArchivedHostShopScope(
  userId: string,
  profileRole: unknown,
  effectiveRoles: UserRole[],
): Promise<UserRole[]> {
  if (profileRole !== 'host_shop' || !effectiveRoles.some(role => role !== 'host_shop')) {
    return effectiveRoles;
  }
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('program_holders')
    .select('features')
    .eq('user_id', userId);
  if (error) throw new Error('HOST_SHOP_ARCHIVE_SCOPE_UNAVAILABLE');
  return scopeArchivedHostShopRoles(
    effectiveRoles,
    profileRole,
    (data || []).some((row: any) => row.features?.portal_access_archived === true),
  );
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

export async function requireRole(
  allowedRoles: readonly (UserRole | string)[],
): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const currentPath = await resolveCurrentPath();
    if (currentPath) redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
    redirect('/login');
  }

  const [profileResult, rolesResult, membershipResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
    supabase
      .from('partner_users')
      .select('partner_id, role, status')
      .eq('user_id', user.id)
      .eq('status', 'active'),
  ]);

  // A transient Data API failure must not be mistaken for a missing profile or
  // revoked membership, which would send an authorized user to /unauthorized.
  if (profileResult.error || rolesResult.error || membershipResult.error) {
    throw new Error('ROLE_LOOKUP_UNAVAILABLE');
  }
  const profile = profileResult.data;
  const userRoleRows = rolesResult.data;
  const partnerMembershipRows = membershipResult.data;

  if (!profile) redirect('/unauthorized');
  if (profile.is_active === false || profile.suspended === true) redirect('/unauthorized');

  const secondaryRoles = (userRoleRows || [])
    .map((row: any) => row.roles?.name)
    .filter((value: unknown): value is string => typeof value === 'string');
  const effectiveRoles = await enforceArchivedHostShopScope(user.id, profile.role, normalizeRoles([
    profile.role,
    ...secondaryRoles,
    ...membershipDerivedRoles(partnerMembershipRows),
  ]));

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

  const [profileResult, rolesResult, membershipResult] = await Promise.all([
    supabase.from('profiles').select('role, is_active, suspended').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
    supabase
      .from('partner_users')
      .select('partner_id, role, status')
      .eq('user_id', user.id)
      .eq('status', 'active'),
  ]);

  if (profileResult.error || rolesResult.error || membershipResult.error) return false;
  const profile = profileResult.data;
  const userRoleRows = rolesResult.data;
  const partnerMembershipRows = membershipResult.data;

  if (!profile || profile.is_active === false || profile.suspended === true) return false;

  const secondaryRoles = (userRoleRows || [])
    .map((row: any) => row.roles?.name)
    .filter((value: unknown): value is string => typeof value === 'string');
  // Background role checks must use the same archived-portal restriction
  // as full page guards; do not revive legacy grants through hasRole().
  try {
    const effectiveRoles = await enforceArchivedHostShopScope(user.id, profile.role, normalizeRoles([
      profile.role,
      ...secondaryRoles,
      ...membershipDerivedRoles(partnerMembershipRows),
    ]));
    return hasAnyRole(effectiveRoles, [requiredRole], { adminOverride: true });
  } catch {
    return false;
  }
}
