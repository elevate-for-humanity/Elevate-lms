import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import crossAppOwnership from '@/lib/routes/cross-app-ownership.json';
import {
  rewriteCustomDomainRequest,
  rewriteTenantAppHostRequest,
  tenantSlugFromAppHost,
} from '@/lib/tenant/middleware-tenant-routing';

const PROTECTED_PORTAL_PREFIXES = [
  '/case-manager/dashboard',
  '/workforce-board/dashboard',
  '/provider/dashboard',
] as const;

const ELEVATE_PUBLIC_HOSTS = new Set([
  'elevateforhumanity.org',
  'www.elevateforhumanity.org',
  'app.elevateforhumanity.org',
  'admin.elevateforhumanity.org',
  'portal.elevateforhumanity.org',
  'store.elevateforhumanity.org',
  'testing.elevateforhumanity.org',
]);

const APP_ORIGINS: Record<string, string> = {
  admin: 'https://admin.elevateforhumanity.org',
  lms: 'https://app.elevateforhumanity.org',
};

type CrossAppRule = {
  source?: string;
  sourcePrefix?: string;
  owner: string;
  target?: string;
  stripPrefix?: string;
};

function resolveCrossAppPath(pathname: string) {
  const rules = crossAppOwnership.routes as CrossAppRule[];
  for (const rule of rules) {
    if (rule.source && pathname === rule.source) {
      return { owner: rule.owner, pathname: rule.target || pathname };
    }
    if (rule.sourcePrefix && pathname.startsWith(rule.sourcePrefix)) {
      const stripped = rule.stripPrefix && pathname.startsWith(rule.stripPrefix)
        ? pathname.slice(rule.stripPrefix.length) || '/'
        : pathname;
      return { owner: rule.owner, pathname: rule.target || stripped };
    }
  }
  return null;
}

function isProtectedPortal(pathname: string) {
  return PROTECTED_PORTAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function cookieOptions(
  name: string,
  options: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const isAuthCookie = name.startsWith('sb-') && name.includes('-auth-token');
  return {
    ...(options || {}),
    ...(isAuthCookie && process.env.NODE_ENV === 'production'
      ? { domain: '.elevateforhumanity.org', secure: true }
      : {}),
  };
}

function requestHost(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  return (forwarded || req.headers.get('host') || '').split(':')[0].toLowerCase();
}

function isStaticRequest(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap') ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

function isCustomTenantHost(host: string) {
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
  if (ELEVATE_PUBLIC_HOSTS.has(host)) return false;
  if (host.endsWith('.elevateforhumanity.org')) return false;
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isStaticRequest(pathname)) return NextResponse.next();

  const host = requestHost(req);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', `${pathname}${search}`);

  if (pathname.startsWith('/api/tenant-sites/')) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const tenantSlug = tenantSlugFromAppHost(host);
  if (tenantSlug) {
    return rewriteTenantAppHostRequest(req, tenantSlug, pathname, requestHeaders);
  }

  if (isCustomTenantHost(host)) {
    return rewriteCustomDomainRequest(req, host, pathname, requestHeaders);
  }

  // Root-relative links from historical Marketing pages must resolve to the
  // service that owns them. This boundary redirect keeps old bookmarks and
  // embedded links working while canonical UI remains on the owning domain.
  if (host === 'www.elevateforhumanity.org' || host === 'elevateforhumanity.org') {
    const crossApp = resolveCrossAppPath(pathname);
    const targetOrigin = crossApp ? APP_ORIGINS[crossApp.owner] : undefined;
    if (crossApp && targetOrigin) {
      const target = new URL(crossApp.pathname, targetOrigin);
      target.search = search;
      return NextResponse.redirect(target, 307);
    }
  }

  if (!isProtectedPortal(pathname)) return NextResponse.next();

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createMiddlewareSupabaseClient(req, (cookiesToSet) => {
    cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
    response = NextResponse.next({ request: { headers: requestHeaders } });
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(
        name,
        value,
        cookieOptions(name, options as Record<string, unknown>) as any,
      );
    });
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.cookies.set('__efh_pathname', `${pathname}${search}`, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60,
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
