import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Domain → landing page mapping
const DOMAIN_ROUTES: Record<string, string> = {
  'elevateforhumanityeducation.com': '/education',
  'www.elevateforhumanityeducation.com': '/education',
  'elevateconnects.org': '/connects',
  'www.elevateconnects.org': '/connects',
};

// Admin roles that can access /admin routes
const ADMIN_ROLES = ['admin', 'super_admin', 'org_admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host')?.split(':')[0] ?? '';

  // ── Domain-based routing ──
  // Only rewrite the root path to the domain-specific landing page.
  // All other routes (e.g. /programs, /login, /admin) pass through normally
  // so the full site remains accessible from every domain.
  if (pathname === '/' && DOMAIN_ROUTES[hostname]) {
    const url = request.nextUrl.clone();
    url.pathname = DOMAIN_ROUTES[hostname];
    return NextResponse.rewrite(url);
  }

  // ── Admin route protection ──
  // Protect /admin/* routes (except /admin-login which is the entry point)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If Supabase isn't configured, allow through (dev mode)
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.next();
    }

    // Create a Supabase client that reads cookies from the request
    const response = NextResponse.next();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Not authenticated → redirect to login with return URL
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !ADMIN_ROLES.includes(profile.role)) {
      // Not an admin → redirect to unauthorized page
      const unauthorizedUrl = request.nextUrl.clone();
      unauthorizedUrl.pathname = '/unauthorized';
      return NextResponse.redirect(unauthorizedUrl);
    }

    // Admin user — allow through, return response with refreshed cookies
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match root path for domain routing
    '/',
    // Match admin routes for auth protection
    '/admin/:path*',
  ],
};
