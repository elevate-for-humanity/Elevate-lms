/** Keep the tax sign-in return path on this origin and within known tax workflows. */
export function taxLoginDestination(requested: string | null, origin: string): string {
  const fallback = '/tax-software/self-file';
  if (!requested) return fallback;
  try {
    const url = new URL(requested, origin);
    const roots = ['/tax-software/self-file', '/tax-software/office', '/tax-software/careers'];
    if (
      url.origin === origin &&
      roots.some((root) => url.pathname === root || url.pathname.startsWith(root + '/'))
    )
      return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
  return fallback;
}
