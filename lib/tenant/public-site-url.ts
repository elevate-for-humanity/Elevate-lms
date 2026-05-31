const TENANT_HOST_SUFFIX = '.app.elevateforhumanity.org';

export function tenantPublicSiteUrl(subdomain: string, path = '/'): string {
  const base = `https://${subdomain}${TENANT_HOST_SUFFIX}`;
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function tenantAdminUrl(subdomain: string, path = '/admin/dashboard'): string {
  return tenantPublicSiteUrl(subdomain, path);
}
