/**
 * Centralized RBAC role matrix.
 *
 * SINGLE SOURCE OF TRUTH for platform roles, aliases, portal role sets, and
 * permission checks. New guards must import from this module rather than
 * introducing page-local role arrays.
 */

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'staff'
  | 'org_admin'
  | 'instructor'
  | 'case_manager'
  | 'employer'
  | 'sponsor'
  | 'program_holder'
  | 'provider'
  | 'provider_admin'
  | 'partner'
  | 'host_shop'
  | 'host_shop_admin'
  | 'delegate'
  | 'student'
  | 'learner'
  | 'user'
  | 'apprentice'
  | 'barber_apprentice'
  | 'cosmetology_apprentice'
  | 'workforce'
  | 'workforce_partner'
  | 'workforce_board'
  | 'workforce_board_admin'
  | 'test_admin'
  | 'proctor'
  | 'advisor'
  | 'parent'
  | 'grant_client'
  | 'creator';

/** Roles with platform-wide portal override. */
export const PLATFORM_ADMIN_ROLES: UserRole[] = ['super_admin', 'admin'];

/** Roles allowed to operate the Admin application generally. */
export const ADMIN_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'org_admin'];

/** Can access admin API routes. */
export const API_ADMIN_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'org_admin'];

/** Can perform instructor actions. */
export const INSTRUCTOR_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'instructor'];

/** Can access employer portal. */
export const EMPLOYER_ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'staff',
  'employer',
  'sponsor',
  'org_admin',
];

/** Can access staff portal. */
export const STAFF_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'case_manager'];

/** Can access workforce/case-management portals. */
export const WORKFORCE_ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'staff',
  'case_manager',
  'workforce',
  'workforce_partner',
  'workforce_board',
  'workforce_board_admin',
];

/** Can access program-holder portal. */
export const PROGRAM_HOLDER_ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'program_holder',
];

/** Can enter Host Shop routes. Tenant data still requires a partner assignment. */
export const HOST_SHOP_ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'staff',
  'partner',
  'host_shop',
  'host_shop_admin',
  'program_holder',
];

/** Can access apprentice portal. */
export const APPRENTICE_ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'staff',
  'instructor',
  'apprentice',
  'barber_apprentice',
  'cosmetology_apprentice',
];

/** Can operate Testing Center. */
export const TESTING_CENTER_ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'staff',
  'test_admin',
  'proctor',
];

/** Any authenticated role recognized by the platform. */
export const ALL_AUTHENTICATED_ROLES: UserRole[] = [
  'super_admin', 'admin', 'staff', 'org_admin', 'instructor', 'case_manager',
  'employer', 'sponsor', 'program_holder', 'provider', 'provider_admin', 'partner',
  'host_shop', 'host_shop_admin', 'delegate', 'student', 'learner', 'user',
  'apprentice', 'barber_apprentice', 'cosmetology_apprentice', 'workforce',
  'workforce_partner', 'workforce_board', 'workforce_board_admin', 'test_admin',
  'proctor', 'advisor', 'parent', 'grant_client', 'creator',
];

/**
 * Normalize historical/alias roles to the role used by current routing logic.
 * Database values may remain historical during migration; guards should compare
 * normalized values so old role names do not create false 403s.
 */
export function normalizeRole(role: string | null | undefined): string {
  if (!role) return '';
  const normalized = role.trim().toLowerCase();
  const aliases: Record<string, string> = {
    learner: 'student',
    user: 'student',
    barber_apprentice: 'apprentice',
    cosmetology_apprentice: 'apprentice',
    sponsor: 'employer',
    host_shop_admin: 'host_shop',
    workforce_board_admin: 'workforce_board',
    advisor: 'admin',
  };
  return aliases[normalized] ?? normalized;
}

export function normalizeRoles(roles: Array<string | null | undefined>): string[] {
  return Array.from(new Set(roles.map(normalizeRole).filter(Boolean)));
}

export function hasPlatformAdminOverride(roles: Array<string | null | undefined>): boolean {
  const normalized = normalizeRoles(roles);
  return normalized.includes('admin') || normalized.includes('super_admin');
}

export function isInRoleSet(
  role: string | null | undefined,
  roleSet: readonly UserRole[] | readonly string[],
): boolean {
  if (!role) return false;
  const normalizedRole = normalizeRole(role);
  const normalizedSet = roleSet.map((item) => normalizeRole(item));
  return normalizedSet.includes(normalizedRole);
}

export function hasAnyRole(
  effectiveRoles: Array<string | null | undefined>,
  allowedRoles: readonly UserRole[] | readonly string[],
  options: { adminOverride?: boolean } = { adminOverride: true },
): boolean {
  const normalizedEffective = normalizeRoles(effectiveRoles);
  if (
    options.adminOverride !== false &&
    (normalizedEffective.includes('admin') || normalizedEffective.includes('super_admin'))
  ) {
    return true;
  }
  const normalizedAllowed = allowedRoles.map((role) => normalizeRole(role));
  return normalizedEffective.some((role) => normalizedAllowed.includes(role));
}

export const PERMISSIONS = {
  // Identity & access
  impersonate_users: ['super_admin'] as UserRole[],
  manage_roles: ['super_admin'] as UserRole[],
  access_dev_tools: ['super_admin', 'admin'] as UserRole[],
  view_audit_logs: ['super_admin', 'admin'] as UserRole[],

  // Platform administration
  manage_programs: ['super_admin', 'admin'] as UserRole[],
  manage_courses: ['super_admin', 'admin', 'staff'] as UserRole[],
  manage_enrollments: ['super_admin', 'admin', 'staff'] as UserRole[],
  manage_users: ['super_admin', 'admin'] as UserRole[],
  manage_payments: ['super_admin', 'admin'] as UserRole[],
  manage_grants: ['super_admin', 'admin', 'staff', 'case_manager'] as UserRole[],
  manage_platform_settings: ['super_admin', 'admin'] as UserRole[],
  trigger_deployments: ['super_admin', 'admin'] as UserRole[],
  run_bulk_operations: ['super_admin', 'admin'] as UserRole[],

  // Instructor actions
  sign_off_lab_submissions: ['super_admin', 'admin', 'staff', 'instructor'] as UserRole[],
  view_student_progress: ['super_admin', 'admin', 'staff', 'instructor'] as UserRole[],
  manage_lesson_content: ['super_admin', 'admin', 'instructor'] as UserRole[],

  // Employer portal
  view_apprentice_hours: EMPLOYER_ROLES,
  approve_apprentice_hours: ['super_admin', 'admin', 'staff', 'employer', 'sponsor'] as UserRole[],
  post_jobs: ['super_admin', 'admin', 'employer', 'sponsor', 'org_admin'] as UserRole[],

  // Workforce / WIOA
  manage_wioa_cases: WORKFORCE_ROLES,
  authorize_funding: ['super_admin', 'admin', 'staff', 'case_manager'] as UserRole[],

  // Program holder / Host Shop
  manage_partner_shop: HOST_SHOP_ROLES,
  view_apprentice_compliance: HOST_SHOP_ROLES,

  // Testing
  manage_testing_center: TESTING_CENTER_ROLES,

  // Student / learner
  access_lms: ALL_AUTHENTICATED_ROLES,
  submit_application: ALL_AUTHENTICATED_ROLES,
  view_own_certificates: ALL_AUTHENTICATED_ROLES,
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return isInRoleSet(role, PERMISSIONS[permission] as readonly UserRole[]);
}
