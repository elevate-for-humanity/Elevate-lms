import { createMiddlewareSupabaseClient, hasSupabaseAuthCookie } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import {
  rewriteCustomDomainRequest,
  rewriteTenantAppHostRequest,
  tenantSlugFromAppHost,
} from '@/lib/tenant/middleware-tenant-routing';
import { ADMIN_HOST, LMS_HOST, MARKETING_HOST, getPortalKeyFromPath, PORTAL_MAP } from '@/lib/routing/portal-map';
import { getPublicRuntimeService } from '@/lib/health/public-runtime-service';
import { isWithdrawnProgramRequest } from '@/lib/programs/withdrawn-programs.mjs';
import { resolvePublicEntryAlias } from '@/lib/routing/public-entry-aliases.mjs';

// These route families are authenticated operational software, not public
// marketing pages. Protect the complete family so child routes cannot inherit
// a weaker boundary than their dashboard entry point.
const PROTECTED_PORTAL_PREFIXES = [
  '/case-manager',
  '/workforce-board',
  '/provider',
  '/tax-software/self-file',
  '/tax-software/office',
] as const;

// Competency forms are operational apprenticeship records. They used to be
// rendered by the public marketing app, which made blank sign-off sheets and
// agreements crawlable. Keep one hard boundary here: the marketing host never
// serves this route family and hands it to the authenticated LMS instead.
const PRIVATE_APP_REDIRECTS = [
  {
    prefix: '/compliance/competency-verification',
    destination: '/apprenticeship/compliance',
  },
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

const DEPLOYMENT_HOST_SUFFIXES = ['.northflank.app', '.run.app'] as const;

const STORE_RUNTIME_ALLOWED_PREFIXES = [
  '/store', '/login', '/signup', '/register', '/forgot-password', '/reset-password', '/auth',
  '/privacy', '/terms-of-service', '/security-and-data-protection',
  '/api/store', '/api/webhooks/store', '/api/webhooks/stripe', '/api/auth', '/api/version', '/api/ping', '/api/health', '/api/ready',
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

function normalizeHost(value: string | null | undefined) {
  return (value || '').split(',')[0].trim().split(':')[0].toLowerCase();
}

function requestHost(req: NextRequest) {
  const direct = normalizeHost(req.headers.get('host'));
  const forwarded = normalizeHost(req.headers.get('x-forwarded-host'));

  // Prefer an explicitly recognized Elevate public host from either header.
  // Enterprise proxies and multi-hop CDNs can rewrite X-Forwarded-Host; treating
  // that rewritten value as a customer custom domain can incorrectly send a
  // normal www request through tenant routing and produce intermittent 404s.
  if (ELEVATE_PUBLIC_HOSTS.has(direct)) return direct;
  if (ELEVATE_PUBLIC_HOSTS.has(forwarded)) return forwarded;

  // Northflank/deployment hosts remain operational surfaces and should not be
  // mistaken for tenant custom domains when a proxy supplies both headers.
  if (isDeploymentHost(direct)) return direct;
  if (isDeploymentHost(forwarded)) return forwarded;

  return forwarded || direct;
}

function isStaticRequest(pathname: string) {
  return pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/robots.txt') || pathname.startsWith('/sitemap') || /\.[a-z0-9]+$/i.test(pathname);
}

function isCustomTenantHost(host: string) {
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
  if (isDeploymentHost(host)) return false;
  if (ELEVATE_PUBLIC_HOSTS.has(host)) return false;
  if (host.endsWith('.elevateforhumanity.org')) return false;
  return true;
}

function isDeploymentHost(host: string) {
  return DEPLOYMENT_HOST_SUFFIXES.some(
    (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
  );
}

function deploymentHostResponse(
  pathname: string,
  search: string,
  requestHeaders: Headers,
) {
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set(
    'Link',
    `<https://www.elevateforhumanity.org${pathname}${search}>; rel="canonical"`,
  );
  return response;
}

function isStoreRuntimeAllowed(pathname: string): boolean {
  return STORE_RUNTIME_ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function handleStoreOnlyRuntime(req: NextRequest, pathname: string): NextResponse | null {
  if (getPublicRuntimeService() !== 'store') return null;
  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/store';
    return NextResponse.redirect(url, 307);
  }
  // Provider callbacks must reach Store's verified handlers without a Marketing hop.
  const commerceCallbacks = ['/api/webhooks/paypal-billing', '/api/webhooks/quickbooks'];
  // These handlers are called by Store's trial form and PARIS advisor. A
  // cross-origin POST redirect loses the same-origin response/cookie boundary.
  const storeExperienceEndpoints = ['/api/trial/start-managed', '/api/ai-chat', '/api/voice/natural'];
  // The cart uses this authenticated billing endpoint for individual apps.
  if (commerceCallbacks.includes(pathname) || storeExperienceEndpoints.includes(pathname) || pathname === '/api/apps/upgrade' || isStoreRuntimeAllowed(pathname)) return NextResponse.next();
  return NextResponse.redirect(new URL(`https://www.elevateforhumanity.org${pathname}${req.nextUrl.search}`), 307);
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isWithdrawnProgramRequest(pathname, req.nextUrl.searchParams.get('program'))) {
    return new NextResponse('This program is no longer available.', {
      status: 410,
      headers: {'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Content-Type':'text/plain; charset=utf-8'},
    });
  }
  // Infrastructure probes use internal hosts as well as public domains. These
  // exact service endpoints must never enter tenant, auth or canonical routing.
  if (['/api/ping', '/api/ready', '/api/health'].includes(pathname)) {
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
  if (isStaticRequest(pathname) && !isProtectedPortal(pathname) && !getPortalKeyFromPath(pathname) && !pathname.startsWith('/admin/') && !pathname.startsWith('/cosmetology-host-shop/')) return NextResponse.next();

  const storeRuntimeResponse = handleStoreOnlyRuntime(req, pathname);
  if (storeRuntimeResponse) return storeRuntimeResponse;

  // Redirect unauthenticated entry at the edge: do not rely on a page render
  // or client navigation to return the canonical login redirect status.
  if (pathname === '/login' && getPublicRuntimeService() !== 'store') {
    const target = new URL('/login', LMS_HOST);
    for (const key of ['next', 'redirect', 'reason']) {
      const value = req.nextUrl.searchParams.get(key);
      if (value) target.searchParams.set(key, value);
    }
    return NextResponse.redirect(target, 307);
  }

  const host = requestHost(req);

  // Marketing links to the existing Store application; it does not serve a
  // second public storefront. Keep mutation callbacks on their existing URLs.
  const marketingStoreHost = ['www.elevateforhumanity.org', 'elevateforhumanity.org'].includes(host) || host.endsWith('.run.app');
  if (marketingStoreHost && ['GET', 'HEAD'].includes(req.method) && (pathname === '/store' || pathname.startsWith('/store/'))) {
    return NextResponse.redirect(new URL(pathname + search, 'https://store.elevateforhumanity.org'), 307);
  }

  if (host === 'elevateforhumanity.org') {
    return NextResponse.redirect(
      new URL(`https://www.elevateforhumanity.org${pathname}${search}`),
      308,
    );
  }

  const privateAppRoute = PRIVATE_APP_REDIRECTS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (privateAppRoute) {
    const destination = new URL(privateAppRoute.destination, LMS_HOST);
    const response = NextResponse.redirect(destination, 308);
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return response;
  }

  const adminCanonicalPaths: Record<string, string> = {
    '/auth/admin/reset-password': '/auth/reset-password',
    '/instructor/instructors/performance': '/instructors/performance',
  };
  const adminDestination = adminCanonicalPaths[pathname];
  if (adminDestination) {
    const destination = new URL(adminDestination, ADMIN_HOST);
    destination.search = search;
    const response = NextResponse.redirect(destination, 307);
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  }

  const legacyStudentPaths: Record<string, string> = {
    '/student': '/lms/dashboard',
    '/student-portal': '/lms/dashboard',
    '/student/dashboard': '/lms/dashboard',
    '/student/login': '/login',
  };
  const studentDestination = legacyStudentPaths[pathname];
  if (studentDestination) {
    const destination = new URL(studentDestination, LMS_HOST);
    destination.search = search;
    const response = NextResponse.redirect(destination, 307);
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return response;
  }

  // Exact public aliases must precede the portal prefix registry. Nested
  // employer/testing paths retain their operational ownership and auth gates.
  const publicEntry = resolvePublicEntryAlias({
    host, pathname, search, method: req.method,
    marketingHost: MARKETING_HOST, lmsHost: LMS_HOST,
  });
  if (publicEntry) {
    const response = NextResponse.redirect(publicEntry, 307);
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    if (pathname.replace(/\/$/, '') === '/learner/dashboard') {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }
    return response;
  }

  // Operational portal URLs on www must never render marketing catch-all
  // pages. Resolve ownership from the same registry used by portal links.
  const portalKey = getPortalKeyFromPath(pathname);
  const portal = portalKey ? PORTAL_MAP[portalKey] : null;
  const legacyAdmin = pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/dashboard' || pathname.startsWith('/dashboard/') || pathname === '/studio' || pathname.startsWith('/studio/');
  const legacyHostShop = pathname === '/cosmetology-host-shop' || pathname.startsWith('/cosmetology-host-shop/');
  if ((portal && portal.subdomain !== 'marketing') || legacyAdmin || legacyHostShop) {
    const destination = new URL(
      legacyHostShop ? pathname.replace('/cosmetology-host-shop', '/host-shop') : pathname,
      legacyAdmin ? ADMIN_HOST : portal?.host || LMS_HOST,
    );
    destination.search = search;
    const response = NextResponse.redirect(destination, 307);
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return response;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', `${pathname}${search}`);

  // Build and provider URLs are operational deployment surfaces, not public
  // websites or customer custom domains. Keep them usable for health checks
  // while preventing search engines from indexing a second copy of Marketing.
  if (isDeploymentHost(host) && !isProtectedPortal(pathname)) {
    return deploymentHostResponse(pathname, search, requestHeaders);
  }

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

  const loginRedirect = () => {
    const taxWorkspace = pathname === '/tax-software/self-file' || pathname.startsWith('/tax-software/self-file/') || pathname === '/tax-software/office' || pathname.startsWith('/tax-software/office/');
    const loginUrl = taxWorkspace
      ? new URL('/tax-software/login', MARKETING_HOST)
      : new URL('/login', LMS_HOST);
    loginUrl.searchParams.set('redirect', taxWorkspace ? `${pathname}${search}` : `${MARKETING_HOST}${pathname}${search}`);
    const result = NextResponse.redirect(loginUrl);
    result.headers.set('Cache-Control', 'private, no-store, max-age=0');
    result.headers.set('Vary', 'Cookie');
    result.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return result;
  };
  if (!hasSupabaseAuthCookie(req)) return loginRedirect();

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createMiddlewareSupabaseClient(req, (cookiesToSet) => {
    cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
    requestHeaders.set('cookie', req.cookies.toString());
    response = NextResponse.next({ request: { headers: requestHeaders } });
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, cookieOptions(name, options as Record<string, unknown>) as any);
    });
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    const redirect = loginRedirect();
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.cookies.set('__efh_pathname', `${pathname}${search}`, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60,
  });
  return response;
}

export const config = { runtime: 'nodejs', matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'] };
