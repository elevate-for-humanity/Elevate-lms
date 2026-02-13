import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// LMS domain - routes to /student-portal paths
const LMS_DOMAIN = 'elevateforhumanityeducation.com';

// Supersonic Fast Cash domain - routes to /supersonic-fast-cash paths
const SUPERSONIC_DOMAIN = 'supersonicfastermoney.com';

// Platform licensing subdomain - routes to /platform/licensing paths
const PLATFORM_SUBDOMAIN = 'platform.elevateforhumanity.org';

// Routes that require authentication and specific roles
// NOTE: Landing pages (exact match) are PUBLIC for marketing/preview
// Only sub-routes require authentication
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin/dashboard': ['admin', 'super_admin'],
  '/admin/users': ['admin', 'super_admin'],
  '/admin/programs': ['admin', 'super_admin'],
  '/admin/settings': ['admin', 'super_admin'],
  '/admin/reports': ['admin', 'super_admin'],
  '/admin/crm': ['admin', 'super_admin'],
  '/admin/enrollments': ['admin', 'super_admin'],
  '/staff-portal/dashboard': ['staff', 'admin', 'super_admin', 'advisor'],
  '/staff-portal/students': ['staff', 'admin', 'super_admin', 'advisor'],
  '/staff-portal/courses': ['staff', 'admin', 'super_admin', 'advisor'],
  '/instructor/dashboard': ['instructor', 'admin', 'super_admin'],
  '/instructor/courses': ['instructor', 'admin', 'super_admin'],
  '/instructor/students': ['instructor', 'admin', 'super_admin'],
  '/program-holder/dashboard': ['program_holder', 'admin', 'super_admin'],
  '/program-holder/programs': ['program_holder', 'admin', 'super_admin'],
  '/workforce-board/dashboard': ['workforce_board', 'admin', 'super_admin'],
  '/employer-portal/dashboard': ['employer', 'admin', 'super_admin'],
  '/employer/dashboard': ['employer', 'admin', 'super_admin'],
  '/employer/candidates': ['employer', 'admin', 'super_admin'],
  '/employer/jobs': ['employer', 'admin', 'super_admin'],
  '/employer/reports': ['employer', 'admin', 'super_admin'],
  '/employer/settings': ['employer', 'admin', 'super_admin'],
  // LMS and dashboard routes - require any authenticated user
  '/lms/courses': ['student', 'instructor', 'admin', 'super_admin'],
  '/lms/my-courses': ['student', 'instructor', 'admin', 'super_admin'],
  '/lms/progress': ['student', 'instructor', 'admin', 'super_admin'],
  '/dashboard/courses': ['student', 'instructor', 'admin', 'super_admin'],
  '/dashboard/certificates': ['student', 'instructor', 'admin', 'super_admin'],
  '/client-portal/dashboard': ['client', 'admin', 'super_admin'],
};

// Dashboard landing pages that are PUBLIC (for marketing/preview)
const PUBLIC_DASHBOARD_LANDINGS = [
  '/admin',
  '/staff-portal', 
  '/instructor',
  '/program-holder',
  '/workforce-board',
  '/employer-portal',
  '/employer',
  '/student-portal',
  '/partner-portal',
];

// Routes restricted to specific admin emails only (sub-routes, not landing)
const ADMIN_ONLY_ROUTES = ['/admin/dashboard', '/admin/users', '/admin/settings', '/admin/crm'];

// Partner routes that require active partner status
const PARTNER_ROUTES = ['/partner/dashboard', '/partner/programs'];
// Partner routes allowed even without active status (for document upload)
const PARTNER_ONBOARDING_ROUTES = ['/partner/documents', '/partner/onboarding'];

// Routes that require authentication (any role)
const AUTH_REQUIRED_ROUTES = ['/student', '/my-courses', '/my-progress', '/settings'];

// Routes that require onboarding completion
const ONBOARDING_REQUIRED_ROUTES = ['/hub', '/lms', '/student-portal', '/my-courses', '/my-progress'];

// Routes that require active enrollment (enrollment_state = 'active' or 'documents_complete')
const ENROLLMENT_REQUIRED_ROUTES = ['/dashboard', '/courses', '/learn', '/lms/courses'];

// Enrollment flow routes (don't redirect these)
const ENROLLMENT_FLOW_ROUTES = ['/enrollment/confirmed', '/enrollment/orientation', '/enrollment/documents', '/enrollment/placement'];

// Super admin emails - full platform access (platform owner)
const SUPER_ADMIN_EMAILS = ['elizabethpowell6262@gmail.com'];

// Admin emails that bypass onboarding requirement (includes super admins)
const ADMIN_EMAILS = ['elizabethpowell6262@gmail.com'];

// Webhook paths that bypass auth entirely (Stripe signature verification handles security)
// CANONICAL WEBHOOK PATHS (bypass auth)
// Only these two should be registered in Stripe:
// 1. /api/webhooks/stripe - All learner payments
// 2. /api/license/webhook - License lifecycle only
const WEBHOOK_PATHS = [
  '/api/webhooks/stripe',      // Canonical learner webhook
  '/api/license/webhook',      // Canonical license webhook
  '/api/stripe/webhook',       // Deprecated - forwards to canonical
  '/api/store/webhook',        // Deprecated - forwards to canonical
  '/api/store/licenses/webhook', // Deprecated - forwards to canonical
  '/api/donations/webhook',    // Donations (separate product)
];

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // ============================================
  // WEBHOOK BYPASS (PATCH 4.1)
  // Stripe webhooks use signature verification, not auth
  // ============================================
  if (WEBHOOK_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // ============================================
  // DOMAIN-BASED ROUTING
  // ============================================

  // LMS domain routing (elevateforhumanityeducation.com -> /student-portal)
  if (host.includes(LMS_DOMAIN)) {
    // Skip for static files and API routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Root of LMS domain -> student portal
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/student-portal', request.url));
    }

    // Already on /student-portal path, allow through
    if (pathname.startsWith('/student-portal')) {
      return NextResponse.next();
    }

    // Login/auth pages - allow through
    if (pathname === '/login' || pathname === '/signup' || pathname === '/unauthorized') {
      return NextResponse.next();
    }

    // Common student routes - rewrite to /student-portal/*
    const studentRoutes = ['/my-courses', '/my-progress', '/courses', '/programs', '/certificates', '/settings'];
    if (studentRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.rewrite(new URL(`/student-portal${pathname}`, request.url));
    }

    // Default: rewrite to /student-portal/*
    return NextResponse.rewrite(new URL(`/student-portal${pathname}`, request.url));
  }

  // Supersonic Fast Cash domain routing (supersonicfastermoney.com -> /supersonic-fast-cash)
  if (host.includes(SUPERSONIC_DOMAIN)) {
    // Skip for static files and API routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Root of Supersonic domain -> supersonic-fast-cash homepage
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/supersonic-fast-cash', request.url));
    }

    // Already on /supersonic-fast-cash path, allow through
    if (pathname.startsWith('/supersonic-fast-cash')) {
      return NextResponse.next();
    }

    // Login/auth pages - allow through
    if (pathname === '/login' || pathname === '/signup' || pathname === '/unauthorized') {
      return NextResponse.next();
    }

    // Rewrite all other paths to /supersonic-fast-cash/*
    return NextResponse.rewrite(new URL(`/supersonic-fast-cash${pathname}`, request.url));
  }

  // Platform subdomain routing (platform.elevateforhumanity.org -> /platform/licensing)
  if (host === PLATFORM_SUBDOMAIN || host === 'platform.elevateforhumanity.org') {
    // Skip for static files and API routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Root of platform subdomain -> licensing page
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/platform/licensing', request.url));
    }

    // Already on /platform path, allow through
    if (pathname.startsWith('/platform')) {
      return NextResponse.next();
    }

    // Rewrite all other paths to /platform/licensing/*
    return NextResponse.rewrite(new URL(`/platform/licensing${pathname}`, request.url));
  }

  // Redirect non-www .org to www .org
  if (host === 'elevateforhumanity.org') {
    const url = request.nextUrl.clone();
    url.host = 'www.elevateforhumanity.org';
    url.protocol = 'https';
    url.port = '';
    return NextResponse.redirect(url, { status: 308 });
  }

  // ============================================
  // AUTH PROTECTION
  // ============================================

  // Skip auth check for public routes, static files, API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/unauthorized'
  ) {
    return NextResponse.next();
  }

  // Dashboard landing pages are PUBLIC (exact match only)
  // This allows marketing/preview of dashboard features
  const isPublicDashboardLanding = PUBLIC_DASHBOARD_LANDINGS.some(
    (landing) => pathname === landing || pathname === `${landing}/`
  );
  
  if (isPublicDashboardLanding) {
    return NextResponse.next();
  }

  // Check if route requires protection
  const protectedRoute = Object.keys(PROTECTED_ROUTES).find((route) =>
    pathname.startsWith(route)
  );
  const authRequired = AUTH_REQUIRED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!protectedRoute && !authRequired) {
    return NextResponse.next();
  }

  // Create Supabase client for auth check
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Not authenticated - redirect to login with return URL
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl, { status: 307 });
  }

  // Check if route is admin-only
  const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isAdminOnlyRoute) {
    // Super admins (platform owner) have full access
    if (SUPER_ADMIN_EMAILS.includes(user.email || '')) {
      return response;
    }

    // For license holders - check if they are admin of their own tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    // License holders with admin/super_admin role can access their tenant's admin
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      // They can only access admin for their own tenant
      // Inject tenant context for downstream handlers
      if (profile.tenant_id) {
        response.headers.set('x-tenant-id', profile.tenant_id);
      }
      return response;
    }

    // Staff with admin permissions granted by license holder
    if (profile?.role === 'staff') {
      // Check if staff has admin permissions for their tenant
      const { data: permissions } = await supabase
        .from('staff_permissions')
        .select('can_access_admin')
        .eq('user_id', user.id)
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (permissions?.can_access_admin) {
        if (profile.tenant_id) {
          response.headers.set('x-tenant-id', profile.tenant_id);
        }
        return response;
      }
    }

    // No access
    return NextResponse.redirect(new URL('/unauthorized', request.url), { status: 307 });
  }

  // Check role for protected routes
  if (protectedRoute && !isAdminOnlyRoute) {
    const allowedRoles = PROTECTED_ROUTES[protectedRoute];
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url), { status: 307 });
    }
  }

  // Check onboarding completion for restricted routes
  const requiresOnboarding = ONBOARDING_REQUIRED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (requiresOnboarding) {
    // Skip onboarding check for the onboarding pages themselves
    if (pathname.startsWith('/onboarding') || pathname === '/hub/welcome') {
      return response;
    }

    // Admin emails bypass onboarding requirement
    if (ADMIN_EMAILS.includes(user.email || '')) {
      return response;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed, role')
      .eq('id', user.id)
      .single();

    // Admins and super_admins bypass onboarding
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      return response;
    }

    // Check if user has completed onboarding status
    const { data: onboardingStatus } = await supabase
      .from('user_onboarding_status')
      .select('status, agreements_signed')
      .eq('user_id', user.id)
      .single();

    // If no onboarding record or incomplete, redirect to legal agreements
    if (!onboardingStatus || onboardingStatus.status !== 'complete') {
      return NextResponse.redirect(new URL('/onboarding/legal', request.url), { status: 307 });
    }

    // If agreements not signed, redirect to legal agreements
    if (!onboardingStatus.agreements_signed) {
      return NextResponse.redirect(new URL('/onboarding/legal', request.url), { status: 307 });
    }

    // Legacy check - if onboarding not completed in profile, redirect
    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url), { status: 307 });
    }
  }

  // ============================================
  // ENROLLMENT STATE CHECK
  // ============================================
  const requiresEnrollment = ENROLLMENT_REQUIRED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isEnrollmentFlowRoute = ENROLLMENT_FLOW_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (requiresEnrollment && !isEnrollmentFlowRoute) {
    // Check enrollment state
    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('enrollment_state')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrollment) {
      const state = enrollment.enrollment_state;
      
      // Only allow access if enrollment is active or documents_complete
      if (state !== 'active' && state !== 'documents_complete') {
        // Redirect to appropriate enrollment step
        let redirectPath = '/enrollment/confirmed';
        
        if (state === 'confirmed') {
          redirectPath = '/enrollment/orientation';
        } else if (state === 'orientation_complete') {
          redirectPath = '/enrollment/documents';
        }
        
        return NextResponse.redirect(new URL(redirectPath, request.url), { status: 307 });
      }
    }
  }

  // ============================================
  // PARTNER STATUS CHECK
  // ============================================
  // Partners must have active status to access main partner routes
  const isPartnerRoute = PARTNER_ROUTES.some((route) => pathname.startsWith(route));
  const isPartnerOnboardingRoute = PARTNER_ONBOARDING_ROUTES.some((route) => pathname.startsWith(route));

  if (isPartnerRoute || isPartnerOnboardingRoute) {
    const { data: partnerApp } = await supabase
      .from('partner_applications')
      .select('status')
      .eq('user_id', user.id)
      .single();

    if (!partnerApp) {
      // No partner application - redirect to apply
      return NextResponse.redirect(new URL('/partners/apply', request.url), { status: 307 });
    }

    // For main partner routes, require active status
    if (isPartnerRoute && partnerApp.status !== 'active') {
      // Partner not yet active - redirect to document upload page
      if (partnerApp.status === 'pending_documents' || partnerApp.status === 'documents_submitted') {
        return NextResponse.redirect(new URL('/partner/documents', request.url), { status: 307 });
      }
      // Rejected or other status
      return NextResponse.redirect(new URL('/partners/status', request.url), { status: 307 });
    }

    // Inject partner status for downstream handlers
    response.headers.set('x-partner-status', partnerApp.status);
  }

  // ============================================
  // TENANT CONTEXT INJECTION (STEP 4B)
  // ============================================
  // Inject tenant context headers for downstream route handlers
  const tenantId = user.user_metadata?.tenant_id;
  const userRole = user.user_metadata?.role || 'user';

  if (tenantId) {
    response.headers.set('x-tenant-id', tenantId);
  }
  response.headers.set('x-user-id', user.id);
  response.headers.set('x-user-role', userRole);

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
