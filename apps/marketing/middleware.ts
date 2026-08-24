import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import {
  rewriteCustomDomainRequest,
  rewriteTenantAppHostRequest,
  tenantSlugFromAppHost,
} from '@/lib/tenant/middleware-tenant-routing';
import { LMS_HOST } from '@/lib/routing/portal-map';

// These route families are authenticated operational software, not public
// marketing pages. Protect the complete family so child routes cannot inherit
// a weaker boundary than their dashboard entry point.
const PROTECTED_PORTAL_PREFIXES = [
  '/case-manager',
  '/workforce-board',
  '/provider',
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
  '/store', '/login', '/signup', '/register', '/forgot-password', '/reset-password', '/auth',
  '/api/store', '/api/webhooks/store', '/api/webhooks/stripe', '/api/auth', '/api/ping', '/api/health',
] as const;

function isProtectedPortal(pathname: string) {
  return PROTECTED_PORTAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function cookieOptions(name: string, options: Record<string, unknown> | undefined): Record<string, unknown> {
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
  return pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/robots.txt') || pathname.startsWith('/sitemap') || /\.[a-z0-9]+$/i.test(pathname);
}

function isCustomTenantHost(host: string) {
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
  if (ELEVATE_PUBLIC_HOSTS.has(host)) return false;
  if (host.endsWith('.elevateforhumanity.org')) return false;
  return true;
}

function isStoreRuntimeAllowed(pathname: string): boolean {
  return STORE_RUNTIME_ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function handleStoreOnlyRuntime(req: NextRequest, pathname: string): NextResponse | null {
  if (process.env.STORE_ONLY_RUNTIME !== 'true') return null;
  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/store';
    return NextResponse.redirect(url, 307);
  }
  if (isStoreRuntimeAllowed(pathname)) return NextResponse.next();
  return NextResponse.redirect(new URL(`https://www.elevateforhumanity.org${pathname}${req.nextUrl.search}`), 307);
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isStaticRequest(pathname)) return NextResponse.next();

  const storeRuntimeResponse = handleStoreOnlyRuntime(req, pathname);
  if (storeRuntimeResponse) return storeRuntimeResponse;

  const host = requestHost(req);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', `${pathname}${search}`);

  if (pathname.startsWith('/api/tenant-sites/')) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const tenantSlug = tenantSlugFromAppHost(host);
  if (tenantSlug) return rewriteTenantAppHostRequest(req, tenantSlug, pathname, requestHeaders);
  if (isCustomTenantHost(host)) return rewriteCustomDomainRequest(req, host, pathname, requestHeaders);

  // Preserve the pathname header for all requests so the root layout can
  // reliably distinguish operational software from public marketing chrome.
  if (!isProtectedPortal(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createMiddlewareSupabaseClient(req, (cookiesToSet) => {
    cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
    response = NextResponse.next({ request: { headers: requestHeaders } });
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, cookieOptions(name, options as Record<string, unknown>) as any);
    });
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
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

export const config = { matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'] };
