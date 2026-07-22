/**
 * Unified Middleware
 * 
 * Handles domain-based routing and security headers for the unified platform.
 * All three domains (www, app, admin) route to the same container.
 * 
 * Target Architecture:
 * - www.elevateforhumanity.org → Marketing/public routes
 * - app.elevateforhumanity.org → LMS/student routes
 * - admin.elevateforhumanity.org → Admin routes
 * 
 * All APIs are in the unified app/api/ tree.
 */

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Canonical route redirects - embedded directly to work in edge runtime
// Source: lib/routes/canonical-routes.json
const CANONICAL_REDIRECTS: Array<[from: string, to: string]> = [
  ['/apply/barber', '/partners/barber-host-shop/apply'],
  ['/partners/barbershop-apprenticeship', '/partners/barber-host-shop'],
  ['/partners/barbershop-apprenticeship/:path*', '/partners/barber-host-shop/:path*'],
  ['/ebook/barber-theory', '/programs/barber-apprenticeship'],
  ['/pwa/barber', '/programs/barber-apprenticeship'],
];

// Image .jpg → .webp redirects
const IMAGE_REDIRECTS: Array<[from: string, to: string]> = [
  ['/hero-images/how-it-works-hero.jpg', '/hero-images/how-it-works-hero.webp'],
  ['/images/hero-images/about-hero.jpg', '/images/hero-images/about-hero.webp'],
];

const PUBLIC_PATHS = [
  '/api/health',
  '/api/version',
  '/api/ping',
  '/api/ready',
  '/apply',
  '/auth/confirm',
  '/auth/reset-password',
  '/login',
  '/unauthorized',
  '/forgot-password',
  '/signup',
  '/verify-email',
  '/update-password',
];

const ADMIN_PATHS = [
  '/admin',
  '/api/admin',
  '/api/staff',
  '/api/devstudio',
  '/api/platform',
];

const STUDENT_PATHS = [
  '/lms',
  '/student',
  '/instructor',
  '/employer',
  '/program-holder',
  '/api/enrollments',
  '/api/courses',
  '/api/grades',
  '/api/attendance',
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getHost(req: NextRequest): string {
  return req.headers.get('host')?.split(':')[0]?.toLowerCase() || 'localhost';
}

function isLocalhost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function getSessionCookieName(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const match = url.match(/https?:\/\/([^.]+)\./);
  return match?.[1] ? `sb-${match[1]}-auth-token` : 'sb-elevate-auth-token';
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.[a-z0-9]+$/i.test(pathname);
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(p => pathname.startsWith(p));
}

function isStudentPath(pathname: string): boolean {
  return STUDENT_PATHS.some(p => pathname.startsWith(p));
}

// =============================================================================
// SECURITY HEADERS
// =============================================================================

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

// =============================================================================
// MAIN MIDDLEWARE HANDLER
// =============================================================================

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = getHost(request);
  const isLocal = isLocalhost(host);

  // =============================================================================
  // HIGH-PRIORITY PROGRAM SLUG REDIRECTS
  // These MUST run before any page resolution to ensure proper HTTP 307 redirects.
  // Critical for SEO - prevents dynamic [program] route from catching these first.
  // =============================================================================
  const PROGRAM_SLUG_REDIRECTS: Array<[from: string, to: string]> = [
    ['/programs/barber', '/programs/barber-apprenticeship'],
    ['/programs/hvac', '/programs/hvac-technician'],
    ['/programs/finance-bookkeeping-accounting', '/programs/bookkeeping'],
  ];

  for (const [from, to] of PROGRAM_SLUG_REDIRECTS) {
    if (pathname === from) {
      const url = request.nextUrl.clone();
      url.pathname = to;
      url.search = '';
      return NextResponse.redirect(url, 308);
    }
  }

  // =============================================================================
  // LEGACY ROUTE REDIRECTS (MUST CHECK FIRST - before public paths)
  // All redirects are permanent (308) to preserve SEO equity.
  // =============================================================================

  // ── Reflexive URL redirects (/foo/foo → /foo) ──────────────────────────────
  const REFLEXIVE_REDIRECTS: Array<[from: string, to: string]> = [
    // Admin CRM mirror tree (app/admin/crm/crm/ was identical to app/admin/crm/)
    ['/admin/crm/crm', '/admin/crm'],
    // Admin governance mirror
    ['/admin/governance/governance', '/admin/governance'],
    // Public reflexive routes
    ['/accessibility/accessibility', '/accessibility'],
    ['/ai-chat/ai-chat', '/ai-chat'],
    ['/ai/ai', '/ai'],
    ['/calendar/calendar', '/calendar'],
    ['/pay/pay', '/pay'],
    ['/press/press', '/press'],
    ['/resources/resources', '/resources'],
    ['/verify/verify', '/verify'],
    ['/pathways/pathways', '/pathways'],
    ['/success-stories/success-stories', '/success-stories'],
  ];

  for (const [from, to] of REFLEXIVE_REDIRECTS) {
    if (pathname === from || pathname.startsWith(`${from}/`)) {
      const url = request.nextUrl.clone();
      url.pathname = to + pathname.slice(from.length);
      url.search = '';
      return NextResponse.redirect(url, 308);
    }
  }

  // ── Legacy URL redirects ──────────────────────────────────────────────────
  const LEGACY_REDIRECTS: Array<[from: string, to: string]> = [
    // Legal canonical
    ['/terms', '/legal'],
    ['/terms-of-service', '/legal'],
    ['/privacy-policy', '/legal/privacy'],
    // Legacy Indiana-specific routes → canonical
    ['/career-training-indiana', '/programs'],
    ['/skilled-trades-training-indiana', '/programs/skilled-trades'],
    ['/healthcare-training-indianapolis', '/programs/healthcare'],
    ['/hiset', '/testing'],
    ['/certification-testing', '/testing/nha'],
    // Program slug redirects (now in PROGRAM_SLUG_REDIRECTS for priority)
    // FSSA funding removed
    ['/fssa', '/funding'],
    ['/apply/fssa', '/apply'],
    // Programs on waitlist
    ['/programs/plumbing', '/programs'],
    ['/programs/forklift', '/programs'],
  ];

  for (const [from, to] of LEGACY_REDIRECTS) {
    if (pathname === from) {
      const url = request.nextUrl.clone();
      url.pathname = to;
      url.search = '';
      return NextResponse.redirect(url, 308);
    }
  }

  // ── Canonical redirects from canonical-routes.json ──────────────────────────
  for (const [from, to] of CANONICAL_REDIRECTS) {
    if (pathname === from) {
      const url = request.nextUrl.clone();
      url.pathname = to;
      url.search = '';
      return NextResponse.redirect(url, 308);
    }
  }

  // ── Image .jpg → .webp redirects ─────────────────────────────────────────
  for (const [from, to] of IMAGE_REDIRECTS) {
    if (pathname === from) {
      const url = request.nextUrl.clone();
      url.pathname = to;
      url.search = '';
      return NextResponse.redirect(url, 308);
    }
  }


  // Always allow public paths and static files
  if (isPublicPath(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // =============================================================================
  // NON-WWW TO WWW REDIRECT (Preserve full path and query)
  // =============================================================================
  
  const wwwHost = process.env.NEXT_PUBLIC_WWW_URL || 'www.elevateforhumanity.org';
  const isWwwConfigured = wwwHost.includes('www.');
  
  // Only redirect if:
  // 1. Not localhost
  // 2. Not already www
  // 3. Not an API route (APIs should not redirect)
  // 4. www host is configured
  if (!isLocal && 
      !host.startsWith('www.') && 
      !pathname.startsWith('/api/') &&
      isWwwConfigured) {
    const url = request.nextUrl.clone();
    url.host = `www.${host}`;
    url.protocol = 'https:';
    return NextResponse.redirect(url);
  }
  
  // Force non-www to www for main domain (always, unless localhost)
  if (!isLocal && host === 'elevateforhumanity.org') {
    const url = request.nextUrl.clone();
    url.host = 'www.elevateforhumanity.org';
    url.protocol = 'https:';
    return NextResponse.redirect(url);
  }

  // =============================================================================
  // DOMAIN-BASED ROUTING (Production)
  // =============================================================================

  // FIX: Use EXPLICIT hosts - do NOT fall back to NEXT_PUBLIC_SITE_URL
  // This prevents www from being treated as the app domain
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL; // No fallback - must be explicit

  // Extract configured hosts
  let configuredAdminHost: string | null = null;
  let configuredAppHost: string | null = null;

  if (adminUrl) {
    try {
      configuredAdminHost = new URL(adminUrl).host;
    } catch { /* invalid URL */ }
  }

  if (appUrl) {
    try {
      configuredAppHost = new URL(appUrl).host;
    } catch { /* invalid URL */ }
  }

  // If we're on the admin domain, ensure /admin/* or /api/admin/* routes
  if (configuredAdminHost && host === configuredAdminHost && !isLocal) {
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin') && 
        !pathname.startsWith('/api/devstudio') && !pathname.startsWith('/api/staff')) {
      // Redirect non-admin paths to /admin
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
      return NextResponse.redirect(url);
    }
  }

  // If we're on the app domain, ensure /lms/* or /student/* routes
  if (configuredAppHost && host === configuredAppHost && !isLocal) {
    const studentPaths = ['/lms', '/student', '/instructor', '/employer', '/program-holder', '/api/enrollments', '/api/courses'];
    if (!studentPaths.some(p => pathname.startsWith(p))) {
      // Redirect non-student paths to /lms
      const url = request.nextUrl.clone();
      url.pathname = `/lms${pathname === '/' ? '' : pathname}`;
      return NextResponse.redirect(url);
    }
  }

  // =============================================================================
  // ADMIN PROTECTION
  // =============================================================================

  if (isAdminPath(pathname)) {
    // Add request headers for admin routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    requestHeaders.set('x-host', host);
    
    return addSecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } })
    );
  }

  // =============================================================================
  // DEFAULT: Pass through with security headers
  // =============================================================================

  return addSecurityHeaders(NextResponse.next());
}

// =============================================================================
// CONFIGURATION
// =============================================================================

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
