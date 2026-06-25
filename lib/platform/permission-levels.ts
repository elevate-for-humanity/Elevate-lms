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

export const PLATFORM_OWNER_ROLES: UserRole[] = ['admin'];
export const PLATFORM_STAFF_ROLES: UserRole[] = ['admin', 'staff'];
export const ORGANIZATION_ADMIN_ROLES: UserRole[] = ['org_admin'];

/** Capabilities gated to platform operator (admin or admin). */
export const PLATFORM_OPERATOR_CAPABILITIES = [
  'deploy_code',
  'access_devstudio',
  'access_ai_operator',
  'view_northflank_status',
  'view_platform_logs',
  'run_ai_autopilot',
  'provision_workspaces',
  'manage_platform_settings',
] as const;

/** Capabilities for platform staff (admin/staff on owner tenant). */
export const PLATFORM_STAFF_CAPABILITIES = [
  'create_workspaces',
  'manage_subscriptions',
  'access_all_tenants',
  'manage_customer_workspaces',
  'view_billing',
] as const;

export type PlatformOperatorCapability = (typeof PLATFORM_OPERATOR_CAPABILITIES)[number];
export type PlatformStaffCapability = (typeof PLATFORM_STAFF_CAPABILITIES)[number];

export function resolvePermissionLevel(params: {
  profileRole: UserRole | null | undefined;
  isPlatformOwnerTenant: boolean;
  orgRole?: 'org_owner' | 'org_admin' | 'instructor' | 'reviewer' | 'report_viewer' | null;
}): PlatformPermissionLevel {
  const { profileRole, isPlatformOwnerTenant, orgRole } = params;

  // admin and admin get platform_owner level — full Dev Studio/deploy access.
  if (profileRole && PLATFORM_OWNER_ROLES.includes(profileRole)) return 'platform_owner';

  if (isPlatformOwnerTenant && profileRole && PLATFORM_STAFF_ROLES.includes(profileRole)) {
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
