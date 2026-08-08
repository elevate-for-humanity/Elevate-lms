/**
 * lib/routing/dashboard-resolver.ts
 *
 * SINGLE SOURCE OF TRUTH for role → dashboard URL resolution.
 *
 * Every login redirect and post-auth redirect should call resolveDashboardUrl().
 * Paths in this file are the ACTUAL deployed paths for each application host.
 */

import { MARKETING_HOST, ADMIN_HOST, LMS_HOST } from './portal-map';

interface RoleMapping {
  role: string;
  label: string;
  dashboardUrl: string;
  portalKey: string;
}

const ROLE_MAPPINGS: RoleMapping[] = [
  { role: 'student', label: 'Student', dashboardUrl: `${LMS_HOST}/lms/dashboard`, portalKey: 'lms' },
  { role: 'learner', label: 'Learner', dashboardUrl: `${LMS_HOST}/lms/dashboard`, portalKey: 'lms' },
  { role: 'user', label: 'User', dashboardUrl: `${LMS_HOST}/lms/dashboard`, portalKey: 'lms' },

  { role: 'admin', label: 'Admin', dashboardUrl: `${ADMIN_HOST}/dashboard`, portalKey: 'admin' },
  { role: 'super_admin', label: 'Super Admin', dashboardUrl: `${ADMIN_HOST}/dashboard`, portalKey: 'admin' },
  { role: 'org_admin', label: 'Org Admin', dashboardUrl: `${ADMIN_HOST}/dashboard`, portalKey: 'admin' },
  { role: 'staff', label: 'Staff', dashboardUrl: `${ADMIN_HOST}/staff-portal/dashboard`, portalKey: 'staff' },
  { role: 'instructor', label: 'Instructor', dashboardUrl: `${ADMIN_HOST}/instructor/dashboard`, portalKey: 'instructor' },

  { role: 'employer', label: 'Employer', dashboardUrl: `${LMS_HOST}/employer/dashboard`, portalKey: 'employer' },
  { role: 'recruiter', label: 'Recruiter', dashboardUrl: `${LMS_HOST}/employer/dashboard`, portalKey: 'employer' },

  { role: 'apprentice', label: 'Apprentice', dashboardUrl: `${LMS_HOST}/apprentice`, portalKey: 'apprentice' },
  { role: 'barber_apprentice', label: 'Barber Apprentice', dashboardUrl: `${LMS_HOST}/apprentice`, portalKey: 'apprentice' },
  { role: 'cosmetology_apprentice', label: 'Cosmetology Apprentice', dashboardUrl: `${LMS_HOST}/apprentice`, portalKey: 'apprentice' },

  { role: 'host_shop', label: 'Host Shop', dashboardUrl: `${LMS_HOST}/host-shop/dashboard`, portalKey: 'hostshop' },
  { role: 'host_shop_admin', label: 'Host Shop Admin', dashboardUrl: `${LMS_HOST}/host-shop/dashboard`, portalKey: 'hostshop' },
  // `partner` is retained as a database role value only. Its old /partner/* routes are not canonical.
  { role: 'partner', label: 'Host Shop Partner', dashboardUrl: `${LMS_HOST}/host-shop/dashboard`, portalKey: 'hostshop' },

  { role: 'workforce_partner', label: 'Workforce Partner', dashboardUrl: `${LMS_HOST}/workforce/dashboard`, portalKey: 'workforce' },
  { role: 'program_holder', label: 'Program Holder', dashboardUrl: `${MARKETING_HOST}/program-holder/dashboard`, portalKey: 'programholder' },
  { role: 'provider', label: 'Training Provider', dashboardUrl: `${MARKETING_HOST}/provider/dashboard`, portalKey: 'provider' },
  { role: 'provider_admin', label: 'Training Provider Admin', dashboardUrl: `${MARKETING_HOST}/provider/dashboard`, portalKey: 'provider' },
  { role: 'case_manager', label: 'Case Manager', dashboardUrl: `${MARKETING_HOST}/case-manager/dashboard`, portalKey: 'casemanager' },
  { role: 'workforce_board', label: 'Workforce Board', dashboardUrl: `${MARKETING_HOST}/workforce-board/dashboard`, portalKey: 'workforceboard' },
  { role: 'workforce_board_admin', label: 'Workforce Board Admin', dashboardUrl: `${MARKETING_HOST}/workforce-board/dashboard`, portalKey: 'workforceboard' },

  { role: 'advisor', label: 'Advisor', dashboardUrl: `${ADMIN_HOST}/dashboard`, portalKey: 'admin' },
  { role: 'parent', label: 'Parent', dashboardUrl: `${LMS_HOST}/parent-portal/dashboard`, portalKey: 'parent' },
  { role: 'test_admin', label: 'Test Admin', dashboardUrl: `${ADMIN_HOST}/testing-center`, portalKey: 'admin' },
  { role: 'proctor', label: 'Proctor', dashboardUrl: `${ADMIN_HOST}/testing-center`, portalKey: 'admin' },
];

export function resolveDashboardUrl(
  role: string | null | undefined,
  effectiveRoles?: string[]
): string {
  const allRoles = effectiveRoles ?? ([role].filter(Boolean) as string[]);

  if (allRoles.some((r) => ['admin', 'super_admin', 'org_admin', 'advisor'].includes(r))) {
    return `${ADMIN_HOST}/dashboard`;
  }
  if (allRoles.some((r) => r === 'staff')) return `${ADMIN_HOST}/staff-portal/dashboard`;
  if (allRoles.some((r) => r === 'instructor')) return `${ADMIN_HOST}/instructor/dashboard`;
  if (allRoles.some((r) => ['test_admin', 'proctor'].includes(r))) return `${ADMIN_HOST}/testing-center`;

  for (const currentRole of allRoles) {
    const mapping = ROLE_MAPPINGS.find((item) => item.role === currentRole);
    if (mapping) return mapping.dashboardUrl;
  }

  return `${LMS_HOST}/lms/dashboard`;
}

export function getPortalKeyForRole(
  role: string | null | undefined,
  effectiveRoles?: string[]
): string {
  const allRoles = effectiveRoles ?? ([role].filter(Boolean) as string[]);

  if (allRoles.some((r) => ['admin', 'super_admin', 'org_admin', 'advisor', 'test_admin', 'proctor'].includes(r))) return 'admin';
  if (allRoles.some((r) => r === 'staff')) return 'staff';
  if (allRoles.some((r) => r === 'instructor')) return 'instructor';

  for (const currentRole of allRoles) {
    const mapping = ROLE_MAPPINGS.find((item) => item.role === currentRole);
    if (mapping) return mapping.portalKey;
  }
  return 'lms';
}

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) return 'Unknown';
  const mapping = ROLE_MAPPINGS.find((item) => item.role === role);
  return mapping?.label ?? role;
}
