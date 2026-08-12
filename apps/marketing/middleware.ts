import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  rewriteCustomDomainRequest,
  rewriteTenantAppHostRequest,
  tenantSlugFromAppHost,
} from '@/lib/tenant/middleware-tenant-routing';

const PROTECTED_PORTAL_PREFIXES = [
  '/program-holder/dashboard',
  '/program-holder/students',
  '/program-holder/documents',
  '/program-holder/hours',
  '/program-holder/reports',
  '/case-manager/dashboard',
  '/workforce-board/dashboard',
  '/provider/dashboard',
  '/creator/products',
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
  // Named Elevate service hosts are not customer domains. Wildcard tenant
  // subdomains are handled separately by tenantSlugFromAppHost().
  if (host.endsWith('.elevateforhumanity.org')) return false;
  return true;
}

/**
 * Marketing is public, but it also serves Website Builder tenant sites.
 * Host routing must happen before portal authentication so a published tenant
 * domain resolves to /tenant-site while Elevate's own public routes remain
 * untouched.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isStaticRequest(pathname)) return NextResponse.next();

  const host = requestHost(req);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', `${pathname}${search}`);

  // {subdomain}.app.elevateforhumanity.org → public Website Builder site.
  const tenantSlug = tenantSlugFromAppHost(host);
  if (tenantSlug) {
    return rewriteTenantAppHostRequest(req, tenantSlug, pathname, requestHeaders);
  }

  // Customer-owned domains routed to the Marketing service are resolved by
  // hostname in the tenant loader. Unknown domains safely end at tenant 404.
  if (isCustomTenantHost(host)) {
    return rewriteCustomDomainRequest(req, host, pathname, requestHeaders);
  }

  if (!isProtectedPortal(pathname)) return NextResponse.next();

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(
              name,
              value,
              cookieOptions(name, options as Record<string, unknown>) as any,
            );
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
