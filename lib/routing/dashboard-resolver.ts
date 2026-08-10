/**
 * lib/routing/dashboard-resolver.ts
 *
 * SINGLE SOURCE OF TRUTH for role → dashboard URL resolution.
 * Every login and post-auth redirect should call resolveDashboardUrl().
 */

import { MARKETING_HOST, ADMIN_HOST, LMS_HOST } from './portal-map';
import { normalizeRole, normalizeRoles } from '@/lib/rbac/role-matrix';

interface RoleMapping {
  role: string;
  label: string;
  dashboardUrl: string;
  portalKey: string;
}

const ROLE_MAPPINGS: RoleMapping[] = [
  { role: 'student', label: 'Student', dashboardUrl: `${LMS_HOST}/lms/dashboard`, portalKey: 'lms' },

  { role: 'super_admin', label: 'Super Admin', dashboardUrl: `${ADMIN_HOST}/dashboard`, portalKey: 'admin' },
  { role: 'admin', label: 'Admin', dashboardUrl: `${ADMIN_HOST}/dashboard`, portalKey: 'admin' },
  { role: 'org_admin', label: 'Org Admin', dashboardUrl: `${ADMIN_HOST}/dashboard`, portalKey: 'admin' },
  { role: 'staff', label: 'Staff', dashboardUrl: `${ADMIN_HOST}/staff-portal/dashboard`, portalKey: 'staff' },
  { role: 'instructor', label: 'Instructor', dashboardUrl: `${ADMIN_HOST}/instructor/dashboard`, portalKey: 'instructor' },

  { role: 'employer', label: 'Employer', dashboardUrl: `${LMS_HOST}/employer/dashboard`, portalKey: 'employer' },
  { role: 'recruiter', label: 'Recruiter', dashboardUrl: `${LMS_HOST}/employer/dashboard`, portalKey: 'employer' },

  { role: 'apprentice', label: 'Apprentice', dashboardUrl: `${LMS_HOST}/apprentice`, portalKey: 'apprentice' },

  { role: 'host_shop', label: 'Host Shop', dashboardUrl: `${LMS_HOST}/host-shop/dashboard`, portalKey: 'hostshop' },
  { role: 'partner', label: 'Host Shop Partner', dashboardUrl: `${LMS_HOST}/host-shop/dashboard`, portalKey: 'hostshop' },

  { role: 'workforce', label: 'Workforce', dashboardUrl: `${LMS_HOST}/workforce/dashboard`, portalKey: 'workforce' },
  { role: 'workforce_partner', label: 'Workforce Partner', dashboardUrl: `${LMS_HOST}/workforce/dashboard`, portalKey: 'workforce' },
  { role: 'program_holder', label: 'Program Holder', dashboardUrl: `${MARKETING_HOST}/program-holder/dashboard`, portalKey: 'programholder' },
  { role: 'provider', label: 'Training Provider', dashboardUrl: `${MARKETING_HOST}/provider/dashboard`, portalKey: 'provider' },
  { role: 'provider_admin', label: 'Training Provider Admin', dashboardUrl: `${MARKETING_HOST}/provider/dashboard`, portalKey: 'provider' },
  { role: 'case_manager', label: 'Case Manager', dashboardUrl: `${MARKETING_HOST}/case-manager/dashboard`, portalKey: 'casemanager' },
  { role: 'workforce_board', label: 'Workforce Board', dashboardUrl: `${MARKETING_HOST}/workforce-board/dashboard`, portalKey: 'workforceboard' },

  { role: 'parent', label: 'Parent', dashboardUrl: `${LMS_HOST}/parent-portal/dashboard`, portalKey: 'parent' },
  { role: 'test_admin', label: 'Test Admin', dashboardUrl: `${ADMIN_HOST}/testing-center`, portalKey: 'testing' },
  { role: 'proctor', label: 'Proctor', dashboardUrl: `${ADMIN_HOST}/testing-center`, portalKey: 'testing' },
];

function resolvedRoles(role: string | null | undefined, effectiveRoles?: string[]): string[] {
  return normalizeRoles(effectiveRoles?.length ? effectiveRoles : [role]);
}

export function resolveDashboardUrl(
  role: string | null | undefined,
  effectiveRoles?: string[],
): string {
  const allRoles = resolvedRoles(role, effectiveRoles);

  // Platform-wide administrative identities always land in Admin.
  if (allRoles.some((current) => ['super_admin', 'admin', 'org_admin'].includes(current))) {
    return `${ADMIN_HOST}/dashboard`;
  }
  if (allRoles.includes('staff')) return `${ADMIN_HOST}/staff-portal/dashboard`;
  if (allRoles.includes('instructor')) return `${ADMIN_HOST}/instructor/dashboard`;
  if (allRoles.some((current) => ['test_admin', 'proctor'].includes(current))) {
    return `${ADMIN_HOST}/testing-center`;
  }

  for (const currentRole of allRoles) {
    const mapping = ROLE_MAPPINGS.find((item) => item.role === currentRole);
    if (mapping) return mapping.dashboardUrl;
  }

  return `${LMS_HOST}/lms/dashboard`;
}

export function getPortalKeyForRole(
  role: string | null | undefined,
  effectiveRoles?: string[],
): string {
  const allRoles = resolvedRoles(role, effectiveRoles);

  if (allRoles.some((current) => ['super_admin', 'admin', 'org_admin'].includes(current))) {
    return 'admin';
  }
  if (allRoles.includes('staff')) return 'staff';
  if (allRoles.includes('instructor')) return 'instructor';
  if (allRoles.some((current) => ['test_admin', 'proctor'].includes(current))) return 'testing';

  for (const currentRole of allRoles) {
    const mapping = ROLE_MAPPINGS.find((item) => item.role === currentRole);
    if (mapping) return mapping.portalKey;
  }
  return 'lms';
}

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) return 'Unknown';
  const normalized = normalizeRole(role);
  const mapping = ROLE_MAPPINGS.find((item) => item.role === normalized);
  return mapping?.label ?? role;
}
