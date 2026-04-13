/**
 * Perimeter middleware — redirects unauthenticated browsers away from
 * protected route prefixes before the page renders.
 *
 * This is NOT the only auth layer. Every page and API route still enforces
 * its own guard (requireAdmin, requireRole, apiRequireAdmin, etc.).
 * Middleware is a fast early exit for the browser — it does not protect
 * API routes called server-to-server.
 *
 * Protected prefixes:
 *   /admin          → must be authenticated (role checked in each page)
 *   /instructor     → must be authenticated (role checked in each page)
 *   /lms            → must be authenticated
 *   /learner        → must be authenticated
 *   /onboarding     → must be authenticated
 *   /employer       → must be authenticated
 *   /partner        → must be authenticated (portal pages, not public partner pages)
 *   /program-holder → must be authenticated
 *   /staff-portal   → must be authenticated
 *   /mentor         → must be authenticated
 */

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = [
  '/admin',
  '/instructor',
  '/lms',
  '/learner',
  '/onboarding',
  '/employer',
  '/program-holder',
  '/staff-portal',
  '/mentor',
];

// Partner portal pages (not the public /partners/* marketing pages)
const PARTNER_PORTAL_PREFIX = '/partner/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.startsWith(PARTNER_PORTAL_PREFIX);

  if (!isProtected) {
    return NextResponse.next();
  }

  // Build a response we can attach cookie mutations to
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured (e.g. CI build), pass through
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() validates the JWT with Supabase — not just a cookie read
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/instructor/:path*',
    '/lms/:path*',
    '/learner/:path*',
    '/onboarding/:path*',
    '/employer/:path*',
    '/partner/dashboard/:path*',
    '/program-holder/:path*',
    '/staff-portal/:path*',
    '/mentor/:path*',
  ],
};
