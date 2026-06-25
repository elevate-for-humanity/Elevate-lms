/**
 * Role-based redirect helpers.
 *
 * Thin wrappers around getRoleDestination() for common post-auth redirect
 * scenarios. Import these instead of hardcoding paths at call sites.
 *
 * All paths are validated — never pass raw user input directly to redirect().
 */

import { getRoleDestination, type UserRole } from '@/lib/auth/role-destinations';

/**
 * Returns the canonical dashboard path for a given role.
 * Falls back to /learner/dashboard for unknown roles.
 */
export function getDashboardForRole(role: UserRole | string | null | undefined): string {
  if (!role) return '/learner/dashboard';
  return getRoleDestination(role as UserRole);
}

/**
 * Returns the post-login destination, preferring an explicit redirect param
 * over the role default. The redirect param must already be validated via
 * lib/auth/validate-redirect before being passed here.
 */
export function normalizePostAuthDestination(
  validatedRedirect: string | null | undefined,
  role: UserRole | string | null | undefined,
): string {
  const roleDestination = getDashboardForRole(role);
  const destination = validatedRedirect || roleDestination;

  if (
    destination === '/dashboard' ||
    destination === '/dashboards' ||
    destination === '/my-dashboard'
  ) {
    return roleDestination;
  }

  if (destination === '/lms/dashboard') {
    return '/lms/courses';
  }

  if (destination === '/portal/apprentice') {
    return '/learner/dashboard';
  }

  return destination;
}

export function resolvePostLoginDestination(
  validatedRedirect: string | null | undefined,
  role: UserRole | string | null | undefined,
): string {
  return normalizePostAuthDestination(validatedRedirect, role);
}

/**
 * Admin roles that can access the admin portal.
 */
export const ADMIN_ROLES: ReadonlyArray<string> = [
  'admin',
  'staff',
  'org_admin',
];

export function isAdminRole(role: string | null | undefined): boolean {
  return ADMIN_ROLES.includes(role ?? '');
}

/**
 * Instructor-level roles (can access instructor portal + admin portal).
 */
export const INSTRUCTOR_ROLES: ReadonlyArray<string> = [
  'instructor',
  ...ADMIN_ROLES,
];

export function isInstructorRole(role: string | null | undefined): boolean {
  return INSTRUCTOR_ROLES.includes(role ?? '');
}
