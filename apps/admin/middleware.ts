import { NextResponse, type NextRequest } from 'next/server';
import { checkAdminIP } from '@/lib/api/admin-ip-guard';
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware';
import {
  PRIVILEGED_MFA_ROLES,
  privilegedMfaEnforcementEnabled,
} from '@/lib/auth/privileged-mfa';
import {
  ADMIN_ROLES,
  INSTRUCTOR_ROLES,
  STAFF_ROLES,
  TESTING_CENTER_ROLES,
  hasAnyRole,
  normalizeRoles,
  type UserRole,
} from '@/lib/rbac/role-matrix';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/unauthorized',
  // The credential endpoint must be reachable before a Supabase session exists.
  // If middleware redirects this POST to /login, Next.js returns HTML and the
  // login form sees "Unexpected token '<' / <!DOCTYPE ... is not valid JSON".
  '/api/auth/admin-login',
  '/api/health',
  '/api/ping',
  // Northflank and release automation must evaluate readiness before login.
  // The endpoint exposes configuration state only; it does not expose data.
  '/api/ready',
  '/api/version',
  // This internal worker authenticates with CRON_SECRET in its route handler.
  // It must bypass session middleware or cron/local worker calls are redirected
  // to /login before bearer authentication can run.
  '/api/internal/videos/process-queue',
  '/auth/confirm',
  '/auth/reset-password',
  '/install',
];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`))) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /[a-z0-9]+\.[a-z]+$/i.test(pathname)
  );
}

function requiredRoles(pathname: string): readonly UserRole[] {
  const isStudio =
    pathname === '/studio' ||
    pathname.startsWith('/studio/') ||
    pathname.startsWith('/admin/studio') ||
    pathname.startsWith('/admin/dev-studio') ||
    pathname.startsWith('/dev-studio') ||
    pathname.startsWith('/api/admin/dev-studio');
  if (isStudio) return ['super_admin', 'admin'];

  const isTesting =
    pathname === '/testing-center' ||
    pathname.startsWith('/testing-center/') ||
    pathname === '/proctor-portal' ||
    pathname.startsWith('/proctor-portal/') ||
    pathname === '/exam-authorizations' ||
    pathname.startsWith('/exam-authorizations/') ||
    pathname.startsWith('/api/admin/exam-authorizations') ||
    pathname.startsWith('/api/admin/testing') ||
    pathname.startsWith('/api/proctor');
  if (isTesting) return TESTING_CENTER_ROLES;

  if (pathname.startsWith('/instructor')) return INSTRUCTOR_ROLES;
  if (pathname.startsWith('/staff-portal') || pathname.startsWith('/api/staff')) return STAFF_ROLES;

  return ADMIN_ROLES;
}

function platformCookieOptions(options: Record<string, unknown> | undefined) {
  return {
    ...(options || {}),
    path: '/',
    sameSite: 'lax' as const,
    ...(process.env.NODE_ENV === 'production'
      ? { domain: '.elevateforhumanity.org', secure: true }
      : {}),
  };
}

type PendingCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const legacyStudioPrefixes = ['/admin/studio', '/admin/dev-studio', '/dev-studio'];
  const legacyStudioPrefix = legacyStudioPrefixes.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (legacyStudioPrefix) {
    const canonicalUrl = req.nextUrl.clone();
    canonicalUrl.pathname = `/studio${pathname.slice(legacyStudioPrefix.length)}`;
    return NextResponse.redirect(canonicalUrl, 308);
  }
  if (pathname === '/admin/dashboard') {
    const canonicalUrl = req.nextUrl.clone();
    canonicalUrl.pathname = '/dashboard';
    return NextResponse.redirect(canonicalUrl, 308);
  }
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const canonicalUrl = req.nextUrl.clone();
    canonicalUrl.pathname = pathname === '/admin' ? '/dashboard' : pathname.slice('/admin'.length);
    return NextResponse.redirect(canonicalUrl, 308);
  }

  if (isPublicPath(pathname)) return NextResponse.next();

  const ipBlocked = checkAdminIP(req);
  if (ipBlocked) return ipBlocked;

  const pendingCookies: PendingCookie[] = [];
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', `${pathname}${search}`);

  const supabase = createMiddlewareSupabaseClient(req, (cookiesToSet) => {
    for (const cookie of cookiesToSet) {
      req.cookies.set(cookie.name, cookie.value);
      pendingCookies.push(cookie as PendingCookie);
    }
  });

  const withCookies = (response: NextResponse) => {
    for (const cookie of pendingCookies) {
      response.cookies.set(
        cookie.name,
        cookie.value,
        platformCookieOptions(cookie.options) as any,
      );
    }
    response.cookies.set('__efh_pathname', `${pathname}${search}`, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
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

  if (!hasAnyRole(effectiveRoles, requiredRoles(pathname), { adminOverride: false })) {
    return withCookies(NextResponse.redirect(new URL('/unauthorized', req.url)));
  }

  const privileged = effectiveRoles.some((role) => PRIVILEGED_MFA_ROLES.includes(role));
  if (privilegedMfaEnforcementEnabled() && privileged && pathname !== '/mfa') {
    const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const aal2 = !aalError && aal.currentLevel === 'aal2';

    if (!aal2) {
      if (pathname.startsWith('/api/')) {
        return withCookies(
          NextResponse.json(
            {
              error: 'MFA_REQUIRED',
              message: 'AAL2 multi-factor authentication is required for privileged access.',
            },
            { status: 403 },
          ),
        );
      }

      const mfaUrl = new URL('/mfa', req.url);
      mfaUrl.searchParams.set('redirect', `${pathname}${search}`);
      return withCookies(NextResponse.redirect(mfaUrl));
    }
  }

  return withCookies(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
