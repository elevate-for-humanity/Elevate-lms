/**
 * Canonical post-authentication destination by role.
 *
 * Paths are the actual pathnames on their deployed application. Admin routes
 * therefore use root paths on admin.elevateforhumanity.org and never encode a
 * synthetic /admin prefix.
 */

import { ADMIN_HOST, LMS_HOST, MARKETING_HOST } from '@/lib/routing/portal-map';

export type UserRole =
  | 'student'
  | 'instructor'
  | 'admin'
  | 'org_admin'
  | 'staff'
  | 'program_holder'
  | 'delegate'
  | 'partner'
  | 'host_shop'
  | 'host_shop_admin'
  | 'sponsor'
  | 'employer'
  | 'creator'
  | 'workforce_board'
  | 'case_manager'
  | 'provider_admin'
  | 'grant_client'
  | 'apprentice'
  | 'test_admin'
  | 'proctor';

export const ROLE_DESTINATIONS: Record<string, string> = {
  admin: '/dashboard',
  org_admin: '/dashboard',
  staff: '/staff-portal/dashboard',
  instructor: '/instructor/dashboard',

  creator: '/creator/products',
  case_manager: '/case-manager/dashboard',
  workforce_board: '/workforce-board/dashboard',
  program_holder: '/program-holder/dashboard',
  provider_admin: '/provider/dashboard',

  sponsor: '/employer/dashboard',
  employer: '/employer/dashboard',

  partner: '/host-shop/dashboard',
  host_shop: '/host-shop/dashboard',
  host_shop_admin: '/host-shop/dashboard',

  student: '/lms/dashboard',
  delegate: '/lms/dashboard',
  grant_client: '/lms/dashboard',

  apprentice: '/apprentice',

  test_admin: '/testing-center',
  proctor: '/testing-center',
};

const ADMIN_HOST_ROLES = new Set([
  'admin',
  'org_admin',
  'staff',
  'instructor',
  'test_admin',
  'proctor',
]);

const LMS_HOST_ROLES = new Set([
  'student',
  'delegate',
  'grant_client',
  'apprentice',
  'sponsor',
  'employer',
  'partner',
  'host_shop',
  'host_shop_admin',
]);

export function getRoleDestination(role: string | null | undefined): string {
  if (!role) return '/lms/dashboard';
  return ROLE_DESTINATIONS[role] ?? '/lms/dashboard';
}

/**
 * Full cross-application destination for login/global navigation.
 * Use this when the caller may be running on a different Elevate subdomain.
 */
export function getRoleDestinationUrl(role: string | null | undefined): string {
  const normalizedRole = role ?? 'student';
  const path = getRoleDestination(normalizedRole);

  if (ADMIN_HOST_ROLES.has(normalizedRole)) return `${ADMIN_HOST}${path}`;
  if (LMS_HOST_ROLES.has(normalizedRole)) return `${LMS_HOST}${path}`;

  // Workforce-board, case-manager, provider, program-holder, and creator
  // currently live in the Marketing application by design.
  if (normalizedRole in ROLE_DESTINATIONS) return `${MARKETING_HOST}${path}`;

  return `${LMS_HOST}/lms/dashboard`;
}
