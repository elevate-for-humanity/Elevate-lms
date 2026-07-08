import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const TENANT_APP_SUFFIX = '.app.elevateforhumanity.org';

/** Extract workspace slug from `{slug}.app.elevateforhumanity.org`. */
export function tenantSlugFromAppHost(host: string): string | null {
  const normalized = host.split(':')[0]?.toLowerCase() ?? '';
  if (!normalized.endsWith(TENANT_APP_SUFFIX)) return null;
  const slug = normalized.slice(0, -TENANT_APP_SUFFIX.length);
  if (!slug || slug.includes('.')) return null;
  return slug;
}

export function isTenantAppSubdomainHost(host: string): boolean {
  return tenantSlugFromAppHost(host) !== null;
}

/**
 * Rewrite public tenant traffic to the tenant-site App Router segment.
 * Admin paths on the same host still rewrite to /admin/*.
 */
export function rewriteTenantAppHostRequest(
  request: NextRequest,
  tenantSlug: string,
  pathname: string,
  baseHeaders: Headers,
): NextResponse {
  const requestHeadersWithTenant = new Headers(baseHeaders);
  requestHeadersWithTenant.set('x-tenant-slug', tenantSlug);
  requestHeadersWithTenant.set('x-pathname', pathname);

  if (pathname === '/' || pathname === '/admin' || pathname.startsWith('/admin/')) {
    const adminPath = pathname === '/' || pathname === '/admin' ? '/admin/dashboard' : pathname;
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = adminPath;
    return NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeadersWithTenant },
    });
  }

  const rewriteUrl = request.nextUrl.clone();
  const segments = pathname.replace(/^\//, '');
  rewriteUrl.pathname = segments ? `/tenant-site/${segments}` : '/tenant-site';
  return NextResponse.rewrite(rewriteUrl, {
    request: { headers: requestHeadersWithTenant },
  });
}

/** Custom domain — resolve slug in tenant-site via x-tenant-host. */
export function rewriteCustomDomainRequest(
  request: NextRequest,
  host: string,
  pathname: string,
  baseHeaders: Headers,
): NextResponse {
  const requestHeadersWithTenant = new Headers(baseHeaders);
  requestHeadersWithTenant.set('x-tenant-host', host.split(':')[0]?.toLowerCase() ?? host);
  requestHeadersWithTenant.set('x-pathname', pathname);

  const rewriteUrl = request.nextUrl.clone();
  const segments = pathname.replace(/^\//, '');
  rewriteUrl.pathname = segments ? `/tenant-site/${segments}` : '/tenant-site';
  return NextResponse.rewrite(rewriteUrl, {
    request: { headers: requestHeadersWithTenant },
  });
}
