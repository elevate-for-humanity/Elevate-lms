/**
 * Validate a redirect URL parameter to prevent open-redirect attacks.
 * Only allows same-origin paths: must start with / and not contain
 * protocol schemes or double slashes.
 *
 * Returns the validated path or the fallback if invalid.
 */
export function validateRedirect(url: string | null | undefined, fallback: string = '/'): string {
  if (!url || typeof url !== 'string') return fallback;

  const trimmed = url.trim();

  // Must start with exactly one /
  if (!trimmed.startsWith('/')) return fallback;

  // Block protocol-relative URLs (//evil.com) and embedded schemes
  if (trimmed.startsWith('//')) return fallback;
  if (/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return fallback;

  // Block encoded variants of the above
  const decoded = decodeURIComponent(trimmed);
  if (decoded.startsWith('//')) return fallback;
  if (/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) return fallback;

  // Block backslash (some browsers treat \ as /)
  if (trimmed.includes('\\')) return fallback;

  return trimmed;
}
