import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ROOT_DOMAIN = '.elevateforhumanity.org';
const LEGACY_TENANT_APP_SUFFIX = '.app.elevateforhumanity.org';
const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'admin', 'lms', 'portal', 'store', 'testing', 'phone', 'mail', 'email', 'webmail',
  'smtp', 'api', 'cdn', 'assets', 'static', 'docs', 'status', 'staging', 'dev', 'preview',
  'ns1', 'ns2', 'ns3', 'ftp', 'autodiscover',
]);

export function isReservedTenantSubdomain(slug: string): boolean {
  return RESERVED_SUBDOMAINS.has(slug.toLowerCase());
}

/** Extract workspace slug from `{slug}.elevateforhumanity.org` or legacy `{slug}.app.elevateforhumanity.org`. */
export function tenantSlugFromAppHost(host: string): string | null {
  const normalized = host.split(':')[0]?.toLowerCase() ?? '';
  const suffix = normalized.endsWith(LEGACY_TENANT_APP_SUFFIX)
    ? LEGACY_TENANT_APP_SUFFIX
    : normalized.endsWith(ROOT_DOMAIN)
      ? ROOT_DOMAIN
      : null;
  if (!suffix) return null;
  const slug = normalized.slice(0, -suffix.length);
  if (!slug || slug.includes('.') || RESERVED_SUBDOMAINS.has(slug)) return null;
  return slug;
}

export function isTenantAppSubdomainHost(host: string): boolean {
  return tenantSlugFromAppHost(host) !== null;
}

/**
 * Rewrite public tenant traffic to the tenant-site App Router segment.
 * Only explicit /admin paths route to the tenant admin area. The tenant
 * subdomain root is the published customer-facing website.
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

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const adminPath = pathname === '/admin' ? '/admin/dashboard' : pathname;
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
