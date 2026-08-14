/**
 * Canonical role → portal destination registry.
 *
 * portal-map.ts owns application hosts/base paths; this file owns which role
 * belongs to which portal and its canonical destination within that portal.
 */

import {
  ADMIN_HOST,
  LMS_HOST,
  MARKETING_HOST,
  type PortalKey,
} from '@/lib/routing/portal-map';
import type { UserRole } from '@/lib/rbac/role-matrix';

export type { UserRole } from '@/lib/rbac/role-matrix';
export type PortalHost = 'admin' | 'lms' | 'marketing';

export interface RoleRouteConfig {
  path: string;
  host: PortalHost;
  portalKey: PortalKey;
  label: string;
}

export const ROLE_ROUTE_CONFIG: Readonly<Record<string, RoleRouteConfig>> = {
  super_admin: { path: '/dashboard', host: 'admin', portalKey: 'admin', label: 'Super Admin' },
  admin: { path: '/dashboard', host: 'admin', portalKey: 'admin', label: 'Admin' },
  org_admin: { path: '/dashboard', host: 'admin', portalKey: 'admin', label: 'Org Admin' },
  advisor: { path: '/dashboard', host: 'admin', portalKey: 'admin', label: 'Advisor' },
  staff: { path: '/staff-portal/dashboard', host: 'admin', portalKey: 'staff', label: 'Staff' },
  instructor: { path: '/instructor/dashboard', host: 'admin', portalKey: 'instructor', label: 'Instructor' },
  test_admin: { path: '/testing-center', host: 'admin', portalKey: 'testing', label: 'Test Admin' },
  proctor: { path: '/testing-center', host: 'admin', portalKey: 'testing', label: 'Proctor' },

  student: { path: '/lms/dashboard', host: 'lms', portalKey: 'lms', label: 'Student' },
  learner: { path: '/lms/dashboard', host: 'lms', portalKey: 'lms', label: 'Learner' },
  user: { path: '/lms/dashboard', host: 'lms', portalKey: 'lms', label: 'User' },
  delegate: { path: '/lms/dashboard', host: 'lms', portalKey: 'lms', label: 'Delegate' },
  grant_client: { path: '/lms/dashboard', host: 'lms', portalKey: 'lms', label: 'Grant Client' },

  apprentice: { path: '/apprentice', host: 'lms', portalKey: 'apprentice', label: 'Apprentice' },
  barber_apprentice: { path: '/apprentice', host: 'lms', portalKey: 'apprentice', label: 'Barber Apprentice' },
  cosmetology_apprentice: { path: '/apprentice', host: 'lms', portalKey: 'apprentice', label: 'Cosmetology Apprentice' },

  sponsor: { path: '/employer/dashboard', host: 'lms', portalKey: 'employer', label: 'Sponsor' },
  employer: { path: '/employer/dashboard', host: 'lms', portalKey: 'employer', label: 'Employer' },
  recruiter: { path: '/employer/dashboard', host: 'lms', portalKey: 'employer', label: 'Recruiter' },

  partner: { path: '/host-shop/dashboard', host: 'lms', portalKey: 'hostshop', label: 'Host Shop Partner' },
  host_shop: { path: '/host-shop/dashboard', host: 'lms', portalKey: 'hostshop', label: 'Host Shop' },
  host_shop_admin: { path: '/host-shop/dashboard', host: 'lms', portalKey: 'hostshop', label: 'Host Shop Admin' },

  workforce_partner: { path: '/workforce/dashboard', host: 'lms', portalKey: 'workforce', label: 'Workforce Partner' },
  parent: { path: '/parent-portal/dashboard', host: 'lms', portalKey: 'parent', label: 'Parent' },
  creator: { path: '/creator/products', host: 'lms', portalKey: 'creator', label: 'Creator' },
  program_holder: { path: '/program-holder/dashboard', host: 'lms', portalKey: 'programholder', label: 'Program Holder' },

  case_manager: { path: '/case-manager/dashboard', host: 'marketing', portalKey: 'casemanager', label: 'Case Manager' },
  workforce_board: { path: '/workforce-board/dashboard', host: 'marketing', portalKey: 'workforceboard', label: 'Workforce Board' },
  workforce_board_admin: { path: '/workforce-board/dashboard', host: 'marketing', portalKey: 'workforceboard', label: 'Workforce Board Admin' },
  provider: { path: '/provider/dashboard', host: 'marketing', portalKey: 'provider', label: 'Training Provider' },
  provider_admin: { path: '/provider/dashboard', host: 'marketing', portalKey: 'provider', label: 'Training Provider Admin' },
};

export const ROLE_ROUTE_PRIORITY: ReadonlyArray<UserRole | string> = [
  'super_admin',
  'admin',
  'org_admin',
  'advisor',
  'staff',
  'instructor',
  'test_admin',
  'proctor',
];

export const ROLE_DESTINATIONS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(ROLE_ROUTE_CONFIG).map(([role, config]) => [role, config.path]),
);

function hostFor(config: RoleRouteConfig): string {
  if (config.host === 'admin') return ADMIN_HOST;
  if (config.host === 'marketing') return MARKETING_HOST;
  return LMS_HOST;
}

export function resolveRoleRoute(
  role: string | null | undefined,
  effectiveRoles?: string[],
): RoleRouteConfig {
  const roles = (effectiveRoles?.length ? effectiveRoles : [role]).filter(Boolean) as string[];

  for (const priorityRole of ROLE_ROUTE_PRIORITY) {
    if (roles.includes(priorityRole)) return ROLE_ROUTE_CONFIG[priorityRole];
  }

  for (const currentRole of roles) {
    const config = ROLE_ROUTE_CONFIG[currentRole];
    if (config) return config;
  }

  return ROLE_ROUTE_CONFIG.student;
}

export function getRoleDestination(role: string | null | undefined): string {
  return resolveRoleRoute(role).path;
}

export function getRoleDestinationUrl(
  role: string | null | undefined,
  effectiveRoles?: string[],
): string {
  const config = resolveRoleRoute(role, effectiveRoles);
  return `${hostFor(config)}${config.path}`;
}

export function getRolePortalKey(
  role: string | null | undefined,
  effectiveRoles?: string[],
): PortalKey {
  return resolveRoleRoute(role, effectiveRoles).portalKey;
}

export function getRolesForPortal(portalKey: PortalKey): string[] {
  return Object.entries(ROLE_ROUTE_CONFIG)
    .filter(([, config]) => config.portalKey === portalKey)
    .map(([role]) => role);
}

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) return 'Unknown';
  return ROLE_ROUTE_CONFIG[role]?.label ?? role;
}
