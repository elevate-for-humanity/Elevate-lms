import {
  createMiddlewareSupabaseClient,
  hasSupabaseAuthCookie,
} from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Authenticated LMS namespaces. This is a defense-in-depth request boundary;
 * route layouts/pages must still enforce role/tenant authorization.
 */
const PROTECTED_PREFIXES = [
  '/lms/dashboard',
  '/lms/courses',
  '/lms/progress',
  '/lms/assignments',
  '/lms/calendar',
  '/lms/certificates',
  '/lms/messages',
  '/lms/support',
  '/learner',
  '/apprentice',
  '/admin-preview',
  '/host-shop/dashboard',
  '/parent-portal/dashboard',
  '/parent-portal/student',
  '/employer',
  '/workforce',
  '/program-holder',
  '/creator',
  '/account',
  '/billing',
  '/builder',
  '/ai',
  '/ai-chat',
  '/ai-chat-standalone',
] as const;

function isProtectedPath(pathname: string) {
  // Any route explicitly named as a dashboard is private even if a new role
  // namespace is added and forgotten in PROTECTED_PREFIXES.
  if (pathname === '/dashboard' || pathname.includes('/dashboard/')) return true;
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function loginPathFor(pathname: string) {
  if (pathname === '/host-shop/dashboard' || pathname.startsWith('/host-shop/dashboard/')) {
    return '/host-shop/login';
  }
  return '/login';
}

function authCookieOptions(
  name: string,
  options: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const isAuthCookie = name.startsWith('sb-') && name.includes('-auth-token');
  return {
    ...(options || {}),
    ...(isAuthCookie && process.env.NODE_ENV === 'production'
      ? { domain: '.elevateforhumanity.org', secure: true }
      : {}),
  };
}

function redirectToLogin(req: NextRequest, pathname: string) {
  const loginUrl = new URL(loginPathFor(pathname), req.url);
  loginUrl.searchParams.set('redirect', `${pathname}${req.nextUrl.search}`);
  const response = NextResponse.redirect(loginUrl);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Vary', 'Cookie');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return response;
}

/**
 * Refresh Supabase sessions once at the LMS request boundary and persist any
 * rotated cookies. Protected portal routes fail closed for anonymous/expired
 * sessions before React renders anything.
 */
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const protectedPath = isProtectedPath(pathname);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // Public entry points (especially /login and /host-shop/login) must render
  // without a network session refresh. A stale cross-subdomain cookie used to
  // make the public login shell wait on Supabase during an outage.
  if (protectedPath) {
    // Do not spend the bounded Supabase network timeout proving that a request
    // with no session cookie is anonymous. This keeps every role-specific PWA
    // entry point responsive during a Supabase slowdown or cold start.
    if (!hasSupabaseAuthCookie(req)) return redirectToLogin(req, pathname);

    const supabase = createMiddlewareSupabaseClient(req, (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
      response = NextResponse.next({ request: { headers: requestHeaders } });
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(
          name,
          value,
          authCookieOptions(name, options as Record<string, unknown>) as any,
        );
      });
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return redirectToLogin(req, pathname);
  }

  response.cookies.set('__efh_pathname', pathname, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60,
  });

  if (protectedPath) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
