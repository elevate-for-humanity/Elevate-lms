/**
 * Canonical role → portal assignment registry.
 *
 * Portal paths, hosts and ownership are never duplicated here. This file owns
 * only role-to-portal assignment, role labels and precedence. Route facts are
 * derived from PORTAL_MAP so role routing cannot drift from portal ownership.
 */

import { PORTAL_MAP, type PortalKey } from '@/lib/routing/portal-map';
import type { UserRole } from '@/lib/rbac/role-matrix';

export type { UserRole } from '@/lib/rbac/role-matrix';
export type PortalHost = 'admin' | 'lms' | 'marketing';

export interface RoleRouteConfig {
  path: string;
  host: PortalHost;
  portalKey: PortalKey;
  label: string;
}

type RolePortalAssignment = { portalKey: PortalKey; label: string };

export const ROLE_PORTAL_ASSIGNMENTS: Readonly<Record<string, RolePortalAssignment>> = {
  super_admin: { portalKey: 'admin', label: 'Super Admin' },
  admin: { portalKey: 'admin', label: 'Admin' },
  org_admin: { portalKey: 'admin', label: 'Org Admin' },
  advisor: { portalKey: 'admin', label: 'Advisor' },
  staff: { portalKey: 'staff', label: 'Staff' },
  instructor: { portalKey: 'instructor', label: 'Instructor' },
  test_admin: { portalKey: 'testing', label: 'Test Admin' },
  proctor: { portalKey: 'testing', label: 'Proctor' },

  student: { portalKey: 'lms', label: 'Student' },
  learner: { portalKey: 'lms', label: 'Learner' },
  user: { portalKey: 'lms', label: 'User' },
  delegate: { portalKey: 'lms', label: 'Delegate' },
  grant_client: { portalKey: 'lms', label: 'Grant Client' },

  apprentice: { portalKey: 'apprentice', label: 'Apprentice' },
  barber_apprentice: { portalKey: 'apprentice', label: 'Barber Apprentice' },
  cosmetology_apprentice: { portalKey: 'apprentice', label: 'Cosmetology Apprentice' },

  sponsor: { portalKey: 'employer', label: 'Sponsor' },
  employer: { portalKey: 'employer', label: 'Employer' },
  recruiter: { portalKey: 'employer', label: 'Recruiter' },

  partner: { portalKey: 'hostshop', label: 'Host Shop Partner' },
  host_shop: { portalKey: 'hostshop', label: 'Host Shop' },
  host_shop_admin: { portalKey: 'hostshop', label: 'Host Shop Admin' },

  workforce_partner: { portalKey: 'workforce', label: 'Workforce Partner' },
  parent: { portalKey: 'parent', label: 'Parent' },
  creator: { portalKey: 'creator', label: 'Creator' },
  program_holder: { portalKey: 'programholder', label: 'Program Holder' },

  case_manager: { portalKey: 'casemanager', label: 'Case Manager' },
  workforce_board: { portalKey: 'workforceboard', label: 'Workforce Board' },
  workforce_board_admin: { portalKey: 'workforceboard', label: 'Workforce Board Admin' },
  provider: { portalKey: 'provider', label: 'Training Provider' },
  provider_admin: { portalKey: 'provider', label: 'Training Provider Admin' },
};

function hostKind(portalKey: PortalKey): PortalHost {
  const subdomain = PORTAL_MAP[portalKey].subdomain;
  if (subdomain === 'admin') return 'admin';
  if (subdomain === 'marketing') return 'marketing';
  return 'lms';
}

export const ROLE_ROUTE_CONFIG: Readonly<Record<string, RoleRouteConfig>> = Object.fromEntries(
  Object.entries(ROLE_PORTAL_ASSIGNMENTS).map(([role, assignment]) => {
    const portal = PORTAL_MAP[assignment.portalKey];
    return [role, {
      path: portal.defaultPath,
      host: hostKind(assignment.portalKey),
      portalKey: assignment.portalKey,
      label: assignment.label,
    }];
  }),
);

export const ROLE_ROUTE_PRIORITY: ReadonlyArray<UserRole | string> = [
  'super_admin', 'admin', 'org_admin', 'advisor', 'staff', 'instructor', 'test_admin', 'proctor',
];

export const ROLE_DESTINATIONS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(ROLE_ROUTE_CONFIG).map(([role, config]) => [role, config.path]),
);

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
  const portal = PORTAL_MAP[config.portalKey];
  return `${portal.host}${portal.defaultPath}`;
}

export function getRolePortalKey(
  role: string | null | undefined,
  effectiveRoles?: string[],
): PortalKey {
  return resolveRoleRoute(role, effectiveRoles).portalKey;
}

export function getRolesForPortal(portalKey: PortalKey): string[] {
  return Object.entries(ROLE_PORTAL_ASSIGNMENTS)
    .filter(([, assignment]) => assignment.portalKey === portalKey)
    .map(([role]) => role);
}

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) return 'Unknown';
  return ROLE_PORTAL_ASSIGNMENTS[role]?.label ?? role;
}
