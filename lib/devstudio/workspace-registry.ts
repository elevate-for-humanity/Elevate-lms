import 'server-only';

/**
 * Single source of truth for the Admin-owned Dev Studio.
 * Admin is the privileged Studio role; there is no separate super-admin tier.
 * Every advertised workspace must have one canonical route and one health endpoint.
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
  | 'memory'
  | 'health'
  | 'settings';

export interface StudioWorkspaceDefinition {
  id: StudioWorkspaceId;
  label: string;
  description: string;
  permission: string;
  route: string;
  healthEndpoint: string;
  featureFlag?: string;
}

export const STUDIO_WORKSPACES: StudioWorkspaceDefinition[] = [
  { id: 'ai', label: 'AI Studio', description: 'PARIS, Lizzy and specialized AI agents.', permission: 'studio.ai.use', route: '/paris', healthEndpoint: '/api/admin/dev-studio/ai/health' },
  { id: 'courses', label: 'Course Builder', description: 'Courses, lessons, assessments and credentials.', permission: 'studio.courses.manage', route: '/course-builder', healthEndpoint: '/api/admin/dev-studio/courses/health' },
  { id: 'content', label: 'Content Studio', description: 'Generate and manage reviewed content.', permission: 'studio.content.manage', route: '/paris', healthEndpoint: '/api/admin/dev-studio/content/health' },
  { id: 'media', label: 'Media Studio', description: 'Organization-scoped media and documents.', permission: 'studio.media.manage', route: '/studio/media', healthEndpoint: '/api/admin/dev-studio/media/health' },
  { id: 'workflows', label: 'Workflow Designer', description: 'Build versioned visual automations.', permission: 'studio.workflows.manage', route: '/studio/workflows', healthEndpoint: '/api/admin/dev-studio/workflows/health' },
  { id: 'repository', label: 'Repository Graph', description: 'Explore files, dependencies and code relationships.', permission: 'studio.repository.view', route: '/studio/repository', healthEndpoint: '/api/admin/dev-studio/repository/health' },
  { id: 'tasks', label: 'AI Task Queue', description: 'Plan, approve, execute and verify AI work.', permission: 'studio.tasks.manage', route: '/studio/tasks', healthEndpoint: '/api/admin/dev-studio/tasks/health' },
  { id: 'deployments', label: 'Deployments', description: 'Build, deploy, verify and roll back services.', permission: 'studio.deployments.manage', route: '/studio/deployments', healthEndpoint: '/api/admin/dev-studio/deployments/health' },
  { id: 'containers', label: 'Containers', description: 'Manage isolated execution environments.', permission: 'studio.containers.manage', route: '/studio/containers', healthEndpoint: '/api/admin/dev-studio/containers/health' },
  { id: 'evaluations', label: 'Evaluation Center', description: 'Evidence-based platform and AI evaluation.', permission: 'studio.evaluations.manage', route: '/studio/evaluations', healthEndpoint: '/api/admin/dev-studio/evaluations/health' },
  { id: 'collaboration', label: 'Collaboration', description: 'Comments and shared review context backed by Studio data.', permission: 'studio.collaboration.use', route: '/studio/collaboration', healthEndpoint: '/api/admin/dev-studio/collaboration/health' },
  { id: 'cfd', label: 'CFD Studio', description: 'OpenFOAM project configuration and execution.', permission: 'studio.cfd.manage', route: '/studio/cfd', healthEndpoint: '/api/admin/dev-studio/cfd/health', featureFlag: 'CFD_ENABLED' },
  { id: 'memory', label: 'AI Memory', description: 'Search and manage governed organizational memory.', permission: 'studio.memory.manage', route: '/studio/memory', healthEndpoint: '/api/admin/dev-studio/memory/health' },
  { id: 'health', label: 'System Health', description: 'Capability status and configuration checks.', permission: 'studio.health.view', route: '/studio/health', healthEndpoint: '/api/devstudio/health' },
  { id: 'settings', label: 'Settings', description: 'Providers, features and Studio permissions.', permission: 'studio.settings.manage', route: '/studio/settings', healthEndpoint: '/api/admin/dev-studio/settings/health' },
];

export function getWorkspaceById(id: StudioWorkspaceId): StudioWorkspaceDefinition | undefined {
  return STUDIO_WORKSPACES.find((workspace) => workspace.id === id);
}

export function isWorkspaceAvailable(workspace: StudioWorkspaceDefinition): boolean {
  if (workspace.featureFlag) return process.env[workspace.featureFlag] === 'true';
  return true;
}

export function getAvailableWorkspaces(): StudioWorkspaceDefinition[] {
  return STUDIO_WORKSPACES.filter(isWorkspaceAvailable);
}
