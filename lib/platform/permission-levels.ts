/**
 * Four permission levels for the Elevate platform.
 *
 * @see docs/platform-owner-tenant-model.md
 */

import type { UserRole } from '@/lib/rbac/role-matrix';

export type PlatformPermissionLevel =
  | 'platform_owner'
  | 'platform_admin'
  | 'organization_admin'
  | 'standard_user';

export const PLATFORM_OWNER_ROLES: UserRole[] = ['super_admin'];
export const PLATFORM_STAFF_ROLES: UserRole[] = ['super_admin', 'admin', 'staff'];
export const ORGANIZATION_ADMIN_ROLES: UserRole[] = ['org_admin'];

export function resolvePermissionLevel(params: {
  profileRole: UserRole | null | undefined;
  isPlatformOwnerTenant: boolean;
  orgRole?: 'org_owner' | 'org_admin' | 'instructor' | 'reviewer' | 'report_viewer' | null;
}): PlatformPermissionLevel {
  const { profileRole, isPlatformOwnerTenant, orgRole } = params;

  if (isPlatformOwnerTenant && profileRole && PLATFORM_STAFF_ROLES.includes(profileRole)) {
    if (profileRole === 'super_admin') return 'platform_owner';
    return 'platform_admin';
  }

  if (
    profileRole === 'org_admin' ||
    orgRole === 'org_admin' ||
    orgRole === 'org_owner'
  ) {
    return 'organization_admin';
  }

  return 'standard_user';
}

export function canAccessDevStudio(level: PlatformPermissionLevel): boolean {
  return level === 'platform_owner';
}

export function canProvisionWorkspaces(level: PlatformPermissionLevel): boolean {
  return level === 'platform_owner' || level === 'platform_admin';
}

export function canDeployCode(level: PlatformPermissionLevel): boolean {
  return level === 'platform_owner';
}
