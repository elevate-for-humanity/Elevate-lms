// lib/auth/route-guards.ts
// Unified route guards for all authenticated routes

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { UserRole } from '@/lib/navigation/navigation-config';

// Allowed roles for each portal
const PORTAL_ROLE_MAP: Record<string, UserRole[]> = {
  '/admin': ['admin'],
  '/lms': ['admin', 'student', 'partner', 'program_holder', 'instructor', 'apprentice'],
  '/apprentice': ['admin', 'apprentice', 'instructor'],
  '/instructor': ['admin', 'instructor'],
  '/employer': ['admin', 'employer'],
  '/partner': ['admin', 'partner'],
  '/staff-portal': ['admin', 'staff'],
  '/case-manager': ['admin', 'case_manager'],
  '/sponsor': ['admin', 'sponsor'],
  '/host-shop': ['admin', 'host_shop'],
  '/workforce': ['admin', 'workforce'],
  '/workforce-board': ['admin', 'employer'],
  '/provider': ['admin', 'provider'],
  '/program-holder': ['admin', 'program_holder', 'partner'],
  '/mentor': ['admin', 'mentor'],
  '/student-portal': ['admin', 'student'],
  '/student': ['admin', 'student'],
  '/learner': ['admin', 'student'],
};

// Route to redirect to after login
const ROUTE_REDIRECTS: Record<string, string> = {
  '/admin': '/admin/dashboard',
  '/lms': '/lms/dashboard',
  '/apprentice': '/apprentice',
  '/instructor': '/instructor/dashboard',
  '/employer': '/employer/dashboard',
  '/partner': '/partner/dashboard',
  '/staff-portal': '/staff-portal/dashboard',
  '/case-manager': '/case-manager/dashboard',
  '/sponsor': '/sponsor/dashboard',
  '/host-shop': '/host-shop/dashboard',
  '/workforce': '/workforce/dashboard',
  '/workforce-board': '/workforce-board/dashboard',
  '/provider': '/provider/dashboard',
  '/program-holder': '/program-holder/dashboard',
  '/mentor': '/mentor/dashboard',
  '/student-portal': '/student-portal/dashboard',
  '/student': '/learner/dashboard',
  '/learner': '/learner/dashboard',
};

// Unauthorized redirect per role
const UNAUTHORIZED_REDIRECTS: Record<string, string> = {
  admin: '/admin/dashboard',
  admin: '/admin/dashboard',
  student: '/lms/dashboard',
  apprentice: '/apprentice',
  instructor: '/instructor/dashboard',
  employer: '/employer/dashboard',
  partner: '/partner/dashboard',
  staff: '/staff-portal/dashboard',
  case_manager: '/case-manager/dashboard',
  sponsor: '/sponsor/dashboard',
  host_shop: '/host-shop/dashboard',
  workforce: '/workforce/dashboard',
  workforce_board: '/workforce-board/dashboard',
  provider: '/provider/dashboard',
  program_holder: '/program-holder/dashboard',
  mentor: '/mentor/dashboard',
};

// Billing-exempt routes (don't redirect if subscription is suspended)
const BILLING_EXEMPT_PREFIXES = [
  '/billing-required',
  '/apprentice/billing',
  '/student-portal/billing',
  '/lms/billing',
];

/**
 * Get the base path from the current pathname
 */
export function getBasePath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return '/';
  return '/' + segments[0];
}

/**
 * Check if the current path is billing-exempt
 */
export function isBillingExempt(pathname: string): boolean {
  return BILLING_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Get redirect URL for a role
 */
export function getRedirectForRole(role: string | null | undefined): string {
  if (!role) return '/login';
  return UNAUTHORIZED_REDIRECTS[role] || '/';
}

/**
 * Get redirect URL after login based on requested path
 */
export function getLoginRedirect(pathname: string): string {
  const basePath = getBasePath(pathname);
  return ROUTE_REDIRECTS[basePath] || '/lms/dashboard';
}

/**
 * Check if a role can access a portal
 */
export function canAccessPortal(role: string | null | undefined, pathname: string): boolean {
  if (!role) return false;
  
  const basePath = getBasePath(pathname);
  const allowedRoles = PORTAL_ROLE_MAP[basePath];
  
  if (!allowedRoles) return true; // Unknown portal, allow access
  
  // Map database role names to our role types
  const normalizedRole = normalizeRole(role);
  return allowedRoles.includes(normalizedRole as UserRole);
}

/**
 * Normalize role names from database to our types
 */
export function normalizeRole(role: string): string {
  const roleMap: Record<string, string> = {
    admin: 'admin',
    admin: 'admin',
    student: 'student',
    apprentice: 'apprentice',
    instructor: 'instructor',
    employer: 'employer',
    partner: 'partner',
    staff: 'staff',
    case_manager: 'case_manager',
    sponsor: 'sponsor',
    host_shop: 'host_shop',
    workforce: 'workforce',
    workforce_board: 'workforce_board',
    program_holder: 'program_holder',
    program_holder_staff: 'partner',
    provider: 'provider',
    mentor: 'mentor',
  };
  
  return roleMap[role] || role;
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  
  if (error || !user) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '/';
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }
  
  return user;
}

/**
 * Require specific roles - redirects to unauthorized if role not allowed
 */
export async function requireRoles(allowedRoles: string[]) {
  const user = await requireAuth();
  
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  
  const normalizedRole = normalizeRole(profile?.role || '');
  
  if (!allowedRoles.includes(normalizedRole)) {
    redirect('/unauthorized');
  }
  
  return { user, profile };
}

/**
 * Require portal access based on current pathname
 */
export async function requirePortalAccess() {
  const user = await requireAuth();
  
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '/';
  
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  
  if (!canAccessPortal(profile?.role, pathname)) {
    redirect(getRedirectForRole(profile?.role));
  }
  
  // Check billing status for apprentices
  const { getAdminClient } = await import('@/lib/supabase/admin');
  const db = await getAdminClient();
  
  if (db && !isBillingExempt(pathname)) {
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
    
    if (isSuspended) {
      redirect('/billing-required?reason=payment_failed');
    }
  }
  
  return { user, profile };
}

/**
 * Check if user is authenticated (does not redirect)
 */
export async function checkAuth() {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  
  return { user, profile };
}

/**
 * Get role-based dashboard URL
 */
export function getDashboardForRole(role: string | null | undefined): string {
  if (!role) return '/lms/dashboard';
  return ROUTE_REDIRECTS[`/${normalizeRole(role).replace('_', '-')}`] || '/lms/dashboard';
}
