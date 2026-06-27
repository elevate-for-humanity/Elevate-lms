/**
 * Centralized RBAC role matrix.
 *
 * Single source of truth for which roles can perform which actions.
 * Guards, middleware, and UI visibility checks should import from here
 * rather than hardcoding role arrays inline.
 */

export type UserRole =
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
export const ADMIN_ROLES = ['admin', 'staff'] as const;
export const ORG_ADMIN_ROLES = ['org_admin', 'admin', 'staff'] as const;
export const LMS_INSTRUCTOR_ROLES = ['instructor', 'admin'] as const;

// API role sets
export const API_ADMIN_ROLES = ['admin', 'staff'] as const;

// ── Permission sets ─────────────────────────────────────────────────────────────────
export const PERMISSIONS = {
  access_devstudio: ['admin', 'staff'] as string[],
  access_workflows: ['admin', 'staff'] as string[],
  manage_users: ['admin', 'staff'] as string[],
  manage_content: ['admin', 'staff', 'instructor'] as string[],
};

export function hasPermission(userRoles: string[], permission: keyof typeof PERMISSIONS): boolean {
  return userRoles.some((role) => PERMISSIONS[permission].includes(role));
}
