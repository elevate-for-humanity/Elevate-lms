// =====================================================
// ROLE-BASED ACCESS CONTROL (RBAC) GUARDS
// =====================================================

import { Session } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';

export type UserRole =
  | 'student'
  | 'advisor'
  | 'admin'
  | 'super_admin'
  | 'partner'
  | 'program_holder'
  | 'employer'
  | 'workforce_board';

/**
 * Require specific role(s) for access
 * Throws error if user doesn't have required role
 */
export function requireRole(session: Session, allowedRoles: UserRole[]) {
  const userRole = session.user.user_metadata?.role as UserRole;

  if (!userRole || !allowedRoles.includes(userRole)) {
    logger.warn('Forbidden access attempt', {
      userId: session.user.id,
      userRole,
      requiredRoles: allowedRoles,
    });
    redirect('/unauthorized');
  }

  return userRole;
}

/**
 * Check if user has role without throwing
 */
export function hasRole(session: Session, allowedRoles: UserRole[]): boolean {
  const userRole = session.user.user_metadata?.role as UserRole;
  return userRole && allowedRoles.includes(userRole);
}

/**
 * API route role guard
 * Returns 403 if user doesn't have required role
 */
export function requireRoleAPI(session: Session, allowedRoles: UserRole[]) {
  const userRole = session.user.user_metadata?.role as UserRole;

  if (!userRole || !allowedRoles.includes(userRole)) {
    logger.warn('Forbidden API access attempt', {
      userId: session.user.id,
      userRole,
      requiredRoles: allowedRoles,
    });

    return Response.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
  }

  return userRole;
}

/**
 * Role hierarchy check
 * Admin roles can access lower-level resources
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 1,
  partner: 2,
  program_holder: 2,
  employer: 2,
  workforce_board: 3,
  advisor: 4,
  admin: 5,
  super_admin: 6,
};

export function hasRoleOrHigher(session: Session, minimumRole: UserRole): boolean {
  const userRole = session.user.user_metadata?.role as UserRole;

  if (!userRole) return false;

  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Check if user can access resource
 * Combines auth + role check
 */
export async function canAccess(
  session: Session | null,
  allowedRoles: UserRole[],
): Promise<boolean> {
  if (!session) return false;
  return hasRole(session, allowedRoles);
}

/**
 * Get user's effective permissions
 */
export function getUserPermissions(session: Session): {
  role: UserRole;
  canViewAdmin: boolean;
  canEditPrograms: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canApproveApplications: boolean;
} {
  const role = session.user.user_metadata?.role as UserRole;

  return {
    role,
    canViewAdmin: hasRoleOrHigher(session, 'advisor'),
    canEditPrograms: hasRoleOrHigher(session, 'admin'),
    canManageUsers: hasRoleOrHigher(session, 'admin'),
    canViewReports: hasRoleOrHigher(session, 'advisor'),
    canApproveApplications: hasRoleOrHigher(session, 'advisor'),
  };
}
