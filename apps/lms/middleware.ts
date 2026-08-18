import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Authenticated LMS namespaces. Authorization remains enforced by the route
 * layouts/pages, but these paths must never render for an anonymous request.
 * Public portal landing/login pages are intentionally excluded.
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
  '/host-shop/dashboard',
  '/parent-portal/dashboard',
  '/parent-portal/student',
  '/employer',
  '/workforce',
  '/program-holder',
  '/creator',
] as const;

function isProtectedPath(pathname: string) {
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

/**
 * Refresh Supabase sessions once at the LMS request boundary and persist any
 * rotated cookies to the browser. Protected portal namespaces also receive an
 * authenticated-user gate here so a missing/expired session cannot reach a
 * dashboard before page-level role authorization runs.
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
  const hasSupabaseSession = req.cookies
    .getAll()
    .some(({ name }) => name.startsWith('sb-') && name.includes('-auth-token'));

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (hasSupabaseSession || protectedPath) {
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

    if (protectedPath && (error || !user)) {
      const loginUrl = new URL(loginPathFor(pathname), req.url);
      loginUrl.searchParams.set('redirect', `${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
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
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
