/**
 * Canonical role → portal destination registry.
 *
 * This file is the single source of truth for post-auth role routing.
 * `portal-map.ts` owns application hosts/base paths; this file owns which role
 * belongs to which portal and its canonical destination within that portal.
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

export type PortalHost = 'admin' | 'lms' | 'marketing';

export interface RoleRouteConfig {
  path: string;
  host: PortalHost;
  portalKey: string;
  label: string;
}

/**
 * Includes canonical database roles plus supported historical/secondary role
 * values that can still be present on profiles or effective-role assignments.
 * Aliases resolve to canonical portals; they do not create routes.
 */
export const ROLE_ROUTE_CONFIG: Readonly<Record<string, RoleRouteConfig>> = {
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

  creator: { path: '/creator/products', host: 'marketing', portalKey: 'marketing', label: 'Creator' },
  case_manager: { path: '/case-manager/dashboard', host: 'marketing', portalKey: 'casemanager', label: 'Case Manager' },
  workforce_board: { path: '/workforce-board/dashboard', host: 'marketing', portalKey: 'workforceboard', label: 'Workforce Board' },
  workforce_board_admin: { path: '/workforce-board/dashboard', host: 'marketing', portalKey: 'workforceboard', label: 'Workforce Board Admin' },
  program_holder: { path: '/program-holder/dashboard', host: 'marketing', portalKey: 'programholder', label: 'Program Holder' },
  provider: { path: '/provider/dashboard', host: 'marketing', portalKey: 'provider', label: 'Training Provider' },
  provider_admin: { path: '/provider/dashboard', host: 'marketing', portalKey: 'provider', label: 'Training Provider Admin' },
};

/** Higher index is not implied; this is explicit first-match precedence. */
export const ROLE_ROUTE_PRIORITY: ReadonlyArray<string> = [
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
): string {
  return resolveRoleRoute(role, effectiveRoles).portalKey;
}

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) return 'Unknown';
  return ROLE_ROUTE_CONFIG[role]?.label ?? role;
}
