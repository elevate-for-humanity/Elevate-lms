import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import type { ReadonlyURLSearchParams } from 'next/navigation';

/**
 * Validate a redirect URL parameter to prevent open-redirect attacks.
 * Allows:
 *   - Same-origin paths (start with /)
 *   - Trusted cross-origin URLs on elevateforhumanity.org subdomains
 *
 * Returns the validated URL/path or the fallback if invalid.
 */

/**
 * Read and extract the redirect URL from search params.
 * Supports both 'redirect' and legacy 'next' params.
 */
export function readRedirectParam(
  searchParams: ReadonlyURLSearchParams | URLSearchParams | null,
): string | null {
  if (!searchParams) return null;

  // Support both 'redirect' and legacy 'next' param names
  const redirect = searchParams.get('redirect') ?? searchParams.get('next');
  if (redirect && typeof redirect === 'string') return redirect;

  return null;
}

const TRUSTED_HOSTS = [
  PLATFORM_DEFAULTS.canonicalDomain,
  'www.elevateforhumanity.org',
  'admin.elevateforhumanity.org',
  'app.elevateforhumanity.org',
  'store.elevateforhumanity.org',
];

/**
 * Join a pathname and a search string into a return path.
 * Normalises missing leading slashes.
 */
export function buildReturnPath(pathname: string, search: string = ''): string {
  const normalised = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${normalised}${search}`;
}

/**
 * Build a login URL with an encoded redirect parameter.
 */
export function buildLoginUrl(origin: string, redirect: string): URL {
  const url = new URL('/login', origin);
  url.searchParams.set('redirect', redirect);
  return url;
}

/**
 * Resolve a redirect target to an absolute URL.
 * Relative paths are resolved against the provided origin.
 * Already-absolute URLs are returned as-is.
 */
export function resolveRedirectLocation(target: string, origin: string): URL {
  if (target.startsWith('http://') || target.startsWith('https://')) {
    return new URL(target);
  }
  return new URL(target, origin);
}

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
