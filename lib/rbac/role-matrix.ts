/**
 * Centralized RBAC role matrix.
 *
 * Single source of truth for which roles can perform which actions.
 * Guards, middleware, and UI visibility checks should import from here
 * rather than hardcoding role arrays inline.
 *
 * Roles (from lib/admin/guards.ts UserRole):
 *   super_admin    — full platform access, can impersonate, manage all settings
 *   admin          — platform admin, cannot impersonate or access dev tools
 *   staff          — case managers, enrollment staff, limited admin access
 *   org_admin      — organization-level admin (employer orgs, partner orgs)
 *   instructor     — course delivery, lesson sign-offs, student progress
 *   case_manager   — WIOA/workforce case management
 *   employer       — employer portal access, apprentice tracking
 *   program_holder — partner salon/barbershop, apprentice oversight
 *   provider_admin — training provider admin
 *   partner        — partner organization access
 *   delegate       — delegated access (limited, time-bound)
 *   student        — learner, default authenticated role
 */

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'staff'
  | 'org_admin'
  | 'instructor'
  | 'case_manager'
  | 'employer'
  | 'program_holder'
  | 'provider_admin'
  | 'partner'
  | 'delegate'
  | 'student';

// ── Role sets ─────────────────────────────────────────────────────────────────
// Named sets used by guards. Import these instead of writing inline arrays.

/** Can access /admin/* routes */
export const ADMIN_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'org_admin'];

/** Can access admin API routes (apiRequireAdmin) */
export const API_ADMIN_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'org_admin'];

/** Can perform instructor actions (sign-offs, lesson management) */
export const INSTRUCTOR_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'instructor'];

/** Can access employer portal */
export const EMPLOYER_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'employer', 'org_admin'];

/** Can access staff portal */
export const STAFF_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'case_manager'];

/** Can access workforce board / WIOA case management */
export const WORKFORCE_ROLES: UserRole[] = ['super_admin', 'admin', 'staff', 'case_manager'];

/** Can access program holder portal */
export const PROGRAM_HOLDER_ROLES: UserRole[] = ['super_admin', 'admin', 'program_holder'];

/** Any authenticated user (all roles) */
export const ALL_AUTHENTICATED_ROLES: UserRole[] = [
  'super_admin', 'admin', 'staff', 'org_admin', 'instructor',
  'case_manager', 'employer', 'program_holder', 'provider_admin',
  'partner', 'delegate', 'student',
];

// ── Permission map ────────────────────────────────────────────────────────────
// Declarative map of capability → allowed roles.
// Use hasPermission() to check a specific capability.

export const PERMISSIONS = {
  // Identity & access
  impersonate_users:          ['super_admin'] as UserRole[],
  manage_roles:               ['super_admin'] as UserRole[],
  access_dev_tools:           ['super_admin'] as UserRole[],
  view_audit_logs:            ['super_admin', 'admin'] as UserRole[],

  // Platform administration
  manage_programs:            ['super_admin', 'admin'] as UserRole[],
  manage_courses:             ['super_admin', 'admin', 'staff'] as UserRole[],
  manage_enrollments:         ['super_admin', 'admin', 'staff'] as UserRole[],
  manage_users:               ['super_admin', 'admin'] as UserRole[],
  manage_payments:            ['super_admin', 'admin'] as UserRole[],
  manage_grants:              ['super_admin', 'admin', 'staff', 'case_manager'] as UserRole[],
  manage_platform_settings:   ['super_admin'] as UserRole[],
  trigger_deployments:        ['super_admin'] as UserRole[],
  run_bulk_operations:        ['super_admin', 'admin'] as UserRole[],

  // Instructor actions
  sign_off_lab_submissions:   ['super_admin', 'admin', 'staff', 'instructor'] as UserRole[],
  view_student_progress:      ['super_admin', 'admin', 'staff', 'instructor'] as UserRole[],
  manage_lesson_content:      ['super_admin', 'admin', 'instructor'] as UserRole[],

  // Employer portal
  view_apprentice_hours:      ['super_admin', 'admin', 'staff', 'employer', 'org_admin'] as UserRole[],
  approve_apprentice_hours:   ['super_admin', 'admin', 'staff', 'employer'] as UserRole[],
  post_jobs:                  ['super_admin', 'admin', 'employer', 'org_admin'] as UserRole[],

  // Workforce / WIOA
  manage_wioa_cases:          ['super_admin', 'admin', 'staff', 'case_manager'] as UserRole[],
  authorize_funding:          ['super_admin', 'admin', 'staff', 'case_manager'] as UserRole[],

  // Program holder
  manage_partner_shop:        ['super_admin', 'admin', 'program_holder'] as UserRole[],
  view_apprentice_compliance: ['super_admin', 'admin', 'staff', 'program_holder'] as UserRole[],

  // Student / learner
  access_lms:                 ALL_AUTHENTICATED_ROLES,
  submit_application:         ALL_AUTHENTICATED_ROLES,
  view_own_certificates:      ALL_AUTHENTICATED_ROLES,
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Check if a role has a specific permission.
 *
 * @example
 * if (!hasPermission(user.role, 'impersonate_users')) redirect('/unauthorized');
 */
export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as UserRole[]).includes(role);
}

/**
 * Check if a role is in a named role set.
 *
 * @example
 * if (!isInRoleSet(user.role, ADMIN_ROLES)) return forbidden();
 */
export function isInRoleSet(role: UserRole | null | undefined, roleSet: UserRole[]): boolean {
  if (!role) return false;
  return roleSet.includes(role);
}
