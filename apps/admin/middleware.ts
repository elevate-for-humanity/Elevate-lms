import { NextResponse, type NextRequest } from 'next/server';
import { checkAdminIP } from '@/lib/api/admin-ip-guard';
import { createServerClient } from '@supabase/ssr';
import {
  ADMIN_ROLES,
  INSTRUCTOR_ROLES,
  TESTING_CENTER_ROLES,
  hasAnyRole,
  normalizeRoles,
} from '@/lib/rbac/role-matrix';

/**
 * Admin middleware.
 *
 * Every non-public route on admin.elevateforhumanity.org is private. Supabase
 * refresh cookies are copied to every response, including redirects, so a
 * successful middleware refresh cannot be lost and retried by parallel
 * requests.
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

const ADMIN_APP_ROLES = Array.from(
  new Set([...ADMIN_ROLES, ...INSTRUCTOR_ROLES, ...TESTING_CENTER_ROLES]),
);

type PendingCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /[a-z0-9]+\.[a-z]+$/i.test(pathname)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const ipBlocked = checkAdminIP(req);
  if (ipBlocked) return ipBlocked;

  const pendingCookies: PendingCookie[] = [];
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', `${pathname}${search}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            req.cookies.set(cookie.name, cookie.value);
            pendingCookies.push(cookie as PendingCookie);
          }
        },
      },
    },
  );

  const withCookies = (response: NextResponse) => {
    for (const cookie of pendingCookies) {
      response.cookies.set(cookie.name, cookie.value, cookie.options as any);
    }
    response.cookies.set('__efh_pathname', `${pathname}${search}`, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60,
    });
    return response;
  };

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return withCookies(NextResponse.redirect(loginUrl));
  }

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
  ]);

  const secondaryRoles = (roleRows ?? [])
    .map((row) => (row as { roles?: { name?: unknown } | null }).roles?.name)
    .filter((role): role is string => typeof role === 'string');
  const effectiveRoles = normalizeRoles([profile?.role, ...secondaryRoles]);

  if (!hasAnyRole(effectiveRoles, ADMIN_APP_ROLES, { adminOverride: true })) {
    return withCookies(NextResponse.redirect(new URL('/unauthorized', req.url)));
  }

  const isDevStudioRoute =
    pathname === '/studio' ||
    pathname.startsWith('/studio/') ||
    pathname.startsWith('/admin/studio') ||
    pathname.startsWith('/admin/dev-studio') ||
    pathname.startsWith('/dev-studio') ||
    pathname.startsWith('/api/devstudio');

  if (
    isDevStudioRoute &&
    !hasAnyRole(effectiveRoles, ['admin', 'super_admin'], { adminOverride: false })
  ) {
    return withCookies(NextResponse.redirect(new URL('/unauthorized', req.url)));
  }

  return withCookies(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
