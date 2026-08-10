import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refresh Supabase sessions once at the LMS request boundary and persist any
 * rotated cookies to the browser. Server Components can read the resulting
 * session without each component racing to reuse the same refresh token.
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

  // Do not make an auth network call for anonymous traffic.
  const hasSupabaseSession = req.cookies
    .getAll()
    .some(({ name }) => name.startsWith('sb-') && name.includes('-auth-token'));

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (hasSupabaseSession) {
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

            // Recreate the response so downstream Server Components see the
            // updated request cookies, then persist the same cookies client-side.
            response = NextResponse.next({ request: { headers: requestHeaders } });
            cookiesToSet.forEach(({ name, value, options }) => {
              const isAuthCookie = name.startsWith('sb-') && name.includes('-auth-token');
              response.cookies.set(name, value, {
                ...options,
                ...(isAuthCookie ? { domain: '.elevateforhumanity.org' } : {}),
              });
            });
          },
        },
      },
    );

    // getUser() validates the session and performs a refresh only when needed.
    // Page-level guards remain responsible for authorization/redirects.
    await supabase.auth.getUser();
  }

  response.cookies.set('__efh_pathname', pathname, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60,
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
