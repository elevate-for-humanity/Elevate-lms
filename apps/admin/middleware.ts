import { NextResponse, type NextRequest } from 'next/server';
import { checkAdminIP } from '@/lib/api/admin-ip-guard';
import { createServerClient } from '@supabase/ssr';

/**
 * Admin Middleware - handles auth BEFORE pages render to avoid redirect loops.
 *
 * Supabase may rotate the auth/refresh cookies while getUser() runs. Those
 * cookies MUST be copied to the outgoing response. Updating only req.cookies
 * causes the browser to keep the stale refresh token and can create a refresh
 * storm (refresh_token_already_used / 429 responses).
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
    pathname === '/studio' ||
    pathname.startsWith('/studio/') ||
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

  const refreshedCookies: Array<{
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }> = [];

  const applyRefreshedCookies = (response: NextResponse) => {
    for (const { name, value, options } of refreshedCookies) {
      const isAuthCookie = name.startsWith('sb-') && name.includes('-auth-token');
      response.cookies.set(name, value, {
        ...(options as any),
        ...(isAuthCookie ? { domain: '.elevateforhumanity.org' } : {}),
      });
    }
    return response;
  };

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
            // Make the freshly rotated value visible to the rest of this request.
            req.cookies.set(name, value);
            // Persist it to the browser on the outgoing response below.
            refreshedCookies.push({ name, value, options: options as Record<string, unknown> });
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
    loginUrl.searchParams.set('redirect', pathname);
    return applyRefreshedCookies(NextResponse.redirect(loginUrl));
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
    return applyRefreshedCookies(NextResponse.redirect(new URL('/unauthorized', req.url)));
  }

  const isDevStudioRoute =
    pathname === '/studio' ||
    pathname.startsWith('/studio/') ||
    pathname.startsWith('/admin/studio') ||
    pathname.startsWith('/admin/dev-studio') ||
    pathname.startsWith('/dev-studio') ||
    pathname.startsWith('/api/devstudio');

  if (isDevStudioRoute && !effectiveRoles.includes('admin')) {
    return applyRefreshedCookies(NextResponse.redirect(new URL('/unauthorized', req.url)));
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
  return applyRefreshedCookies(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
