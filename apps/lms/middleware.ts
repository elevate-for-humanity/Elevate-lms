import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type PendingCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

/**
 * LMS session synchronizer.
 *
 * Supabase refreshes should happen once at the request boundary and the
 * refreshed cookies must be copied onto the response. Server components then
 * receive the fresh access token instead of racing each other to reuse the same
 * refresh token.
 *
 * This middleware deliberately does not make route-authorization decisions;
 * each portal still uses the canonical server-side role guard. Its job is only
 * session synchronization + preserving the requested path.
 */
export async function middleware(request: NextRequest) {
  const pendingCookies: PendingCookie[] = [];
  const requestHeaders = new Headers(request.headers);
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  requestHeaders.set('x-pathname', requestedPath);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          request.cookies.set(cookie.name, cookie.value);
          pendingCookies.push(cookie as PendingCookie);
        }
      },
    },
  });

  // One boundary validation/refresh for this page/API request. Do not call
  // getSession() here; getUser() validates and refreshes when required.
  await supabase.auth.getUser();

  for (const cookie of pendingCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options as any);
  }
  response.cookies.set('__efh_pathname', requestedPath, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60,
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|mp4|webm)$).*)',
  ],
};
