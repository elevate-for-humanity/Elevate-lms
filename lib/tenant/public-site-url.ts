export const TENANT_HOST_SUFFIX = '.elevateforhumanity.org';

export function tenantPublicHost(subdomain: string): string {
  return `${subdomain}${TENANT_HOST_SUFFIX}`;
}

export function tenantPublicSiteUrl(subdomain: string, path = '/'): string {
  const base = `https://${tenantPublicHost(subdomain)}`;
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function tenantAdminUrl(subdomain: string, path = '/admin/dashboard'): string {
  return tenantPublicSiteUrl(subdomain, path);
}
