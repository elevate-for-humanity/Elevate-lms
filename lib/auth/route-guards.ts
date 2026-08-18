// lib/auth/route-guards.ts
// Canonical route guards for authenticated portals.

import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { resolveDashboardUrl } from '@/lib/routing/dashboard-resolver';
import {
  ADMIN_ROLES,
  ALL_AUTHENTICATED_ROLES,
  APPRENTICE_ROLES,
  EMPLOYER_ROLES,
  HOST_SHOP_ROLES,
  INSTRUCTOR_ROLES,
  PROGRAM_HOLDER_ROLES,
  STAFF_ROLES,
  TESTING_CENTER_ROLES,
  WORKFORCE_ROLES,
  hasAnyRole,
  normalizeRole,
  normalizeRoles,
} from '@/lib/rbac/role-matrix';

const PORTAL_ROLE_MAP: Record<string, readonly string[]> = {
  '/admin': ADMIN_ROLES,
  '/lms': ALL_AUTHENTICATED_ROLES,
  '/learner': ALL_AUTHENTICATED_ROLES,
  '/apprentice': APPRENTICE_ROLES,
  '/portal': ['super_admin', 'admin', 'student', 'learner', 'apprentice'],
  '/instructor': INSTRUCTOR_ROLES,
  '/employer': EMPLOYER_ROLES,
  '/staff-portal': STAFF_ROLES,
  '/case-manager': WORKFORCE_ROLES,
  '/host-shop': HOST_SHOP_ROLES,
  '/workforce': WORKFORCE_ROLES,
  '/workforce-board': [...WORKFORCE_ROLES, 'workforce_board', 'workforce_board_admin'],
  '/provider': ['super_admin', 'admin', 'provider', 'provider_admin'],
  '/program-holder': PROGRAM_HOLDER_ROLES,
  '/parent-portal': ['parent', 'admin', 'staff'],
  '/creator': ['creator', 'admin'],
  '/proctor': TESTING_CENTER_ROLES,
  '/testing-center': TESTING_CENTER_ROLES,
};

const ROUTE_REDIRECTS: Record<string, string> = {
  '/admin': '/lms/dashboard',
  '/lms': '/lms/dashboard',
  '/learner': '/lms/dashboard',
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
  '/parent-portal': '/parent-portal/dashboard',
  '/creator': '/creator/products',
  '/proctor': '/testing-center',
  '/testing-center': '/testing-center',
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

export { normalizeRole };

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
  return hasAnyRole([role], allowedRoles, { adminOverride: true });
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

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_roles').select('roles(name)').eq('user_id', userId),
  ]);

  const secondaryRoles = (roleRows ?? [])
    .map((row: any) => row.roles?.name)
    .filter((role: unknown): role is string => typeof role === 'string');

  return {
    profile,
    effectiveRoles: normalizeRoles([profile?.role, ...secondaryRoles]),
  };
}

export async function requireAuth() {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const pathname = await resolveCurrentPath();
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  return user;
}

export async function requireRoles(allowedRoles: readonly string[]) {
  const user = await requireAuth();
  const { profile, effectiveRoles } = await loadEffectiveRoles(user.id);

  if (!hasAnyRole(effectiveRoles, allowedRoles, { adminOverride: true })) {
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
  const canAccess = !allowedRoles || hasAnyRole(effectiveRoles, allowedRoles, { adminOverride: true });

  if (!canAccess) {
    redirect(resolveDashboardUrl(profile?.role, effectiveRoles));
  }

  const { getAdminClient } = await import('@/lib/supabase/admin');
  const db = await getAdminClient();
  const hasApprenticeBillingRole = hasAnyRole(
    effectiveRoles,
    ['apprentice', 'barber_apprentice', 'cosmetology_apprentice'],
    { adminOverride: false },
  );

  if (db && !isBillingExempt(pathname) && hasApprenticeBillingRole) {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { profile, effectiveRoles } = await loadEffectiveRoles(user.id);
  return { user, profile, effectiveRoles };
}

export function getDashboardForRole(role: string | null | undefined): string {
  return resolveDashboardUrl(role);
}
