import { siteUrls } from '@/lib/utils/site-urls';

const ADMIN_PATH_PREFIXES = [
  '/lms/dashboard',
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
  '/lms/settings',
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

/** Convert a canonical role destination into its deployed application URL. */
export function absoluteRoleDestination(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (ADMIN_PATH_PREFIXES.some((prefix) => matches(normalized, prefix))) {
    return `${siteUrls.admin}${normalized}`;
  }

  if (MARKETING_PATH_PREFIXES.some((prefix) => matches(normalized, prefix))) {
    return `${siteUrls.site}${normalized}`;
  }

  return `${siteUrls.app}${normalized}`;
}
