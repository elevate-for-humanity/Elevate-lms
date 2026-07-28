import 'server-only';

/**
 * Canonical workspace registry for Dev Studio.
 * All workspaces should be defined here rather than hardcoded in DevStudioUnifiedClient.
 */

export type StudioWorkspaceId =
  | 'ai'
  | 'courses'
  | 'content'
  | 'media'
  | 'workflows'
  | 'repository'
  | 'tasks'
  | 'deployments'
  | 'containers'
  | 'evaluations'
  | 'collaboration'
  | 'cfd'
  | 'plugins'
  | 'memory'
  | 'health'
  | 'settings';

export interface StudioWorkspaceDefinition {
  id: StudioWorkspaceId;
  label: string;
  description: string;
  permission: string;
  healthEndpoint: string;
  featureFlag?: string;
  superAdminOnly?: boolean;
}

export const STUDIO_WORKSPACES: StudioWorkspaceDefinition[] = [
  {
    id: 'ai',
    label: 'AI Studio',
    description: 'PARIS, Lizzy and specialized AI agents.',
    permission: 'studio.ai.use',
    healthEndpoint: '/api/devstudio/health',
  },
  {
    id: 'courses',
    label: 'Course Builder',
    description: 'Courses, lessons, assessments and credentials.',
    permission: 'studio.courses.manage',
    healthEndpoint: '/api/admin/dev-studio/courses/health',
  },
  {
    id: 'content',
    label: 'Content Studio',
    description: 'Generate and manage reviewed content.',
    permission: 'studio.content.manage',
    healthEndpoint: '/api/admin/dev-studio/content/health',
  },
  {
    id: 'media',
    label: 'Media Studio',
    description: 'Organization-scoped media and documents.',
    permission: 'studio.media.manage',
    healthEndpoint: '/api/admin/dev-studio/media/health',
  },
  {
    id: 'workflows',
    label: 'Workflow Designer',
    description: 'Build versioned visual automations.',
    permission: 'studio.workflows.manage',
    healthEndpoint: '/api/admin/dev-studio/workflows/health',
  },
  {
    id: 'repository',
    label: 'Repository Graph',
    description: 'Explore files, dependencies and code relationships.',
    permission: 'studio.repository.view',
    healthEndpoint: '/api/admin/dev-studio/repository/health',
  },
  {
    id: 'tasks',
    label: 'AI Task Queue',
    description: 'Plan, approve, execute and verify AI work.',
    permission: 'studio.tasks.manage',
    healthEndpoint: '/api/admin/dev-studio/tasks/health',
  },
  {
    id: 'deployments',
    label: 'Deployments',
    description: 'Build, deploy, verify and roll back services.',
    permission: 'studio.deployments.manage',
    healthEndpoint: '/api/admin/dev-studio/deployments/health',
  },
  {
    id: 'containers',
    label: 'Containers',
    description: 'Manage isolated execution environments.',
    permission: 'studio.containers.manage',
    healthEndpoint: '/api/admin/dev-studio/containers/health',
    superAdminOnly: true,
  },
  {
    id: 'evaluations',
    label: 'Evaluation Center',
    description: 'Evidence-based platform and AI evaluation.',
    permission: 'studio.evaluations.manage',
    healthEndpoint: '/api/admin/dev-studio/evaluations/health',
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    description: 'Presence, comments and shared editing.',
    permission: 'studio.collaboration.use',
    healthEndpoint: '/api/admin/dev-studio/collaboration/health',
  },
  {
    id: 'cfd',
    label: 'CFD Studio',
    description: 'OpenFOAM project configuration and execution.',
    permission: 'studio.cfd.manage',
    healthEndpoint: '/api/admin/dev-studio/cfd/health',
    featureFlag: 'CFD_ENABLED',
  },
  {
    id: 'plugins',
    label: 'Plugins',
    description: 'Install and manage approved platform extensions.',
    permission: 'studio.plugins.manage',
    healthEndpoint: '/api/admin/dev-studio/plugins/health',
  },
  {
    id: 'memory',
    label: 'AI Memory',
    description: 'Search and manage governed organizational memory.',
    permission: 'studio.memory.manage',
    healthEndpoint: '/api/admin/dev-studio/memory/health',
  },
  {
    id: 'health',
    label: 'System Health',
    description: 'Capability status and configuration checks.',
    permission: 'studio.health.view',
    healthEndpoint: '/api/devstudio/health',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Providers, features and studio permissions.',
    permission: 'studio.settings.manage',
    healthEndpoint: '/api/admin/dev-studio/settings/health',
    superAdminOnly: true,
  },
];

export function getWorkspaceById(id: StudioWorkspaceId): StudioWorkspaceDefinition | undefined {
  return STUDIO_WORKSPACES.find((ws) => ws.id === id);
}

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
