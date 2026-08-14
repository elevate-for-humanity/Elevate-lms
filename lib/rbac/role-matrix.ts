/**
 * Canonical RBAC role matrix.
 *
 * This is the single authorization taxonomy consumed by page guards,
 * middleware, API guards, and portal access helpers. Historical role aliases
 * that still exist in production are recognized here so routing and
 * authorization cannot disagree about whether a role exists.
 */

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'org_admin'
  | 'advisor'
  | 'staff'
  | 'instructor'
  | 'test_admin'
  | 'proctor'
  | 'student'
  | 'learner'
  | 'user'
  | 'delegate'
  | 'grant_client'
  | 'apprentice'
  | 'barber_apprentice'
  | 'cosmetology_apprentice'
  | 'sponsor'
  | 'employer'
  | 'recruiter'
  | 'partner'
  | 'host_shop'
  | 'host_shop_admin'
  | 'workforce_partner'
  | 'parent'
  | 'creator'
  | 'case_manager'
  | 'workforce_board'
  | 'workforce_board_admin'
  | 'program_holder'
  | 'provider'
  | 'provider_admin';

const ROLE_ALIASES: Record<string, UserRole> = {
  superadmin: 'super_admin',
  'super-admin': 'super_admin',
  orgadmin: 'org_admin',
  'org-admin': 'org_admin',
  testadmin: 'test_admin',
  'test-admin': 'test_admin',
  hostshop: 'host_shop',
  'host-shop': 'host_shop',
  hostshopadmin: 'host_shop_admin',
  'host-shop-admin': 'host_shop_admin',
  workforce: 'workforce_partner',
  workforcepartner: 'workforce_partner',
  'workforce-partner': 'workforce_partner',
  programholder: 'program_holder',
  'program-holder': 'program_holder',
  provideradmin: 'provider_admin',
  'provider-admin': 'provider_admin',
  workforceboard: 'workforce_board',
  'workforce-board': 'workforce_board',
  workforceboardadmin: 'workforce_board_admin',
  'workforce-board-admin': 'workforce_board_admin',
};

const CANONICAL_ROLES = new Set<UserRole>([
  'super_admin', 'admin', 'org_admin', 'advisor', 'staff', 'instructor',
  'test_admin', 'proctor', 'student', 'learner', 'user', 'delegate',
  'grant_client', 'apprentice', 'barber_apprentice', 'cosmetology_apprentice',
  'sponsor', 'employer', 'recruiter', 'partner', 'host_shop', 'host_shop_admin',
  'workforce_partner', 'parent', 'creator', 'case_manager', 'workforce_board',
  'workforce_board_admin', 'program_holder', 'provider', 'provider_admin',
]);

export function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
  if (!normalized) return null;
  if (CANONICAL_ROLES.has(normalized as UserRole)) return normalized as UserRole;
  return ROLE_ALIASES[normalized] ?? null;
}

export function normalizeRoles(values: unknown[]): UserRole[] {
  return Array.from(
    new Set(values.map(normalizeRole).filter((role): role is UserRole => role !== null)),
  );
}

export const ADMIN_ROLES: UserRole[] = ['super_admin', 'admin', 'org_admin', 'advisor', 'staff'];
export const API_ADMIN_ROLES: UserRole[] = ['super_admin', 'admin', 'org_admin', 'staff'];
export const INSTRUCTOR_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'instructor'];
export const TESTING_CENTER_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'test_admin', 'proctor'];
export const EMPLOYER_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'employer', 'sponsor', 'recruiter', 'org_admin'];
export const STAFF_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'case_manager'];
export const WORKFORCE_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'case_manager', 'workforce_partner'];
export const PROGRAM_HOLDER_ROLES: UserRole[] = ['super_admin', 'admin', 'program_holder', 'provider_admin'];
export const HOST_SHOP_ROLES: UserRole[] = ['super_admin', 'admin', 'partner', 'host_shop', 'host_shop_admin', 'program_holder'];
export const APPRENTICE_ROLES: UserRole[] = ['super_admin', 'admin', 'student', 'learner', 'apprentice', 'barber_apprentice', 'cosmetology_apprentice'];

export const ALL_AUTHENTICATED_ROLES: UserRole[] = Array.from(CANONICAL_ROLES);

export function hasAnyRole(
  effectiveRoles: readonly (UserRole | string)[],
  allowedRoles: readonly (UserRole | string)[],
  options: { adminOverride?: boolean } = { adminOverride: true },
): boolean {
  const effective = normalizeRoles([...effectiveRoles]);
  const allowed = normalizeRoles([...allowedRoles]);
  if (!allowed.length) return effective.length > 0;
  if (effective.some((role) => allowed.includes(role))) return true;

  if (options.adminOverride !== false) {
    const superAdminOnly = allowed.length === 1 && allowed[0] === 'super_admin';
    if (!superAdminOnly && effective.some((role) => role === 'admin' || role === 'super_admin')) {
      return true;
    }
  }
  return false;
}

export const PERMISSIONS = {
  // Elevate's production operating model uses the regular admin role as the
  // highest active administrator. Keep super_admin as a legacy-compatible alias
  // but never make a production capability depend on a role that is not used.
  impersonate_users: ['admin', 'super_admin'] as UserRole[],
  manage_roles: ['admin', 'super_admin'] as UserRole[],
  access_dev_tools: ['admin', 'super_admin'] as UserRole[],
  view_audit_logs: ['super_admin', 'admin'] as UserRole[],
  manage_programs: ['super_admin', 'admin'] as UserRole[],
  manage_courses: ['super_admin', 'admin', 'staff'] as UserRole[],
  manage_enrollments: ['super_admin', 'admin', 'staff'] as UserRole[],
  manage_users: ['super_admin', 'admin'] as UserRole[],
  manage_payments: ['super_admin', 'admin'] as UserRole[],
  manage_grants: ['super_admin', 'admin', 'staff', 'case_manager'] as UserRole[],
  manage_platform_settings: ['admin', 'super_admin'] as UserRole[],
  trigger_deployments: ['admin', 'super_admin'] as UserRole[],
  run_bulk_operations: ['super_admin', 'admin'] as UserRole[],
  sign_off_lab_submissions: ['super_admin', 'admin', 'staff', 'instructor'] as UserRole[],
  view_student_progress: ['super_admin', 'admin', 'staff', 'instructor'] as UserRole[],
  manage_lesson_content: ['super_admin', 'admin', 'instructor'] as UserRole[],
  view_apprentice_hours: EMPLOYER_ROLES,
  approve_apprentice_hours: ['super_admin', 'admin', 'staff', 'employer', 'sponsor'] as UserRole[],
  post_jobs: ['super_admin', 'admin', 'employer', 'sponsor', 'recruiter', 'org_admin'] as UserRole[],
  manage_wioa_cases: WORKFORCE_ROLES,
  authorize_funding: ['super_admin', 'admin', 'staff', 'case_manager'] as UserRole[],
  manage_partner_shop: HOST_SHOP_ROLES,
  view_apprentice_compliance: ['super_admin', 'admin', 'staff', 'partner', 'host_shop', 'host_shop_admin', 'program_holder'] as UserRole[],
  access_lms: ALL_AUTHENTICATED_ROLES,
  submit_application: ALL_AUTHENTICATED_ROLES,
  view_own_certificates: ALL_AUTHENTICATED_ROLES,
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

export function isInRoleSet(role: UserRole | null | undefined, roleSet: readonly UserRole[]): boolean {
  if (!role) return false;
  return roleSet.includes(role);
}
