import 'server-only';

// Re-export shared types for server-only usage
export {
  STUDIO_WORKSPACES,
  WORKSPACE_ICONS,
  getWorkspaceById,
  isWorkspaceImplemented,
  getImplementedWorkspaces,
  type StudioWorkspaceId,
  type StudioWorkspaceDefinition,
} from './workspace-registry.shared';

import {
  type StudioWorkspaceId,
  type StudioWorkspaceDefinition,
} from './workspace-registry.shared';

export function isWorkspaceAvailable(
  workspace: StudioWorkspaceDefinition,
  isSuperAdmin: boolean,
): boolean {
  if (workspace.superAdminOnly && !isSuperAdmin) {
    return false;
  }
  if (workspace.featureFlag) {
    return process.env[workspace.featureFlag] === 'true';
  }
  return true;
}

export function getAvailableWorkspaces(isSuperAdmin: boolean): StudioWorkspaceDefinition[] {
  return STUDIO_WORKSPACES.filter((ws) => isWorkspaceAvailable(ws, isSuperAdmin));
}

export function getVisibleWorkspaceIds(isSuperAdmin: boolean): StudioWorkspaceId[] {
  return STUDIO_WORKSPACES
    .filter((ws) => isWorkspaceAvailable(ws, isSuperAdmin))
    .map((ws) => ws.id);
}
