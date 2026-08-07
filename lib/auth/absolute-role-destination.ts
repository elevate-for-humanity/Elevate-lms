import { siteUrls } from '@/lib/utils/site-urls';

/**
 * Convert a canonical role destination into the correct deployed application URL.
 *
 * Role destinations intentionally encode admin routes with an /admin prefix so
 * authentication code can distinguish the Admin application from the LMS.
 * The Admin application's actual pathname omits that prefix (for example,
 * /admin/dashboard -> https://admin.elevateforhumanity.org/dashboard).
 * All other role destinations belong to the LMS/application origin.
 */
export function absoluteRoleDestination(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  if (path === '/admin') return siteUrls.admin;
  if (path.startsWith('/admin/')) {
    return `${siteUrls.admin}${path.slice('/admin'.length)}`;
  }

  return `${siteUrls.app}${path.startsWith('/') ? path : `/${path}`}`;
}
