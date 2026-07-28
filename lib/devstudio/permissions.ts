import 'server-only';

import { type GuardedUser } from '@/lib/admin/guards';

export type StudioPermission =
  | 'studio.view'
  | 'studio.ai.use'
  | 'studio.courses.manage'
  | 'studio.content.manage'
  | 'studio.media.manage'
  | 'studio.workflows.manage'
  | 'studio.repository.view'
  | 'studio.tasks.manage'
  | 'studio.deployments.manage'
  | 'studio.containers.manage'
  | 'studio.evaluations.manage'
  | 'studio.collaboration.use'
  | 'studio.cfd.manage'
  | 'studio.plugins.manage'
  | 'studio.memory.manage'
  | 'studio.health.view'
  | 'studio.settings.manage';

const ROLE_PERMISSIONS: Record<string, StudioPermission[]> = {
  super_admin: [
    'studio.view',
    'studio.ai.use',
    'studio.courses.manage',
    'studio.content.manage',
    'studio.media.manage',
    'studio.workflows.manage',
    'studio.repository.view',
    'studio.tasks.manage',
    'studio.deployments.manage',
    'studio.containers.manage',
    'studio.evaluations.manage',
    'studio.collaboration.use',
    'studio.cfd.manage',
    'studio.plugins.manage',
    'studio.memory.manage',
    'studio.health.view',
    'studio.settings.manage',
  ],
  admin: [
    'studio.view',
    'studio.ai.use',
    'studio.courses.manage',
    'studio.content.manage',
    'studio.media.manage',
    'studio.workflows.manage',
    'studio.repository.view',
    'studio.tasks.manage',
    'studio.deployments.manage',
    'studio.evaluations.manage',
    'studio.collaboration.use',
    'studio.cfd.manage',
    'studio.plugins.manage',
    'studio.memory.manage',
    'studio.health.view',
  ],
  staff: [
    'studio.view',
    'studio.ai.use',
    'studio.courses.manage',
    'studio.media.manage',
    'studio.deployments.manage',
    'studio.evaluations.manage',
    'studio.collaboration.use',
    'studio.health.view',
  ],
  instructor: [
    'studio.view',
    'studio.ai.use',
    'studio.courses.manage',
    'studio.media.manage',
    'studio.evaluations.manage',
    'studio.health.view',
  ],
  student: [
    'studio.view',
    'studio.ai.use',
    'studio.health.view',
  ],
};

export function getPermissionsForRole(role: string | null): StudioPermission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role.toLowerCase()] ?? [];
}

export function hasPermission(user: GuardedUser, permission: StudioPermission): boolean {
  const permissions = getPermissionsForRole(user.role);
  return permissions.includes(permission);
}

export function requirePermission(
  user: GuardedUser,
  permission: StudioPermission,
): { authorized: true; user: GuardedUser } | { authorized: false; error: Error } {
  if (!user.id) {
    return {
      authorized: false,
      error: new Error('Unauthorized: authentication required'),
    };
  }

  if (!hasPermission(user, permission)) {
    return {
      authorized: false,
      error: new Error(`Forbidden: permission '${permission}' required`),
    };
  }

  return { authorized: true, user };
}

export function filterWorkspacesByPermission(
  workspaces: Array<{ id: string; permission: StudioPermission }>,
  user: GuardedUser,
): Array<{ id: string; permission: StudioPermission }> {
  const permissions = getPermissionsForRole(user.role);
  return workspaces.filter((ws) => permissions.includes(ws.permission));
}
