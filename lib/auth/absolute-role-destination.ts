import { siteUrls } from '@/lib/utils/site-urls';

const ADMIN_PATH_PREFIXES = [
  '/dashboard',
  '/staff-portal',
  '/instructor',
  '/testing-center',
  '/applications',
  '/students',
  '/programs',
  '/funding',
  '/crm',
  '/compliance',
  '/studio',
  '/settings',
  '/integrations',
  '/operations',
  '/system-health',
] as const;

const MARKETING_PATH_PREFIXES = [
  '/case-manager',
  '/workforce-board',
  '/program-holder',
  '/provider',
  '/creator',
] as const;

function matches(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`);
}

/**
 * Convert a canonical role destination into its deployed application URL.
 * Admin paths are their real root paths on the Admin hostname; no synthetic
 * /admin prefix is used anywhere in the role-routing contract.
 */
export function absoluteRoleDestination(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (ADMIN_PATH_PREFIXES.some((prefix) => matches(normalized, prefix))) {
    return `${siteUrls.admin}${normalized}`;
  }

  if (MARKETING_PATH_PREFIXES.some((prefix) => matches(normalized, prefix))) {
    return `${siteUrls.marketing}${normalized}`;
  }

  return `${siteUrls.app}${normalized}`;
}
