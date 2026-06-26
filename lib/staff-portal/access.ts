import { requireRole, type AuthResult } from '@/lib/auth/require-role';

/** Roles allowed to access staff-portal UI and student PII loaders/APIs. */
export const STAFF_PORTAL_ROLES = [
  'staff',
  'admin',
  'admin',
  'admin',
  'org_admin',
  'advisor',
] as const;

export type StaffPortalRole = (typeof STAFF_PORTAL_ROLES)[number];

/**
 * Server-only gate for staff portal pages and case-file loaders.
 * Redirects unauthenticated users to login and wrong roles to /unauthorized.
 */
export async function requireStaffPortalAccess(): Promise<AuthResult> {
  return requireRole([...STAFF_PORTAL_ROLES]);
}

/** Roles that may list all portal accounts (not only learners). */
export const STAFF_PORTAL_USER_ADMIN_ROLES = ['admin', 'admin', 'org_admin'] as const;

export function canManageStaffPortalUsers(role: string): boolean {
  return (STAFF_PORTAL_USER_ADMIN_ROLES as readonly string[]).includes(role);
}
