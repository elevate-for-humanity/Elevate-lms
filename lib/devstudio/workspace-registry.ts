import 'server-only';

/**
 * Single source of truth for the Admin-owned Studio capability surfaces.
 *
 * /studio itself is the AI operating surface. The entries below are advanced
 * capability/audit surfaces that Admin AI may invoke or an administrator may
 * open directly for inspection. Do not register a second AI/chat workspace.
 */

export type StudioWorkspaceId =
  | 'courses'
  | 'content'
  | 'media'
  | 'workflows'
  | 'repository'
  | 'browser'
  | 'canvas'
  | 'tasks'
  | 'agents'
  | 'builds'
  | 'logs'
  | 'deployments'
  | 'containers'
  | 'evaluations'
  | 'claims'
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
  { id: 'courses', label: 'Course Builder', description: 'Canonical Course Factory inspection and authoring surface.', permission: 'studio.courses.manage', route: '/studio/courses', healthEndpoint: '/api/admin/dev-studio/courses/health' },
  { id: 'content', label: 'Website Content', description: 'Manage the public team directory, training partners and website page copy.', permission: 'studio.content.manage', route: '/studio/content', healthEndpoint: '/api/admin/dev-studio/content/health' },
  { id: 'media', label: 'Media Studio', description: 'Organization-scoped media and documents.', permission: 'studio.media.manage', route: '/studio/media', healthEndpoint: '/api/admin/dev-studio/media/health' },
  { id: 'workflows', label: 'Workflow Designer', description: 'Build versioned visual automations.', permission: 'studio.workflows.manage', route: '/studio/workflows', healthEndpoint: '/api/admin/dev-studio/workflows/health' },
  { id: 'repository', label: 'Repository Workspace', description: 'Edit and preview source, commit to GitHub, and run code in an isolated browser runtime.', permission: 'studio.repository.view', route: '/studio/repository', healthEndpoint: '/api/admin/dev-studio/repository/health' },
  { id: 'browser', label: 'Cloud Browser', description: 'Operate isolated Playwright Chromium sessions and capture live runtime evidence.', permission: 'studio.repository.view', route: '/studio/browser', healthEndpoint: '/api/admin/dev-studio/browser/session' },
  { id: 'canvas', label: 'Live Canvas', description: 'Build, preview, review and publish visual projects with approval controls.', permission: 'studio.content.manage', route: '/studio/canvas', healthEndpoint: '/api/admin/dev-studio/health' },
  { id: 'tasks', label: 'AI Task Queue', description: 'Plan, approve, execute and verify AI work.', permission: 'studio.tasks.manage', route: '/studio/tasks', healthEndpoint: '/api/admin/dev-studio/tasks/health' },
  { id: 'agents', label: 'AI Agents', description: 'Inspect registered autonomous agents, capabilities and execution state.', permission: 'studio.tasks.manage', route: '/studio/agents', healthEndpoint: '/api/admin/dev-studio/agents' },
  { id: 'builds', label: 'Builds', description: 'Inspect durable build records and verification evidence.', permission: 'studio.deployments.manage', route: '/studio/builds', healthEndpoint: '/api/admin/dev-studio/builds' },
  { id: 'logs', label: 'Logs', description: 'Inspect governed runtime and AI error records.', permission: 'studio.health.view', route: '/studio/logs', healthEndpoint: '/api/admin/dev-studio/health' },
  { id: 'deployments', label: 'Deployments', description: 'Build, deploy, verify and roll back services.', permission: 'studio.deployments.manage', route: '/studio/deployments', healthEndpoint: '/api/admin/dev-studio/deployments/health' },
  { id: 'containers', label: 'Containers', description: 'Manage isolated execution environments and canonical runtime configuration.', permission: 'studio.containers.manage', route: '/studio/containers', healthEndpoint: '/api/admin/dev-studio/containers/health' },
  { id: 'evaluations', label: 'Evaluation Center', description: 'Evidence-based platform and AI evaluation.', permission: 'studio.evaluations.manage', route: '/studio/evaluations', healthEndpoint: '/api/admin/dev-studio/evaluations/health' },
  { id: 'claims', label: 'Claims & Evidence', description: 'Verify public product claims with code, benchmark, runtime and certification evidence.', permission: 'studio.settings.manage', route: '/studio/claims', healthEndpoint: '/api/admin/dev-studio/claims/health' },
  { id: 'collaboration', label: 'Collaboration', description: 'Comments and shared review context backed by Studio data.', permission: 'studio.collaboration.use', route: '/studio/collaboration', healthEndpoint: '/api/admin/dev-studio/collaboration/health' },
  { id: 'cfd', label: 'CFD Studio', description: 'OpenFOAM project configuration and execution.', permission: 'studio.cfd.manage', route: '/studio/cfd', healthEndpoint: '/api/admin/dev-studio/cfd/health', featureFlag: 'CFD_ENABLED' },
  { id: 'memory', label: 'AI Memory', description: 'Search and manage governed organizational memory.', permission: 'studio.memory.manage', route: '/studio/memory', healthEndpoint: '/api/admin/dev-studio/memory/health' },
  { id: 'health', label: 'System Health', description: 'Capability status and configuration checks.', permission: 'studio.health.view', route: '/studio/health', healthEndpoint: '/api/admin/dev-studio/health' },
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
