/**
 * Canonical post-authentication destination by role.
 *
 * This compact path map is used by code that still needs a relative role destination.
 * Cross-domain login routing should prefer lib/routing/dashboard-resolver.ts.
 * No legacy portal aliases belong here.
 */

export type UserRole =
  | 'student'
  | 'instructor'
  | 'admin'
  | 'super_admin'
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
  super_admin: '/admin/dashboard',
  admin: '/admin/dashboard',
  org_admin: '/admin/dashboard',
  staff: '/admin/staff-portal/dashboard',
  instructor: '/admin/instructor/dashboard',

  creator: '/creator/products',
  case_manager: '/case-manager/dashboard',
  workforce_board: '/workforce-board/dashboard',
  program_holder: '/program-holder/dashboard',
  provider_admin: '/provider/dashboard',

  sponsor: '/employer/dashboard',
  employer: '/employer/dashboard',

  // Partner was an old Host Shop alias. Do not route users back into /partner/*.
  partner: '/host-shop/dashboard',
  host_shop: '/host-shop/dashboard',
  host_shop_admin: '/host-shop/dashboard',

  // Standard learners use the actual LMS dashboard, not /learner/dashboard redirect shells.
  student: '/lms/dashboard',
  delegate: '/lms/dashboard',
  grant_client: '/lms/dashboard',

  // Exact occupation portal is resolved by resolveStudentHomePath during login.
  apprentice: '/apprentice',

  test_admin: '/admin/testing-center',
  proctor: '/admin/testing-center',
};

export function getRoleDestination(role: string | null | undefined): string {
  if (!role) return '/lms/dashboard';
  return ROLE_DESTINATIONS[role] ?? '/lms/dashboard';
}
