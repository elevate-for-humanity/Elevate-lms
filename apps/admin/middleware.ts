import { NextResponse, type NextRequest } from 'next/server';
import { checkAdminIP } from '@/lib/api/admin-ip-guard';
import { buildLoginUrl, buildReturnPath } from '@/lib/auth/validate-redirect';

/**
 * Admin Middleware
 * 
 * Fix: Only redirect if NEXT_PUBLIC_ADMIN_URL is explicitly configured.
 * On work hosts (no ADMIN_URL set), allow the request through.
 */

// Paths that never require auth
const PUBLIC_PATHS = [
  '/login',
  '/unauthorized',
  '/api/health',
  '/api/ping',
  '/auth/confirm',
  '/auth/reset-password',
];

function getSessionCookieName(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const match = url.match(/https?:\/\/([^.]+)\./);
  if (match?.[1]) return `sb-${match[1]}-auth-token`;
  return 'sb-cuxzzpsyufcewtmicszk-auth-token';
}
const SESSION_COOKIE = getSessionCookieName();

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get('host')?.toLowerCase().split(':')[0] ?? '';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';

  // Always allow public paths and static files
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // FIX: Only redirect if NEXT_PUBLIC_ADMIN_URL is explicitly set
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
  if (adminUrl && !isLocalHost) {
    try {
      const configuredHost = new URL(adminUrl).host;
      if (host !== configuredHost) {
        const adminBase = adminUrl.replace(/\/+$/, '');
        return NextResponse.redirect(`${adminBase}${pathname}${search}`, { status: 301 });
      }
    } catch {
      // Invalid URL, skip redirect
    }
  }

  // Only gate protected namespaces.
  const isProtected =
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/staff') ||
    pathname.startsWith('/api/devstudio') ||
    pathname.startsWith('/api/platform');

  if (!isProtected) return NextResponse.next();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  const ipBlocked = checkAdminIP(req);
  if (ipBlocked) return ipBlocked;

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
