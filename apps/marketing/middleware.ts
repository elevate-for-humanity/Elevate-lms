import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import {
  rewriteCustomDomainRequest,
  rewriteTenantAppHostRequest,
  tenantSlugFromAppHost,
} from '@/lib/tenant/middleware-tenant-routing';
import { LMS_HOST } from '@/lib/routing/portal-map';

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

const STORE_RUNTIME_ALLOWED_PREFIXES = [
  '/store',
  '/login',
  '/signup',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/api/store',
  '/api/webhooks/store',
  '/api/webhooks/stripe',
  '/api/auth',
  '/api/ping',
  '/api/health',
] as const;

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

function isStoreRuntimeAllowed(pathname: string): boolean {
  return STORE_RUNTIME_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function handleStoreOnlyRuntime(req: NextRequest, pathname: string): NextResponse | null {
  if (process.env.STORE_ONLY_RUNTIME !== 'true') return null;

  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/store';
    return NextResponse.redirect(url, 307);
  }

  if (isStoreRuntimeAllowed(pathname)) {
    // This deployment can be reached through Northflank's generated code.run
    // host before the branded CNAME is attached. Do not pass an allowed store
    // route into generic custom-domain tenant resolution: code.run is the store
    // service host, not a customer website domain.
    return NextResponse.next();
  }

  // The isolated commerce deployment must not accidentally become a second
  // public copy of the full marketing site. Keep one canonical marketing host
  // while the store service owns only commerce/auth/checkout surfaces.
  const canonical = new URL(`https://www.elevateforhumanity.org${pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(canonical, 307);
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isStaticRequest(pathname)) return NextResponse.next();

  const storeRuntimeResponse = handleStoreOnlyRuntime(req, pathname);
  if (storeRuntimeResponse) return storeRuntimeResponse;

  const host = requestHost(req);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', `${pathname}${search}`);

  // Tenant forms/analytics APIs must execute as API routes on the tenant host;
  // they resolve the published tenant from Host/x-forwarded-host themselves.
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
    // These workspaces are owned by the Marketing runtime, but authentication
    // is owned by the LMS runtime. Preserve the absolute Marketing return URL
    // so successful login comes back to the application that owns the route
    // instead of resolving /provider, /case-manager, or /workforce-board on LMS.
    const loginUrl = new URL('/login', LMS_HOST);
    loginUrl.searchParams.set('redirect', `${req.nextUrl.origin}${pathname}${search}`);
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
