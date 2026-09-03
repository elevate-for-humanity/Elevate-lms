/**
 * lib/config/admin-url.ts
 *
 * Canonical Admin domain URL helper.
 *
 * Marketing (www), Admin, and LMS are separate deployments on different domains.
 * When linking from Marketing pages to Admin pages (or calling Admin APIs),
 * use absolute URLs pointing to the Admin origin — NOT relative paths.
 */

const DEFAULT_ADMIN_ORIGIN = 'https://admin.elevateforhumanity.org';

function resolveAdminOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_ADMIN_URL?.trim();
  if (!configured) return DEFAULT_ADMIN_ORIGIN;

  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return DEFAULT_ADMIN_ORIGIN;
    }
    return url.origin;
  } catch {
    return DEFAULT_ADMIN_ORIGIN;
  }
}

const ADMIN_ORIGIN = resolveAdminOrigin();

export function getAdminUrl(path = '/'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, `${ADMIN_ORIGIN}/`).toString();
}

export const ADMIN_ORIGIN_URL = ADMIN_ORIGIN;
