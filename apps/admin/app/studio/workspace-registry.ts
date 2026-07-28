/**
 * Elevate OS Unified Workspace Registry
 * 
 * Canonical workspace definitions for the Dev Studio interface.
 * All workspaces must be registered here and validated against permissions.
 */

export type WorkspacePermission =
  | 'studio.view'
  | 'ai.use'
  | 'courses.manage'
  | 'content.generate'
  | 'media.manage'
  | 'deployments.manage'
  | 'containers.manage'
  | 'evaluations.manage'
  | 'simulations.manage'
  | 'studio.settings';

export type WorkspaceId =
  | 'overview'
  | 'ai-chat'
  | 'course-builder'
  | 'content-studio'
  | 'media-library'
  | 'development'
  | 'deployments'
  | 'containers'
  | 'evaluations'
  | 'cfd-simulation'
  | 'settings'
  | 'audit-log';

export interface StudioWorkspace {
  id: WorkspaceId;
  label: string;
  description: string;
  href: string;
  permission: WorkspacePermission;
  enabled: boolean;
  /** Whether this workspace is embedded in the main Dev Studio UI */
  embedded?: boolean;
  /** External workspace that opens in a new page */
  external?: boolean;
  /** Health check endpoint for status display */
  healthEndpoint?: string;
  /** Icon name from lucide-react */
  icon?: string;
  /** Category for grouping */
  category?: 'core' | 'ai' | 'devops' | 'content' | 'specialized';
}

export const STUDIO_WORKSPACES: StudioWorkspace[] = [
  // ============================================
  // CORE WORKSPACES (embedded in main Dev Studio)
  // ============================================
  {
    id: 'overview',
    label: 'Overview',
    description: 'Unified status and activity across Elevate OS.',
    href: '/admin/studio',
    permission: 'studio.view',
    enabled: true,
    embedded: true,
    category: 'core',
    icon: 'LayoutDashboard',
  },
  {
    id: 'ai-chat',
    label: 'AI Chat',
    description: 'Chat with PARIS, Lizzy, and authorized specialist agents.',
    href: '/admin/studio?workspace=studio',
    permission: 'ai.use',
    enabled: true,
    embedded: true,
    category: 'ai',
    icon: 'Bot',
    healthEndpoint: '/api/devstudio/chat/health',
  },
  {
    id: 'course-builder',
    label: 'Course Builder',
    description: 'Create and manage courses, lessons, assessments, and credentials.',
    href: '/admin/studio?tab=courses',
    permission: 'courses.manage',
    enabled: true,
    embedded: true,
    category: 'content',
    icon: 'GraduationCap',
    healthEndpoint: '/api/admin/courses/health',
  },
  {
    id: 'deployments',
    label: 'Deployments',
    description: 'Manage controlled application deployments and verification.',
    href: '/admin/studio?workspace=deploy',
    permission: 'deployments.manage',
    enabled: true,
    embedded: true,
    category: 'devops',
    icon: 'Rocket',
    healthEndpoint: '/api/devstudio/deployments/health',
  },
  {
    id: 'containers',
    label: 'Containers',
    description: 'Run isolated builds, tests, workers, and development environments.',
    href: '/admin/studio?workspace=environments',
    permission: 'containers.manage',
    enabled: true,
    embedded: true,
    category: 'devops',
    icon: 'Box',
    healthEndpoint: '/api/devstudio/containers/health',
  },
  {
    id: 'media-library',
    label: 'Media Library',
    description: 'Manage images, video, documents, and reusable assets.',
    href: '/admin/studio/media',
    permission: 'media.manage',
    enabled: true,
    embedded: true,
    category: 'content',
    icon: 'Image',
    healthEndpoint: '/api/admin/media-assets/health',
  },
  {
    id: 'development',
    label: 'Development',
    description: 'Inspect repositories, changes, builds, and application health.',
    href: '/admin/studio?workspace=files',
    permission: 'studio.view',
    enabled: true,
    embedded: true,
    category: 'devops',
    icon: 'Code',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Configure providers, limits, permissions, and integrations.',
    href: '/admin/studio/settings',
    permission: 'studio.settings',
    enabled: true,
    embedded: true,
    category: 'core',
    icon: 'Settings',
  },

  // ============================================
  // EXTERNAL AI STUDIOS (open in new page)
  // ============================================
  {
    id: 'content-studio',
    label: 'PARIS Content',
    description: 'AI-powered content generation for marketing, social, and documentation.',
    href: '/admin/paris',
    permission: 'content.generate',
    enabled: true,
    external: true,
    category: 'ai',
    icon: 'Sparkles',
    healthEndpoint: '/api/paris/health',
  },
  {
    id: 'evaluations',
    label: 'AI Evaluation',
    description: 'Evaluate AI, courses, software workflows, and quality standards.',
    href: '/admin/evaluation',
    permission: 'evaluations.manage',
    enabled: true,
    external: true,
    category: 'ai',
    icon: 'CheckCircle',
    healthEndpoint: '/api/evaluation/health',
  },
  {
    id: 'cfd-simulation',
    label: 'CFD Simulation',
    description: 'Configure and run approved technical fluid and thermal simulations.',
    href: '/admin/cfd-studio',
    permission: 'simulations.manage',
    enabled: process.env.CFD_ENABLED === 'true',
    external: true,
    category: 'specialized',
    icon: 'FlaskConical',
  },

  // ============================================
  // ADMIN STUDIO TOOLS (embedded)
  // ============================================
  {
    id: 'audit-log',
    label: 'Audit Log',
    description: 'Review user, agent, deployment, and system activity.',
    href: '/admin/audit-logs',
    permission: 'studio.view',
    enabled: true,
    external: true,
    category: 'core',
    icon: 'ScrollText',
  },
  {
    id: 'workflows',
    label: 'Workflows',
    description: 'Manage automated workflows and triggers.',
    href: '/admin/studio/workflows',
    permission: 'studio.view',
    enabled: true,
    embedded: true,
    category: 'core',
    icon: 'Workflow',
  },
  {
    id: 'agents',
    label: 'AI Agents',
    description: 'Configure and monitor AI agents.',
    href: '/admin/studio/agents',
    permission: 'ai.use',
    enabled: true,
    embedded: true,
    category: 'ai',
    icon: 'Users',
  },
  {
    id: 'tasks',
    label: 'AI Tasks',
    description: 'Track and manage AI task executions.',
    href: '/admin/studio/tasks',
    permission: 'ai.use',
    enabled: true,
    embedded: true,
    category: 'ai',
    icon: 'ListTodo',
  },
  {
    id: 'memory',
    label: 'AI Memory',
    description: 'Configure AI conversation memory and context.',
    href: '/admin/studio/memory',
    permission: 'ai.use',
    enabled: true,
    embedded: true,
    category: 'ai',
    icon: 'Brain',
  },
];

/**
 * Get workspace by ID
 */
export function getWorkspace(id: WorkspaceId): StudioWorkspace | undefined {
  return STUDIO_WORKSPACES.find(w => w.id === id);
}

/**
 * Get all workspaces for a given permission
 */
export function getWorkspacesForPermission(permission: WorkspacePermission): StudioWorkspace[] {
  return STUDIO_WORKSPACES.filter(w => w.enabled);
}

/**
 * Get workspaces by category
 */
export function getWorkspacesByCategory(category: StudioWorkspace['category']): StudioWorkspace[] {
  return STUDIO_WORKSPACES.filter(w => w.category === category && w.enabled);
}

/**
 * Check if workspace requires external navigation
 */
export function isExternalWorkspace(id: WorkspaceId): boolean {
  const workspace = getWorkspace(id);
  return workspace?.external === true;
}

/**
 * Get health status for a workspace
 */
export function getWorkspaceHealthEndpoint(id: WorkspaceId): string | undefined {
  const workspace = getWorkspace(id);
  return workspace?.healthEndpoint;
}

/**
 * Workspace categories for UI grouping
 */
export const WORKSPACE_CATEGORIES = {
  core: {
    label: 'Core',
    description: 'Essential platform tools',
  },
  ai: {
    label: 'AI Studios',
    description: 'AI-powered content and automation',
  },
  devops: {
    label: 'DevOps',
    description: 'Development and deployment tools',
  },
  content: {
    label: 'Content',
    description: 'Content creation and management',
  },
  specialized: {
    label: 'Specialized',
    description: 'Technical simulation tools',
  },
} as const;

/**
 * Map workspace IDs to tab/workspace params for DevStudioUnifiedClient
 */
export const WORKSPACE_PARAM_MAP: Record<WorkspaceId, { workspace?: string; tab?: string }> = {
  'overview': { workspace: 'studio' },
  'ai-chat': { workspace: 'studio' },
  'course-builder': { tab: 'courses' },
  'content-studio': {}, // External
  'media-library': {}, // External page
  'development': { workspace: 'files' },
  'deployments': { workspace: 'deploy' },
  'containers': { workspace: 'environments' },
  'evaluations': {}, // External
  'cfd-simulation': {}, // External
  'settings': {}, // External page
  'audit-log': {}, // External page
  'workflows': {}, // External page
  'agents': {}, // External page
  'tasks': {}, // External page
  'memory': {}, // External page
};

/**
 * Convert workspace ID to Dev Studio URL params
 */
export function workspaceToUrlParams(id: WorkspaceId): string {
  const params = WORKSPACE_PARAM_MAP[id];
  if (!params) return '/admin/studio';
  
  const searchParams = new URLSearchParams();
  if (params.workspace) searchParams.set('workspace', params.workspace);
  if (params.tab) searchParams.set('tab', params.tab);
  
  const query = searchParams.toString();
  return query ? `/admin/studio?${query}` : '/admin/studio';
}
