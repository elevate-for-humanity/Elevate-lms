/**
 * Validate a redirect URL parameter to prevent open-redirect attacks.
 * Allows:
 *   - Same-origin paths (start with /)
 *   - Trusted cross-origin URLs on elevateforhumanity.org subdomains
 *
 * Returns the validated URL/path or the fallback if invalid.
 */

const CANONICAL_DOMAIN = process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || 'www.elevateforhumanity.org';

const TRUSTED_HOSTS = [
  CANONICAL_DOMAIN,
  'elevateforhumanity.org',
  'admin.elevateforhumanity.org',
];

/** Pathname + query (and hash) for post-login return URLs. */
export function buildReturnPath(pathname: string, search = '', hash = ''): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${path}${search}${hash}`;
}

/**
 * Build a clean return path by stripping any existing `redirect` or `next`
 * query params from the original URL. This prevents double-encoding when the
 * login page re-encodes the redirect parameter.
 */
export function buildCleanReturnPath(pathname: string, search = ''): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  // Strip existing redirect/next params to avoid double-encoding
  const params = new URLSearchParams(search);
  params.delete('redirect');
  params.delete('next');
  const cleanSearch = params.toString() ? `?${params.toString()}` : '';
  return `${path}${cleanSearch}`;
}

/** Read canonical ?redirect= with legacy ?next= fallback. */
export function readRedirectParam(
  searchParams: Pick<URLSearchParams, 'get'>,
): string | null {
  return searchParams.get('redirect') ?? searchParams.get('next');
}

/** Build /login?redirect=… with proper encoding (preserves nested query strings). */
export function buildLoginUrl(base: string | URL, returnPath: string): URL {
  const loginUrl = new URL('/login', base);
  loginUrl.searchParams.set('redirect', returnPath);
  return loginUrl;
}

/** Resolve a validated redirect target to an absolute URL for server redirects. */
export function resolveRedirectLocation(target: string, origin: string): URL {
  if (target.startsWith('https://')) {
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
