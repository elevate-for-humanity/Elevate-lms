// lib/auth/route-guards.ts
// Canonical route guards for authenticated portals.

import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { resolveDashboardUrl } from '@/lib/routing/dashboard-resolver';

const PORTAL_ROLE_MAP: Record<string, string[]> = {
  '/admin': ['admin', 'super_admin', 'org_admin', 'staff', 'instructor', 'test_admin', 'proctor'],
  '/lms': ['admin', 'super_admin', 'student', 'program_holder', 'instructor', 'apprentice', 'grant_client'],
  '/apprentice': ['admin', 'super_admin', 'apprentice', 'instructor'],
  '/portal': ['admin', 'super_admin', 'student', 'apprentice'],
  '/instructor': ['admin', 'super_admin', 'instructor'],
  '/employer': ['admin', 'super_admin', 'employer', 'sponsor', 'org_admin'],
  '/staff-portal': ['admin', 'super_admin', 'staff', 'case_manager'],
  '/case-manager': ['admin', 'super_admin', 'staff', 'case_manager'],
  '/host-shop': ['admin', 'super_admin', 'staff', 'host_shop', 'host_shop_admin', 'partner'],
  '/workforce': ['admin', 'super_admin', 'staff', 'workforce', 'workforce_partner'],
  '/workforce-board': ['admin', 'super_admin', 'staff', 'case_manager', 'workforce_board', 'workforce_board_admin'],
  '/provider': ['admin', 'super_admin', 'provider', 'provider_admin'],
  '/program-holder': ['admin', 'super_admin', 'program_holder'],
  '/proctor': ['admin', 'super_admin', 'test_admin', 'proctor'],
};

const ROUTE_REDIRECTS: Record<string, string> = {
  '/admin': '/dashboard',
  '/lms': '/lms/dashboard',
  '/apprentice': '/apprentice',
  '/portal': '/lms/dashboard',
  '/instructor': '/instructor/dashboard',
  '/employer': '/employer/dashboard',
  '/staff-portal': '/staff-portal/dashboard',
  '/case-manager': '/case-manager/dashboard',
  '/host-shop': '/host-shop/dashboard',
  '/workforce': '/workforce/dashboard',
  '/workforce-board': '/workforce-board/dashboard',
  '/provider': '/provider/dashboard',
  '/program-holder': '/program-holder/dashboard',
  '/proctor': '/testing-center',
};

const BILLING_EXEMPT_PREFIXES = [
  '/billing-required',
  '/apprentice/billing',
  '/lms/billing',
];

export function getBasePath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return '/';
  return '/' + segments[0];
}

export function isBillingExempt(pathname: string): boolean {
  return BILLING_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function normalizeRole(role: string): string {
  const roleMap: Record<string, string> = {
    admin: 'admin',
    super_admin: 'super_admin',
    org_admin: 'org_admin',
    student: 'student',
    apprentice: 'apprentice',
    barber_apprentice: 'apprentice',
    cosmetology_apprentice: 'apprentice',
    instructor: 'instructor',
    employer: 'employer',
    sponsor: 'sponsor',
    partner: 'partner',
    host_shop: 'host_shop',
    host_shop_admin: 'host_shop_admin',
    staff: 'staff',
    case_manager: 'case_manager',
    workforce: 'workforce',
    workforce_partner: 'workforce_partner',
    workforce_board: 'workforce_board',
    workforce_board_admin: 'workforce_board_admin',
    program_holder: 'program_holder',
    provider: 'provider',
    provider_admin: 'provider_admin',
    test_admin: 'test_admin',
    proctor: 'proctor',
  };
  return roleMap[role] || role;
}

export function getRedirectForRole(role: string | null | undefined): string {
  if (!role) return '/login';
  return resolveDashboardUrl(role);
}

export function getLoginRedirect(pathname: string): string {
  const basePath = getBasePath(pathname);
  return ROUTE_REDIRECTS[basePath] || '/lms/dashboard';
}

export function canAccessPortal(role: string | null | undefined, pathname: string): boolean {
  if (!role) return false;
  const basePath = getBasePath(pathname);
  const allowedRoles = PORTAL_ROLE_MAP[basePath];
  if (!allowedRoles) return true;
  return allowedRoles.includes(normalizeRole(role));
}

async function resolveCurrentPath(): Promise<string> {
  const headersList = await headers();
  const raw = headersList.get('x-pathname') || '';
  if (raw) {
    try {
      const url = new URL(raw, 'http://localhost');
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
  return '/';
}

async function loadEffectiveRoles(userId: string): Promise<{ profile: any; effectiveRoles: string[] }> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId);

  const secondaryRoles = (roleRows ?? [])
    .map((row: any) => row.roles?.name)
    .filter((role: unknown): role is string => typeof role === 'string');

  return {
    profile,
    effectiveRoles: Array.from(new Set([profile?.role, ...secondaryRoles].filter(Boolean))) as string[],
  };
}

export async function requireAuth() {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    const pathname = await resolveCurrentPath();
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  return user;
}

export async function requireRoles(allowedRoles: string[]) {
  const user = await requireAuth();
  const { profile, effectiveRoles } = await loadEffectiveRoles(user.id);
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  if (!effectiveRoles.map(normalizeRole).some((role) => normalizedAllowed.includes(role))) {
    redirect('/unauthorized');
  }

  return { user, profile, effectiveRoles };
}

export async function requirePortalAccess() {
  const user = await requireAuth();
  const pathname = await resolveCurrentPath();
  const { profile, effectiveRoles } = await loadEffectiveRoles(user.id);
  const basePath = getBasePath(pathname);
  const allowedRoles = PORTAL_ROLE_MAP[basePath];
  const canAccess = !allowedRoles || effectiveRoles.map(normalizeRole).some((role) => allowedRoles.includes(role));

  if (!canAccess) {
    redirect(resolveDashboardUrl(profile?.role, effectiveRoles));
  }

  const { getAdminClient } = await import('@/lib/supabase/admin');
  const db = await getAdminClient();

  if (db && !isBillingExempt(pathname) && effectiveRoles.map(normalizeRole).includes('apprentice')) {
    const { data: barberSub } = await db
      .from('barber_subscriptions')
      .select('payment_status, suspension_deadline')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const isSuspended =
      barberSub?.payment_status === 'suspended' ||
      (barberSub?.payment_status === 'past_due' &&
        !!barberSub.suspension_deadline &&
        new Date(barberSub.suspension_deadline) < new Date());

    if (isSuspended) redirect('/billing-required?reason=payment_failed');
  }

  return { user, profile, effectiveRoles };
}

export async function checkAuth() {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { profile, effectiveRoles } = await loadEffectiveRoles(user.id);
  return { user, profile, effectiveRoles };
}

export function getDashboardForRole(role: string | null | undefined): string {
  return resolveDashboardUrl(role);
}
