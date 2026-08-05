/**
 * Unified Middleware
 *
 * Handles domain-based routing and security headers for the unified platform.
 * All three domains (www, app, admin) route to the same container.
 *
 * Routing:
 * - www.elevateforhumanity.org  → Marketing/public routes
 * - app.elevateforhumanity.org  → LMS/student routes
 * - admin.elevateforhumanity.org → Admin routes
 *
 * NOTE: All legacy/admin/lms redirect rules have been removed.
 * Nav links now point directly to correct pages. No redirect patching needed.
 */

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// CONFIG
// =============================================================================

const PUBLIC_PATHS = [
  '/api/health', '/api/version', '/api/ping', '/api/ready',
  '/apply', '/auth/confirm', '/auth/reset-password', '/login',
  '/unauthorized', '/forgot-password', '/signup', '/verify-email',
  '/update-password',
];

const ADMIN_PATHS = [
  '/admin', '/api/admin', '/api/staff', '/api/devstudio', '/api/platform',
  '/provider', '/program-holder', '/case-manager', '/workforce-board', '/staff-portal',
];

const STUDENT_PATHS = [
  '/lms', '/student', '/instructor', '/employer', '/program-holder',
  '/api/enrollments', '/api/courses', '/api/grades', '/api/attendance',
];

// Minimal legacy redirects — only for external links/bookmarks that cannot be fixed via nav
const LEGACY_REDIRECTS: Array<[from: string, to: string]> = [
  // Legal
  ['/terms', '/legal'],
  ['/terms-of-service', '/legal'],
  ['/privacy-policy', '/legal/privacy'],
  // Marketing-era placeholders → homepage
  ['/paris', '/'],
  ['/lizzy', '/'],
  ['/studio', '/'],
  // Legacy support
  ['/mentorship', '/career-services'],
  ['/vita', '/career-services'],
  // Legacy apply
  ['/admissions', '/apply'],
  ['/signup', '/apply'],
];

// =============================================================================
// HELPERS
// =============================================================================

function getHost(req: NextRequest): string {
  return req.headers.get('host')?.split(':')[0]?.toLowerCase() || 'localhost';
}

function isLocalhost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
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

function redirectTo(url: NextRequest['nextUrl'], pathname: string, permanent = false): NextResponse {
  const u = url.clone();
  u.pathname = pathname;
  u.search = '';
  return NextResponse.redirect(u, permanent ? 308 : 307);
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
// MAIN
// =============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = getHost(request);
  const isLocal = isLocalhost(host);

  // ── Portal routing: www → app/admin subdomains ─────────────────────────────
  if (host === 'www.elevateforhumanity.org') {
    const appHost = process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
      : 'app.elevateforhumanity.org';
    const adminHost = process.env.NEXT_PUBLIC_ADMIN_URL
      ? new URL(process.env.NEXT_PUBLIC_ADMIN_URL).hostname
      : 'admin.elevateforhumanity.org';

    // App portal paths
    if (
      pathname.startsWith('/lms/') ||
      pathname.startsWith('/student/') ||
      pathname.startsWith('/instructor/') ||
      pathname.startsWith('/employer/') ||
      pathname.startsWith('/apprentice/') ||
      pathname.startsWith('/parent-portal/') ||
      pathname.startsWith('/workforce/') ||
      pathname.startsWith('/cosmetology-host-shop/') ||
      pathname === '/host-shop/dashboard'
    ) {
      const url = request.nextUrl.clone();
      url.hostname = appHost;
      url.protocol = 'https:';
      return NextResponse.redirect(url, 307);
    }

    // Admin portal paths
    if (pathname.startsWith('/admin/')) {
      const url = request.nextUrl.clone();
      url.hostname = adminHost;
      url.protocol = 'https:';
      return NextResponse.redirect(url, 307);
    }
  }

  // ── Minimal legacy redirects ──────────────────────────────────────────────
  for (const [from, to] of LEGACY_REDIRECTS) {
    if (pathname === from) return redirectTo(request.nextUrl, to, true);
  }

  // ── Public / static files → pass through ──────────────────────────────────
  if (isPublicPath(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // ── Non-www → www redirect ────────────────────────────────────────────────
  if (!isLocal && host === 'elevateforhumanity.org') {
    const url = request.nextUrl.clone();
    url.host = 'www.elevateforhumanity.org';
    url.protocol = 'https:';
    return NextResponse.redirect(url);
  }

  // ── Domain-based routing: ensure correct paths on subdomains ─────────────
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  let adminHost: string | null = null;
  let appHost: string | null = null;

  if (adminUrl) { try { adminHost = new URL(adminUrl).host; } catch { /* */ } }
  if (appUrl) { try { appHost = new URL(appUrl).host; } catch { /* */ } }

  if (adminHost && host === adminHost && !isLocal) {
    if (
      !pathname.startsWith('/admin') &&
      !pathname.startsWith('/api/admin') &&
      !pathname.startsWith('/api/devstudio') &&
      !pathname.startsWith('/api/staff')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
      return NextResponse.redirect(url);
    }
  }

  if (appHost && host === appHost && !isLocal) {
    const studentPaths = ['/lms', '/student', '/instructor', '/employer', '/program-holder', '/api/enrollments', '/api/courses'];
    if (!studentPaths.some(p => pathname.startsWith(p))) {
      const url = request.nextUrl.clone();
      url.pathname = `/lms${pathname === '/' ? '' : pathname}`;
      return NextResponse.redirect(url);
    }
  }

  // ── Admin: set pathname header for auth ─────────────────────────────────
  if (isAdminPath(pathname)) {
    const response = NextResponse.next();
    response.cookies.set('__efh_pathname', pathname, {
      httpOnly: false, secure: true, sameSite: 'lax', path: '/', maxAge: 60,
    });
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    requestHeaders.set('x-host', host);
    return addSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // ── Default: pass through with security headers ──────────────────────────
  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
};
