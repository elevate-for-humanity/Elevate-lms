import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Validate a redirect URL parameter to prevent open-redirect attacks.
 * Allows:
 *   - Same-origin paths (start with /)
 *   - Trusted cross-origin URLs on elevateforhumanity.org subdomains
 *
 * Returns the validated URL/path or the fallback if invalid.
 */

const TRUSTED_HOSTS = [
  PLATFORM_DEFAULTS.canonicalDomain,
  PLATFORM_DEFAULTS.canonicalDomain,
  'admin.elevateforhumanity.org',
];

export function validateRedirect(url: string | null | undefined, fallback: string = '/'): string {
  if (!url || typeof url !== 'string') return fallback;

  const trimmed = url.trim();

  // Allow trusted cross-origin redirects (e.g. admin domain after LMS login)
  if (trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (TRUSTED_HOSTS.includes(parsed.host)) return trimmed;
    } catch {
      // invalid URL — fall through to path checks
    }
    return fallback;
  }

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
