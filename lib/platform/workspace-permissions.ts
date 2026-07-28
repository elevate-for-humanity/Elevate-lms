/**
 * Workspace Permissions for Elevate OS
 * 
 * Fine-grained permissions for Dev Studio workspaces and features.
 * Extends the existing role-based permission system.
 */

import type { UserRole } from '@/lib/rbac/role-matrix';
import type { PlatformPermissionLevel } from './permission-levels';

// ============================================
// PERMISSION CONSTANTS
// ============================================

/** All available workspace permissions */
export const WORKSPACE_PERMISSIONS = [
  'studio.view',
  'ai.use',
  'courses.manage',
  'content.generate',
  'media.manage',
  'deployments.manage',
  'containers.manage',
  'evaluations.manage',
  'simulations.manage',
  'studio.settings',
] as const;

export type WorkspacePermission = (typeof WORKSPACE_PERMISSIONS)[number];

// ============================================
// PERMISSION HIERARCHY
// ============================================

/**
 * Maps platform roles to workspace permissions
 */
export const ROLE_PERMISSION_MAP: Record<UserRole, WorkspacePermission[]> = {
  admin: [
    'studio.view',
    'ai.use',
    'courses.manage',
    'content.generate',
    'media.manage',
    'deployments.manage',
    'containers.manage',
    'evaluations.manage',
    'simulations.manage',
    'studio.settings',
  ],
  staff: [
    'studio.view',
    'ai.use',
    'courses.manage',
    'content.generate',
    'media.manage',
    'deployments.manage',
    'containers.manage',
  ],
  instructor: [
    'studio.view',
    'ai.use',
    'courses.manage',
    'content.generate',
  ],
  student: [
    'studio.view',
    'ai.use',
  ],
  applicant: [],
  guest: [],
};

/**
 * Maps platform permission levels to workspace permissions
 */
export const LEVEL_PERMISSION_MAP: Record<PlatformPermissionLevel, WorkspacePermission[]> = {
  platform_owner: WORKSPACE_PERMISSIONS,
  platform_admin: [
    'studio.view',
    'ai.use',
    'courses.manage',
    'content.generate',
    'media.manage',
    'deployments.manage',
    'containers.manage',
  ],
  organization_admin: [
    'studio.view',
    'ai.use',
    'courses.manage',
    'content.generate',
    'media.manage',
  ],
  standard_user: [
    'studio.view',
    'ai.use',
  ],
};

// ============================================
// AUTHORIZATION
// ============================================

export interface AuthorizedActor {
  userId: string;
  organizationId: string;
  role: UserRole;
  permissionLevel: PlatformPermissionLevel;
  permissions: WorkspacePermission[];
}

/**
 * Check if actor has a specific permission
 */
export function hasWorkspacePermission(
  actor: AuthorizedActor,
  permission: WorkspacePermission,
): boolean {
  return actor.permissions.includes(permission);
}

/**
 * Check if actor has any of the given permissions
 */
export function hasAnyWorkspacePermission(
  actor: AuthorizedActor,
  permissions: WorkspacePermission[],
): boolean {
  return permissions.some(p => actor.permissions.includes(p));
}

/**
 * Check if actor has all of the given permissions
 */
export function hasAllWorkspacePermissions(
  actor: AuthorizedActor,
  permissions: WorkspacePermission[],
): boolean {
  return permissions.every(p => actor.permissions.includes(p));
}

/**
 * Get permissions for a user role
 */
export function getPermissionsForRole(role: UserRole): WorkspacePermission[] {
  return ROLE_PERMISSION_MAP[role] || [];
}

/**
 * Get permissions for a platform permission level
 */
export function getPermissionsForLevel(level: PlatformPermissionLevel): WorkspacePermission[] {
  return LEVEL_PERMISSION_MAP[level] || [];
}

/**
 * Create authorized actor from user data
 */
export function createAuthorizedActor(params: {
  userId: string;
  organizationId: string;
  role: UserRole;
  permissionLevel: PlatformPermissionLevel;
}): AuthorizedActor {
  const permissions = getPermissionsForLevel(params.permissionLevel);
  
  return {
    ...params,
    permissions,
  };
}

// ============================================
// ERROR TYPES
// ============================================

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'You do not have permission to perform this action') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends Error {
  details?: Record<string, unknown>;
  
  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

// ============================================
// PERMISSION REQUIREMENTS FOR WORKSPACES
// ============================================

/**
 * Permission requirements for each workspace
 */
export const WORKSPACE_PERMISSION_REQUIREMENTS: Record<string, WorkspacePermission[]> = {
  'overview': [],
  'ai-chat': ['ai.use'],
  'course-builder': ['courses.manage'],
  'content-studio': ['content.generate'],
  'media-library': ['media.manage'],
  'development': [],
  'deployments': ['deployments.manage'],
  'containers': ['containers.manage'],
  'evaluations': ['evaluations.manage'],
  'cfd-simulation': ['simulations.manage'],
  'settings': ['studio.settings'],
  'audit-log': [],
  'workflows': [],
  'agents': ['ai.use'],
  'tasks': ['ai.use'],
  'memory': ['ai.use'],
};

/**
 * Check if actor can access a workspace
 */
export function canAccessWorkspace(
  actor: AuthorizedActor,
  workspaceId: string,
): boolean {
  const requiredPermissions = WORKSPACE_PERMISSION_REQUIREMENTS[workspaceId] || [];
  
  if (requiredPermissions.length === 0) return true;
  
  return hasAnyWorkspacePermission(actor, requiredPermissions);
}
