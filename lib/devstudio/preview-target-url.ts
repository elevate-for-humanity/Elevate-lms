/** Resolve internal workspace routes in the current authenticated deployment. */
export function resolveStudioPreviewUrl(target: string, currentOrigin: string): string {
  const value = target.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (!value.startsWith('/') || value.startsWith('//')) return '';
  const origin = new URL(currentOrigin);
  if (origin.protocol !== 'https:' && origin.protocol !== 'http:') return '';
  return new URL(value, origin.origin).href;
}
