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

const PUBLIC_PATHS = [
  '/api/health',
  '/api/ping',
  '/api/ready',
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

  // Always allow public paths and static files
  if (isPublicPath(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // =============================================================================
  // DOMAIN-BASED ROUTING (Production)
  // =============================================================================

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;

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
