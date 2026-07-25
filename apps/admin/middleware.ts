import { NextResponse, type NextRequest } from 'next/server';
import { checkAdminIP } from '@/lib/api/admin-ip-guard';
import { safeGetUser, createClient } from '@/lib/supabase/server';

/**
 * Admin Middleware - handles auth BEFORE pages render to avoid redirect loops.
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
  const supabase = await createClient();
  const user = safeGetUser(await supabase.auth.getUser());

  if (!user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role
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

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
