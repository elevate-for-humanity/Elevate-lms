/** Keep tenant navigation within its published path-based preview. */
export function tenantSiteHref(href: string, basePath = ''): string {
  if (!basePath || !href.startsWith('/') || href.startsWith('//')) return href;
  if (href === basePath || href.startsWith(`${basePath}/`)) return href;
  return href === '/' ? basePath : `${basePath}${href}`;
}
