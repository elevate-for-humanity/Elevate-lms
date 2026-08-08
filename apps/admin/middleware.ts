import { NextResponse, type NextRequest } from 'next/server';
import { checkAdminIP } from '@/lib/api/admin-ip-guard';
import { createServerClient } from '@supabase/ssr';

/**
 * Admin Middleware - handles auth BEFORE pages render to avoid redirect loops.
 */

const PUBLIC_PATHS = [
  '/login',
  '/unauthorized',
  '/api/health',
  '/api/ping',
  '/auth/confirm',
  '/auth/reset-password',
  '/admin/install',
];

const ADMIN_PORTAL_ROLES = [
  'admin',
  'staff',
  'org_admin',
  'instructor',
  'test_admin',
  'proctor',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /[a-z0-9]+\.[a-z]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const ipBlocked = checkAdminIP(req);
  if (ipBlocked) return ipBlocked;

  const isProtected =
    pathname === '/' ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/staff-portal') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/testing-center') ||
    pathname.startsWith('/dev-studio') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/staff') ||
    pathname.startsWith('/api/devstudio') ||
    pathname.startsWith('/api/platform');

  if (!isProtected) return NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });
        },
      },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  const secondaryRoles = (roleRows ?? [])
    .map((row) => (row as { roles?: { name?: unknown } | null }).roles?.name)
    .filter((role): role is string => typeof role === 'string');
  const effectiveRoles = Array.from(new Set([profile?.role, ...secondaryRoles].filter(Boolean))) as string[];

  if (!effectiveRoles.some((role) => ADMIN_PORTAL_ROLES.includes(role))) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  const isDevStudioRoute =
    pathname.startsWith('/admin/studio') ||
    pathname.startsWith('/admin/dev-studio') ||
    pathname.startsWith('/dev-studio') ||
    pathname.startsWith('/api/devstudio');

  if (isDevStudioRoute && !effectiveRoles.includes('admin')) {
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
