/**
 * Role-based redirect helpers.
 * Thin wrappers around getRoleDestination() for common post-auth scenarios.
 */

import { getRoleDestination, type UserRole } from '@/lib/auth/role-destinations';

export function getDashboardForRole(role: UserRole | string | null | undefined): string {
  if (!role) return '/lms/dashboard';
  return getRoleDestination(role as UserRole);
}

export function resolvePostLoginDestination(
  validatedRedirect: string | null | undefined,
  role: UserRole | string | null | undefined,
): string {
  if (validatedRedirect) return validatedRedirect;
  return getDashboardForRole(role);
}

export const ADMIN_ROLES: ReadonlyArray<string> = [
  'admin',
  'staff',
  'org_admin',
];

export function isAdminRole(role: string | null | undefined): boolean {
  return ADMIN_ROLES.includes(role ?? '');
}

export const INSTRUCTOR_ROLES: ReadonlyArray<string> = [
  'instructor',
  ...ADMIN_ROLES,
];

export function isInstructorRole(role: string | null | undefined): boolean {
  return INSTRUCTOR_ROLES.includes(role ?? '');
}

export function normalizePostAuthDestination(url: string, defaultRole: string): string {
  let path = url;
  try {
    const parsed = new URL(url);
    path = parsed.pathname + parsed.search;
  } catch {
    // Already a path.
  }
  if (!path.startsWith('/')) path = '/' + path;
  if (path.startsWith('http')) return getDashboardForRole(defaultRole);
  return path;
}
