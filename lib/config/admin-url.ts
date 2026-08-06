/**
 * lib/config/admin-url.ts
 *
 * Canonical Admin domain URL helper.
 *
 * Marketing (www), Admin, and LMS are separate deployments on different domains.
 * When linking from Marketing pages to Admin pages (or calling Admin APIs),
 * use absolute URLs pointing to the Admin origin — NOT relative paths.
 *
 * Incorrect (relative, stays on www origin):
 *   <Link href="/admin/programs">Programs</Link>
 *   fetch('/api/admin/...')
 *
 * Correct (absolute, goes to admin domain):
 *   <a href={getAdminUrl('/programs')}>Programs</a>
 *   fetch(getAdminUrl('/api/admin/...'), { credentials: 'include' })
 */

const ADMIN_ORIGIN =
  process.env.NEXT_PUBLIC_ADMIN_URL ??
  'https://admin.elevateforhumanity.org';

export function getAdminUrl(path = '/'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, ADMIN_ORIGIN).toString();
}

export const ADMIN_ORIGIN_URL = ADMIN_ORIGIN;
