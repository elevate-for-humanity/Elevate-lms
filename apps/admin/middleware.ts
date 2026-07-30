import { NextResponse, type NextRequest } from 'next/server';
import { checkAdminIP } from '@/lib/api/admin-ip-guard';
import { createServerClient } from '@supabase/ssr';

/**
 * Admin Middleware - handles auth BEFORE pages render to avoid redirect loops.
 * Uses @supabase/ssr for Edge Runtime compatibility.
 */

// Paths that never require auth
const PUBLIC_PATHS = [
  '/login',
  '/unauthorized',
  '/api/health',
  '/api/ping',
  '/auth/confirm',
  '/auth/reset-password',
  '/admin/studio',
  '/admin/dev-studio',
  '/admin/install',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths and static files
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /[a-z0-9]+\.[a-z]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check IP guard first
  const ipBlocked = checkAdminIP(req);
  if (ipBlocked) return ipBlocked;

  // Only gate protected namespaces.
  const isProtected =
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/staff') ||
    pathname.startsWith('/api/devstudio') ||
    pathname.startsWith('/api/platform');

  if (!isProtected) return NextResponse.next();

  // Auth check - runs in middleware to avoid layout redirect loops
  // Using @supabase/ssr for Edge Runtime compatibility
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
          });
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role from public.profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const validRoles = ['admin', 'instructor', 'staff', 'super_admin'];
  if (!profile?.role || !validRoles.includes(profile.role)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
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
