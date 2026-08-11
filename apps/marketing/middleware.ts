import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PORTAL_PREFIXES = [
  '/program-holder/dashboard',
  '/program-holder/students',
  '/program-holder/documents',
  '/program-holder/hours',
  '/program-holder/reports',
  '/case-manager/dashboard',
  '/workforce-board/dashboard',
  '/provider/dashboard',
  '/creator/products',
] as const;

function isProtectedPortal(pathname: string) {
  return PROTECTED_PORTAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function cookieOptions(
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
 * The marketing site is public, but its operational portal namespaces are not.
 * This boundary validates the Supabase user before those dashboards can render.
 * Route-level role/tenant guards remain authoritative for authorization.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.[a-z0-9]+$/i.test(pathname) ||
    !isProtectedPortal(pathname)
  ) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', `${pathname}${search}`);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(
              name,
              value,
              cookieOptions(name, options as Record<string, unknown>) as any,
            );
          });
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.cookies.set('__efh_pathname', `${pathname}${search}`, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60,
  });

  return response;
}

export const config = {
  matcher: [
    '/program-holder/:path*',
    '/case-manager/:path*',
    '/workforce-board/:path*',
    '/provider/:path*',
    '/creator/:path*',
  ],
};
