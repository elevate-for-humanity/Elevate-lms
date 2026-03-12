import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Education domain - landing page at /education, sub-routes pass through
const EDUCATION_DOMAIN = 'elevateforhumanityeducation.com';

// Connects domain - landing page at /connects, sub-routes pass through
const CONNECTS_DOMAIN = 'elevateconnects.org';

// LMS subdomain — learn.elevateforhumanity.org → /lms
const LEARN_SUBDOMAIN = 'learn.elevateforhumanity.org';

// LMS domain (legacy alias — now uses EDUCATION_DOMAIN)
const LMS_DOMAIN = 'elevateforhumanityeducation.com';

// Supersonic Fast Cash domain - routes to /supersonic-fast-cash paths
const SUPERSONIC_DOMAIN = 'supersonicfastermoney.com';

// Platform licensing subdomain - routes to /platform/licensing paths
const PLATFORM_SUBDOMAIN = 'platform.elevateforhumanity.org';

// Routes that require authentication and specific roles
// NOTE: Landing pages (exact match) are PUBLIC for marketing/preview
// Only sub-routes require authentication
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin/dashboard': ['admin', 'super_admin', 'org_admin', 'staff'],
  '/admin/users': ['admin', 'super_admin', 'org_admin'],
  '/admin/programs': ['admin', 'super_admin', 'org_admin', 'staff'],
  '/admin/settings': ['admin', 'super_admin', 'org_admin'],
  '/admin/reports': ['admin', 'super_admin', 'org_admin', 'staff'],
  '/admin/crm': ['admin', 'super_admin', 'org_admin'],
  '/admin/enrollments': ['admin', 'super_admin', 'org_admin', 'staff'],
  '/staff-portal/dashboard': ['staff', 'admin', 'super_admin', 'advisor'],
  '/staff-portal/students': ['staff', 'admin', 'super_admin', 'advisor'],
  '/staff-portal/courses': ['staff', 'admin', 'super_admin', 'advisor'],
  '/instructor/dashboard': ['instructor', 'admin', 'super_admin'],
  '/instructor/courses': ['instructor', 'admin', 'super_admin'],
  '/instructor/students': ['instructor', 'admin', 'super_admin'],
  '/program-holder/dashboard': ['program_holder', 'admin', 'super_admin'],
  '/program-holder/programs': ['program_holder', 'admin', 'super_admin'],
  '/workforce-board/dashboard': ['workforce_board', 'admin', 'super_admin'],
  '/employer-portal': ['employer', 'admin', 'super_admin'],
  '/employer/dashboard': ['employer', 'admin', 'super_admin'],
  '/employer/candidates': ['employer', 'admin', 'super_admin'],
  '/employer/jobs': ['employer', 'admin', 'super_admin'],
  '/employer/reports': ['employer', 'admin', 'super_admin'],
  '/employer/settings': ['employer', 'admin', 'super_admin'],
  // LMS and dashboard routes - require any authenticated user
  '/lms/courses': ['student', 'instructor', 'admin', 'super_admin'],
  '/lms/courses': ['student', 'instructor', 'admin', 'super_admin'],
  '/lms/progress': ['student', 'instructor', 'admin', 'super_admin'],
  '/lms/certificates': ['student', 'instructor', 'admin', 'super_admin'],
  '/client-portal': ['admin', 'super_admin'],
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

// Internal paths that should not be indexed by search engines
const NOINDEX_PREFIXES = [
  '/admin', '/staff-portal', '/instructor', '/partner-portal', '/partner/',
  '/employer-portal', '/employer/', '/program-holder', '/workforce-board',
  '/student-portal', '/client-portal', '/lms/', '/dashboard', '/settings',
  '/api/', '/enrollment/', '/onboarding',
];

// Partner routes that require active partner status
const PARTNER_ROUTES = ['/partner/dashboard', '/partner/programs'];
// Partner routes allowed even without active status (for document upload)
const PARTNER_ONBOARDING_ROUTES = ['/partner/documents', '/partner/onboarding'];

// Routes that require authentication (any role)
const AUTH_REQUIRED_ROUTES = [
  '/student', '/learner', '/my-courses', '/my-progress', '/settings',
  '/onboarding/learner', '/onboarding/employer', '/onboarding/partner',
  '/onboarding/staff', '/onboarding/school',
  '/employer-portal', '/franchise', '/program-holder',
  '/tax-self-prep', '/supersonic-fast-cash/portal',
  '/supersonic-fast-cash/diy-taxes',
];

// Routes that require onboarding completion
const ONBOARDING_REQUIRED_ROUTES = ['/hub', '/lms', '/student-portal', '/my-courses', '/my-progress'];

// Routes that require active enrollment (enrollment_state = 'active' or 'documents_complete')
const ENROLLMENT_REQUIRED_ROUTES = ['/dashboard', '/courses', '/learn', '/lms/courses'];

// Enrollment flow routes (don't redirect these)
const ENROLLMENT_FLOW_ROUTES = ['/enrollment/confirmed', '/enrollment/orientation', '/enrollment/documents'];

// Super admin emails - full platform access (platform owner)
const SUPER_ADMIN_EMAILS = [
  'elizabethpowell6262@gmail.com',
  'elevate4humanityedu@gmail.com',
];

// Admin emails that bypass onboarding requirement (includes super admins)
const ADMIN_EMAILS = [
  'elizabethpowell6262@gmail.com',
  'elevate4humanityedu@gmail.com',
];

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
  // CORS: Block cross-origin API requests from unknown origins
  // ============================================
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
      'https://elevateforhumanity.org',
      'https://www.elevateforhumanity.org',
    ];

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const isWebhook = pathname.includes('/webhook');
    if (!isWebhook && origin && !allowedOrigins.includes(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ============================================
    // API ROUTE AUTH ENFORCEMENT
    // Protect /api/admin/*, /api/staff/*, /api/instructor/* at proxy level
    // Individual routes still have their own checks as defense-in-depth
    // ============================================
    const PROTECTED_API_PREFIXES = [
      '/api/admin/',
      '/api/staff/',
      '/api/instructor/',
      // PII-sensitive routes — defense-in-depth alongside per-route guards
      '/api/identity/',
      '/api/documents/',
      '/api/verification/',
      '/api/tax/',
      '/api/franchise/',
      '/api/wotc/',
      '/api/supersonic-fast-cash/save-tax-return',
      '/api/supersonic-fast-cash/file-return',
      '/api/supersonic-fast-cash/clients',
      '/api/apprentice/documents',
      '/api/onboarding/',
      '/api/compliance/',
      '/api/hr/',
      '/api/reports/',
    ];
    // Public API routes that must not be blocked by auth
    const PUBLIC_API_OVERRIDES = [
      '/api/intake',
      '/api/webhooks',
      '/api/stripe/webhook',
      '/api/supersonic-fast-cash/jotform-webhook',
      '/api/supersonic-fast-cash/refund-tracking',
      '/api/ai-tutor/public',
      '/api/auth',
      '/api/cron',
    ];
    const isPublicApiOverride = PUBLIC_API_OVERRIDES.some(prefix =>
      pathname === prefix || pathname.startsWith(prefix + '/')
    );
    const isProtectedApi = !isPublicApiOverride &&
      PROTECTED_API_PREFIXES.some(prefix => pathname.startsWith(prefix));

    if (isProtectedApi && !isWebhook) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }

      const apiSupabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() { /* read-only for API auth check */ },
        },
      });

      const { data: { user: apiUser } } = await apiSupabase.auth.getUser();
      if (!apiUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // For admin API routes, verify admin/super_admin/staff role
      if (pathname.startsWith('/api/admin/')) {
        const { data: apiProfile } = await apiSupabase
          .from('profiles')
          .select('role')
          .eq('id', apiUser.id)
          .single();

        if (!apiProfile?.role || !['admin', 'super_admin', 'staff'].includes(apiProfile.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      // For instructor API routes, verify instructor/admin role
      if (pathname.startsWith('/api/instructor/')) {
        const { data: apiProfile } = await apiSupabase
          .from('profiles')
          .select('role')
          .eq('id', apiUser.id)
          .single();

        if (!apiProfile?.role || !['instructor', 'admin', 'super_admin'].includes(apiProfile.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // Non-protected API routes pass through
    if (pathname.startsWith('/api/') && !isProtectedApi) {
      return NextResponse.next();
    }
    // Protected API routes that passed auth check also pass through
    if (isProtectedApi) {
      return NextResponse.next();
    }
  }

  // ============================================
  // DOMAIN-BASED ROUTING
  // ============================================

  // Dead legacy path — /student-portal/education never existed, redirect to student portal
  if (pathname === '/student-portal/education' || pathname.startsWith('/student-portal/education/')) {
    return NextResponse.redirect(new URL('/student-portal', request.url), 301);
  }

  // learn.elevateforhumanity.org → /lms
  if (host === LEARN_SUBDOMAIN) {
    if (pathname === '/' || pathname === '') {
      return NextResponse.rewrite(new URL('/lms/dashboard', request.url));
    }
    // Pass sub-routes through (e.g. learn.elevateforhumanity.org/courses → /lms/courses)
    if (!pathname.startsWith('/lms')) {
      return NextResponse.rewrite(new URL(`/lms${pathname}`, request.url));
    }
    return NextResponse.next();
  }

  // Education domain routing (elevateforhumanityeducation.com)
  // Root -> /admin dashboard; all other routes pass through to the full site
  if (host.includes(EDUCATION_DOMAIN)) {
    if (pathname === '/' || pathname === '') {
      return NextResponse.rewrite(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Connects domain routing (elevateconnects.org)
  // Root -> /connects landing page; all other routes pass through to the full site
  if (host.includes(CONNECTS_DOMAIN)) {
    if (pathname === '/' || pathname === '') {
      return NextResponse.rewrite(new URL('/connects', request.url));
    }
    return NextResponse.next();
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

  // ============================================
  // SERVER-SIDE IDLE TIMEOUT (NIST 800-63B)
  // Signs out users after 30 minutes of inactivity.
  // Uses a cookie to track last activity timestamp.
  // ============================================
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  const ACTIVITY_COOKIE = 'efh_last_activity';
  const now = Date.now();
  const lastActivity = request.cookies.get(ACTIVITY_COOKIE)?.value;

  if (lastActivity) {
    const lastActivityTime = parseInt(lastActivity, 10);
    if (!isNaN(lastActivityTime) && (now - lastActivityTime) > IDLE_TIMEOUT_MS) {
      // Session expired due to inactivity — sign out and redirect
      await supabase.auth.signOut();
      const idleUrl = new URL('/login', request.url);
      idleUrl.searchParams.set('reason', 'idle');
      const idleResponse = NextResponse.redirect(idleUrl, { status: 307 });
      idleResponse.cookies.delete(ACTIVITY_COOKIE);
      return idleResponse;
    }
  }

  // Update last activity timestamp
  response.cookies.set(ACTIVITY_COOKIE, now.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: IDLE_TIMEOUT_MS / 1000,
  });

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

    // License holders with admin/super_admin/org_admin/staff role can access their tenant's admin
    if (profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'org_admin' || profile?.role === 'staff') {
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
      return NextResponse.redirect(new URL('/partner/apply', request.url), { status: 307 });
    }

    // For main partner routes, require active status
    if (isPartnerRoute && partnerApp.status !== 'active') {
      // Partner not yet active - redirect to document upload page
      if (partnerApp.status === 'pending_documents' || partnerApp.status === 'documents_submitted') {
        return NextResponse.redirect(new URL('/partner/documents', request.url), { status: 307 });
      }
      // Rejected or other status
      return NextResponse.redirect(new URL('/partner/onboarding', request.url), { status: 307 });
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

  // ============================================
  // NOINDEX FOR INTERNAL PAGES
  // Prevent search engines from indexing portals, admin, and auth-gated routes
  // ============================================
  if (NOINDEX_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
