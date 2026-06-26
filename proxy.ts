import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { checkAdminIPAsync } from '@/lib/api/admin-ip-guard';
import {
  rewriteCustomDomainRequest,
  rewriteTenantAppHostRequest,
  tenantSlugFromAppHost,
} from '@/lib/tenant/middleware-tenant-routing';

// ── Module-level constants ────────────────────────────────────────────────────

// DEFAULT_ADMIN_URL removed — admin subdomain deprecated
// Legacy admin path redirects moved to next.config.mjs (LEGACY ADMIN PATH CONSOLIDATION section).
// next.config.mjs handles these as static 308 redirects at the routing layer.

// Webhook paths bypass auth — Stripe signature verification handles security.
const WEBHOOK_PATHS = [
  '/api/webhooks/stripe',
  '/api/webhooks/',
  '/api/license/webhook',
  '/api/stripe/webhook',
  '/api/donate/webhook',
  '/api/barber/webhook',
  '/api/micro-classes/webhook',
  '/api/sezzle/webhook',
  '/api/payments/webhook',
  '/api/csp-report',
];

const CANONICAL_ADMIN_HOST = 'admin.elevateforhumanity.org';

/** Canonical admin hostname for redirects. */
function resolveCanonicalAdminHost(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_ADMIN_URL || '').trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).host.toLowerCase();
    } catch {
      /* fall through */
    }
  }
  return CANONICAL_ADMIN_HOST;
}

// Role-gated routes: key = path prefix, value = allowed roles.
// Consolidated - use wildcard /prefix/ for group routes instead of individual paths.
const PROTECTED_ROUTES: Record<string, string[]> = {
  // ── Employer Portal ───────────────────────────────────────────────
  '/employer/':               ['employer', 'sponsor', 'admin'],

  // ── Partner Portal ───────────────────────────────────────────────
  '/partner/':                ['partner', 'partner_admin', 'admin'],

  // ── Program Holder Portal ─────────────────────────────────────────
  '/program-holder/':         ['program_holder', 'admin', 'staff', 'org_admin'],

  // ── LMS / Student Portal ─────────────────────────────────────────
  '/lms/':                     ['student', 'grant_client', 'partner', 'program_holder', 'admin', 'staff', 'instructor'],
  '/learner/':                 ['student', 'delegate', 'grant_client', 'admin', 'staff', 'instructor'],

  // ── Mentor Portal ─────────────────────────────────────────────────
  '/mentor/':                  ['mentor', 'admin'],

  // ── Workforce / Case Management ──────────────────────────────────
  '/workforce-board/':         ['workforce_board', 'admin', 'staff'],
  '/case-manager/':            ['case_manager', 'admin', 'staff'],

  // ── Provider / Creator ───────────────────────────────────────────
  '/provider/':                ['provider_admin', 'admin'],
  '/creator/':                 ['creator', 'admin'],

  // ── Instructor ────────────────────────────────────────────────────
  '/instructor/':              ['instructor', 'admin', 'staff'],

  // ── Field Portals ─────────────────────────────────────────────────
  '/portal/':                  ['student', 'partner', 'program_holder', 'admin', 'staff', 'instructor'],
  '/apprentice/':              ['student', 'partner', 'program_holder', 'admin', 'staff', 'instructor'],

  // ── Host Shop ────────────────────────────────────────────────────
  '/admin/host-shop/':         ['host_shop', 'admin', 'staff'],

  // ── Orphaned routes needing protection ───────────────────────────
  '/verify-identity':          ['student', 'admin', 'staff'],
  '/cm/':                      ['case_manager', 'admin', 'staff'],
  '/card':                     ['student', 'admin', 'staff'],
  '/career-services/':         ['student', 'admin', 'staff'],
  '/funding/confirm':          ['student', 'admin', 'staff'],
  '/ferpa/':                   ['student', 'admin', 'staff'],
  '/account/':                 ['student', 'admin', 'staff'],
  '/shop/':                    ['employer', 'admin', 'staff'],
  '/host-shop/':               ['host_shop', 'admin', 'staff'],
  '/file-manager/':            ['student', 'admin', 'staff'],
  '/parent-portal/':           ['parent', 'admin', 'staff'],
  '/billing':                  ['student', 'admin', 'staff'],
  '/license':                  ['student', 'admin', 'staff'],
};

/**
 * Auth prefix match — avoids false positives like /apprenticeships matching /apprentice.
 * Requires exact path or a proper path segment boundary (/prefix/...).
 */
function pathMatchesAuthPrefix(pathname: string, prefix: string): boolean {
  if (prefix.endsWith('/')) {
    const base = prefix.slice(0, -1);
    return pathname === base || pathname.startsWith(prefix);
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Marketing / public content — never gate behind login in middleware. */
const PUBLIC_MARKETING_PREFIXES = [
  '/apprenticeships',
  '/programs/',
  '/partners/',
  '/apply',
  '/for-employers',
  '/apprenticeship-sponsor',
  '/pwa',
];

/** Exact public routes (portal hub, role-specific login pages). */
const PUBLIC_EXACT_ROUTES = new Set([
  '/portals',
  '/login/apprentice',
]);

// Routes requiring authentication (any role).
const AUTH_REQUIRED_ROUTES = [
  '/lms/dashboard',
  '/lms/courses/',
  '/lms/programs/',
  '/my-courses',
  '/my-progress',
  '/settings',
  '/profile',
  '/hub/',
  '/enrollment/',
  '/proctor/',
  '/proctor',
  '/learner/',
  '/student-portal',
  '/instructor/',
  '/apprentice',
  '/portal/',
  '/dashboards',
  '/case-manager/',
  '/case-manager',
  '/account/',
  '/my-dashboard',
  '/notifications',
  '/messages',
  '/certificates',
  '/achievements',
  '/employer/',
  '/partner/',
  '/mentor/',
  '/workforce-board/',
  '/provider/',
  '/creator/',
  // Routes that were manually guarding with redirect('/login') in page components
  '/documents',
  '/license/onboarding',
  '/schedule/select',
  '/program-holder/',
  '/partner-learning/',
];

// Routes requiring onboarding completion before access.
const ONBOARDING_REQUIRED_ROUTES = [
  '/hub/',
  '/lms/',
  '/my-courses',
  '/my-progress',
];

// Routes requiring an active enrollment.
const ENROLLMENT_REQUIRED_ROUTES = [
  '/lms/courses/',
  '/lms/programs/',
];

// Enrollment flow routes — exempt from the enrollment gate (they ARE the flow).
const ENROLLMENT_FLOW_ROUTES = [
  '/enrollment/',
  '/programs/',
  '/apply',
  '/check-eligibility',
];

// Partner routes requiring active partner status.
const PARTNER_ROUTES = [
  '/partner/dashboard',
  '/partner/programs/',
  '/partner/courses/',
];

// Partner routes allowed before active status (document upload, onboarding).
const PARTNER_ONBOARDING_ROUTES = [
  '/partner/documents',
  '/partner/onboarding',
  '/partner/apply',
];

// Dashboard landing pages that are PUBLIC (exact match — marketing/preview).
// NOTE: /employer-portal and /partner-portal removed — those paths redirect to
// canonical dashboards at the next.config.mjs layer; no middleware bypass needed.
const PUBLIC_DASHBOARD_LANDINGS = [
  '/program-holder',
  '/workforce-board',
  '/employer',
  '/partner',
  '/mentor',
];

// Paths that get X-Robots-Tag: noindex, nofollow.
const NOINDEX_PREFIXES = [
  '/admin',
  '/lms/',
  '/learner/',
  '/apprentice',
  '/portal/',
  '/program-holder',
  '/workforce-board',
  '/employer',
  '/student-portal',
  '/portals',
  '/dashboards',
  '/partner/',
  '/mentor/',
  '/hub/',
  '/enrollment/',
  '/onboarding',
  '/settings',
  '/profile',
  '/case-manager/',
  '/provider/',
  '/creator/',
  '/instructor/',
  '/staff-portal/',
];

function inferApiRateLimitTier(pathname: string): 'strict' | 'contact' | 'api' | 'auth' | 'payment' | 'public' | null {
  // Webhooks are signature-authenticated and can receive burst retries from providers.
  if (pathname.includes('/webhook')) return null;

  // Cron routes are protected by secrets and should not be throttled by client IP.
  if (pathname === '/api/cron' || pathname.startsWith('/api/cron/')) return null;

  if (pathname === '/api/auth' || pathname.startsWith('/api/auth/')) return 'auth';

  if (
    pathname.includes('/checkout') ||
    pathname.includes('/payment') ||
    pathname.includes('/billing') ||
    pathname.startsWith('/api/stripe/') ||
    pathname.startsWith('/api/sezzle/') ||
    pathname.startsWith('/api/affirm/')
  ) {
    return 'payment';
  }

  if (
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/') ||
    pathname === '/api/staff' ||
    pathname.startsWith('/api/staff/') ||
    pathname === '/api/instructor' ||
    pathname.startsWith('/api/instructor/')
  ) {
    return 'strict';
  }

  if (
    pathname === '/api/contact' ||
    pathname.startsWith('/api/contact/') ||
    pathname.includes('/schedule-consultation')
  ) {
    return 'contact';
  }

  if (
    pathname.startsWith('/api/ai-tutor/public') ||
    pathname.startsWith('/api/public/')
  ) {
    return 'public';
  }

  return 'api';
}

// Admin emails that bypass the onboarding gate.
const ADMIN_EMAILS: string[] = [
  'elizabethpowell6262@gmail.com',
];

// ── Middleware entry point ────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const hostWithoutPort = host.split(':')[0];
  const { pathname, search } = request.nextUrl;
  const canonicalAdminHost = resolveCanonicalAdminHost();

  const requestHeaders = new Headers(request.headers);

  // Propagate or generate a trace_id for every request.
  // Downstream handlers read x-trace-id from headers() for structured logging.
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID();
  requestHeaders.set('x-trace-id', traceId);
  requestHeaders.set('x-pathname', pathname);

  function nextWithPathname() {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const isLocalHost =
    hostWithoutPort === 'localhost' ||
    hostWithoutPort === '127.0.0.1' ||
    hostWithoutPort === '::1';

  // Gitpod preview environments — bypass enrollment/onboarding gates so
  // developers can access protected routes without a live enrollment record.
  const isGitpodPreview =
    hostWithoutPort.endsWith('.gitpod.io') ||
    hostWithoutPort.endsWith('.gitpod.app') ||
    hostWithoutPort.endsWith('.preview.gitpod-dev.com') ||
    (process.env.GITPOD_WORKSPACE_URL !== undefined && isLocalHost);

  // Admin routes are now in the main app at /admin/* — no redirect to subdomain needed.
  // The standalone admin subdomain (admin.elevateforhumanity.org) has been deprecated.

  // ── BYPASS POLICY ────────────────────────────────────────────────────────────
  // Single definition. No other branch in this file references SKIP_ADMIN_AUTH.
  // allowDevAdminBypass is false in all production builds: NODE_ENV is set to
  // 'production' by Next.js at build time, making this unreachable
  // regardless of any env var that may be set in the deployment environment.
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowDevAdminBypass = isDevelopment && process.env.SKIP_ADMIN_AUTH === 'true';

  // Production misconfiguration guard — bypass remains disabled, but the
  // presence of SKIP_ADMIN_AUTH in a production environment is logged as an
  // error so a bad deployment is caught immediately.
  if (!isDevelopment && process.env.SKIP_ADMIN_AUTH) {
    console.error(
      '[SECURITY] SKIP_ADMIN_AUTH is set in a non-development environment. ' +
        'Bypass is disabled (NODE_ENV !== development), but this configuration is invalid and must be removed.',
    );
  }
  // ─────────────────────────────────────────────────────────────────────────────

  // ============================================
  // WEBHOOK BYPASS (PATCH 4.1)
  // Stripe webhooks use signature verification, not auth
  // ============================================
  if (WEBHOOK_PATHS.some((path) => pathname.startsWith(path))) {
    return nextWithPathname();
  }

  // ============================================
  // CORS: Block cross-origin API requests from unknown origins
  // ============================================
  if (pathname.startsWith('/api/')) {
    const rateLimitTier = inferApiRateLimitTier(pathname);
    if (rateLimitTier) {
      const blocked = await applyRateLimit(request, rateLimitTier);
      if (blocked) return blocked;
    }

    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
      'https://www.elevateforhumanity.org',
      'https://elevateforhumanity.org',
      // Allow local dev requests (Postman, dev proxy, etc.)
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
    ];

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin':
            origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
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
      '/api/franchise/',
      '/api/wotc/',
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
      '/api/ai-tutor/public',
      '/api/auth',
      '/api/cron',
    ];
    const isPublicApiOverride = PUBLIC_API_OVERRIDES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
    );
    const isProtectedApi =
      !isPublicApiOverride && PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

    if (isProtectedApi && !isWebhook) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
      }

      const { createServerClient } = await import('@supabase/ssr');
      const apiSupabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            /* read-only for API auth check */
          },
        },
      });

      const {
        data: { user: apiUser },
      } = await apiSupabase.auth.getUser();
      if (!apiUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // For admin API routes, verify admin/admin/staff role + IP allowlist
      if (pathname.startsWith('/api/admin/')) {
        const ipBlocked = await checkAdminIPAsync(request);
        if (ipBlocked) return ipBlocked;

        const { data: apiProfile } = await apiSupabase
          .from('profiles')
          .select('role')
          .eq('id', apiUser.id)
          .single();

        if (
          !apiProfile?.role ||
          !['admin', 'org_admin', 'staff', 'admin'].includes(apiProfile.role)
        ) {
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

        if (
          !apiProfile?.role ||
          !['instructor', 'admin'].includes(apiProfile.role)
        ) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // Non-protected API routes pass through
    if (pathname.startsWith('/api/') && !isProtectedApi) {
      return nextWithPathname();
    }
    // Protected API routes that passed auth check also pass through
    if (isProtectedApi) {
      return nextWithPathname();
    }
  }

  // ============================================
  // DOMAIN-BASED ROUTING
  // ============================================

  // Dead legacy path — /student-portal/education never existed, redirect to canonical learner dashboard
  if (
    pathname === '/student-portal/education' ||
    pathname.startsWith('/student-portal/education/')
  ) {
    return NextResponse.redirect(new URL('/learner/dashboard', request.url), 301);
  }

  // Public-site canonicalization.

  // Canonical public site is www (Durable apex cannot CNAME-flatten to Northflank — use URL forward at DNS).
  if (hostWithoutPort === 'elevateforhumanity.org') {
    const url = request.nextUrl.clone();
    url.host = 'www.elevateforhumanity.org';
    url.protocol = 'https';
    url.port = '';
    return NextResponse.redirect(url, { status: 308 });
  }

  // Unknown-host fallback → apex (not www).
  // app.elevateforhumanity.org — tenant portal entry point (query-param form).
  // e.g. app.elevateforhumanity.org/admin?org=elizabeth-greene
  if (hostWithoutPort === 'app.elevateforhumanity.org') {
    const tenantSlug = request.nextUrl.searchParams.get('org') || '';
    const requestHeadersWithTenant = new Headers(requestHeaders);
    if (tenantSlug) requestHeadersWithTenant.set('x-tenant-slug', tenantSlug);
    requestHeadersWithTenant.set('x-pathname', pathname);

    if (pathname === '/' || pathname === '/admin' || pathname.startsWith('/admin/')) {
      const adminPath = pathname === '/' || pathname === '/admin' ? '/admin/dashboard' : pathname;
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = adminPath;
      return NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeadersWithTenant },
      });
    }

    return NextResponse.next({ request: { headers: requestHeadersWithTenant } });
  }

  // {subdomain}.app.elevateforhumanity.org — tenant public site + admin on same host.
  const tenantSubdomainSlug = tenantSlugFromAppHost(hostWithoutPort);
  if (tenantSubdomainSlug) {
    return rewriteTenantAppHostRequest(
      request,
      tenantSubdomainSlug,
      pathname,
      requestHeaders,
    );
  }

  const isCanonicalHost =
    hostWithoutPort === 'www.elevateforhumanity.org' ||
    hostWithoutPort === canonicalAdminHost ||
    hostWithoutPort === 'app.elevateforhumanity.org';
  if (
    hostWithoutPort &&
    !isCanonicalHost &&
    !isLocalHost &&
    !isGitpodPreview
  ) {
    // Custom tenant domains — resolve slug in tenant-site via x-tenant-host.
    if (
      !pathname.startsWith('/api/') &&
      !pathname.startsWith('/_next') &&
      pathname !== '/login' &&
      !pathname.startsWith('/login/')
    ) {
      return rewriteCustomDomainRequest(request, hostWithoutPort, pathname, requestHeaders);
    }
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
    pathname.startsWith('/login/') ||
    PUBLIC_EXACT_ROUTES.has(pathname) ||
    pathname === '/admin-login' ||
    pathname === '/signup' ||
    pathname === '/unauthorized' ||
    // Admin PWA install page — intentionally public, not linked from nav.
    // Lives outside /admin/ to avoid the admin layout auth gate.
    pathname === '/install-app'
  ) {
    return nextWithPathname();
  }

  // Dashboard landing pages are PUBLIC (exact match only)
  // This allows marketing/preview of dashboard features
  const isPublicDashboardLanding = PUBLIC_DASHBOARD_LANDINGS.some(
    (landing) => pathname === landing || pathname === `${landing}/`,
  );

  if (isPublicDashboardLanding) {
    return nextWithPathname();
  }

  if (PUBLIC_MARKETING_PREFIXES.some((prefix) => pathMatchesAuthPrefix(pathname, prefix))) {
    return nextWithPathname();
  }

  // Admin namespace (/admin/*) is canonicalized to NEXT_PUBLIC_ADMIN_URL above.
  // The LMS middleware does not own /admin route rendering.

  // All routes are publicly accessible - no auth protection in middleware
  // Authentication is handled at the component/page level if needed
  return nextWithPathname();
}

// Sentry's wrappingLoader auto-adds a 'proxy' export — do not add one manually.
export default middleware;

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
