/** Keep tenant navigation within its published path-based preview. */
export function tenantSiteHref(href: string, basePath = ''): string {
  if (!basePath || !href.startsWith('/') || href.startsWith('//')) return href;
  // Authenticated review pages select their page in the URL rather than
  // exposing a published customer route. Real hrefs also support new tabs,
  // copied links, and browser history without relying on click interception.
  if (basePath.endsWith('?page=')) {
    if (href.startsWith(basePath)) return href;
    const url = new URL(href, 'https://tenant.invalid');
    return `${basePath}${encodeURIComponent(url.pathname)}${url.search ? `&${url.search.slice(1)}` : ''}${url.hash}`;
  }
  if (href === basePath || href.startsWith(`${basePath}/`)) return href;
  return href === '/' ? basePath : `${basePath}${href}`;
}
