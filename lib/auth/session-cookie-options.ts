/** Share sessions only within the owned portal domain. Preview and local hosts
 * must use host-only cookies; a foreign Domain attribute is rejected by browsers. */
export function sessionCookieOptions<T extends object>(
  options: T,
  hostname: string,
): T {
  const scoped = { ...options } as T & { domain?: string };
  delete scoped.domain;
  const host = hostname.trim().toLowerCase().replace(/:\d+$/, '');
  if (/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*elevateforhumanity\.org$/.test(host)) {
    scoped.domain = '.elevateforhumanity.org';
  }
  return scoped;
}
