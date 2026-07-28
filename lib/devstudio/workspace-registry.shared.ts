/**
 * Canonical workspace registry for Dev Studio.
 * Client-safe shared types and definitions.
 * Do NOT import server-only modules here.
 */

import type { ElementType } from 'react';
import {
  Activity,
  Bot,
  BookOpen,
  Box,
  Brain,
  Briefcase,
  FileText,
  GitBranch,
  ImageIcon,
  Key,
  ListChecks,
  MessageSquare,
  Microscope,
  Plug,
  Rocket,
  Settings,
  Wind,
  Workflow,
} from 'lucide-react';

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
  | 'settings'
  | 'command'
  | 'files'
  | 'integrations'
  | 'upload'
  | 'operations'
  | 'errors'
  | 'video';

export interface StudioWorkspaceDefinition {
  id: StudioWorkspaceId;
  label: string;
  description: string;
  permission: string;
  healthEndpoint: string;
  featureFlag?: string;
  superAdminOnly?: boolean;
  implemented: boolean;
}

// Icon mapping - client-safe static data
export const WORKSPACE_ICONS: Record<StudioWorkspaceId, ElementType<{ className?: string }>> = {
  ai: Bot,
  courses: BookOpen,
  content: FileText,
  media: ImageIcon,
  workflows: Workflow,
  repository: GitBranch,
  tasks: ListChecks,
  deployments: Rocket,
  containers: Box,
  evaluations: Microscope,
  collaboration: MessageSquare,
  cfd: Wind,
  plugins: Plug,
  memory: Brain,
  health: Activity,
  settings: Settings,
  command: MessageSquare,
  files: FileText,
  integrations: Plug,
  upload: Rocket,
  operations: ListChecks,
  errors: Activity,
  video: FileText,
};

// Canonical workspace registry
export const STUDIO_WORKSPACES: StudioWorkspaceDefinition[] = [
  {
    id: 'ai',
    label: 'AI Studio',
    description: 'PARIS, Lizzy and specialized AI agents.',
    permission: 'studio.ai.use',
    healthEndpoint: '/api/devstudio/health',
    implemented: true,
  },
  {
    id: 'courses',
    label: 'Course Builder',
    description: 'Courses, lessons, assessments and credentials.',
    permission: 'studio.courses.manage',
    healthEndpoint: '/api/admin/dev-studio/courses/health',
    implemented: true,
  },
  {
    id: 'content',
    label: 'Content Studio',
    description: 'Generate and manage reviewed content.',
    permission: 'studio.content.manage',
    healthEndpoint: '/api/admin/dev-studio/content/health',
    implemented: true,
  },
  {
    id: 'media',
    label: 'Media Studio',
    description: 'Organization-scoped media and documents.',
    permission: 'studio.media.manage',
    healthEndpoint: '/api/admin/dev-studio/media/health',
    implemented: true,
  },
  {
    id: 'workflows',
    label: 'Workflows',
    description: 'Build versioned visual automations.',
    permission: 'studio.workflows.manage',
    healthEndpoint: '/api/admin/dev-studio/workflows/health',
    implemented: false,
  },
  {
    id: 'repository',
    label: 'Repository',
    description: 'Explore files and dependencies.',
    permission: 'studio.repository.view',
    healthEndpoint: '/api/admin/dev-studio/repository/health',
    implemented: false,
  },
  {
    id: 'tasks',
    label: 'Tasks',
    description: 'Plan, approve and execute AI work.',
    permission: 'studio.tasks.manage',
    healthEndpoint: '/api/admin/dev-studio/tasks/health',
    implemented: false,
  },
  {
    id: 'deployments',
    label: 'Deployments',
    description: 'Build, deploy and verify services.',
    permission: 'studio.deployments.manage',
    healthEndpoint: '/api/admin/dev-studio/deployments/health',
    implemented: true,
  },
  {
    id: 'containers',
    label: 'Containers',
    description: 'Manage isolated execution environments.',
    permission: 'studio.containers.manage',
    healthEndpoint: '/api/admin/dev-studio/containers/health',
    superAdminOnly: true,
    implemented: true,
  },
  {
    id: 'evaluations',
    label: 'Evaluation',
    description: 'Evidence-based platform evaluation.',
    permission: 'studio.evaluations.manage',
    healthEndpoint: '/api/admin/dev-studio/evaluations/health',
    implemented: true,
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    description: 'Presence and shared editing.',
    permission: 'studio.collaboration.use',
    healthEndpoint: '/api/admin/dev-studio/collaboration/health',
    implemented: false,
  },
  {
    id: 'cfd',
    label: 'CFD',
    description: 'Configure and validate OpenFOAM simulation projects.',
    permission: 'studio.cfd.manage',
    healthEndpoint: '/api/admin/dev-studio/cfd/health',
    featureFlag: 'CFD_ENABLED',
    implemented: true,
  },
  {
    id: 'plugins',
    label: 'Plugins',
    description: 'Install and manage extensions.',
    permission: 'studio.plugins.manage',
    healthEndpoint: '/api/admin/dev-studio/plugins/health',
    implemented: false,
  },
  {
    id: 'memory',
    label: 'Memory',
    description: 'Search and manage organizational memory.',
    permission: 'studio.memory.manage',
    healthEndpoint: '/api/admin/dev-studio/memory/health',
    implemented: false,
  },
  {
    id: 'health',
    label: 'Health',
    description: 'Capability status and configuration.',
    permission: 'studio.health.view',
    healthEndpoint: '/api/devstudio/health',
    implemented: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Providers and studio configuration.',
    permission: 'studio.settings.manage',
    healthEndpoint: '/api/admin/dev-studio/settings/health',
    superAdminOnly: true,
    implemented: true,
  },
  // Legacy/internal workspaces (implemented in this client)
  {
    id: 'command',
    label: 'Command',
    description: 'Command center.',
    permission: 'studio.view',
    healthEndpoint: '',
    implemented: true,
  },
  {
    id: 'files',
    label: 'Files',
    description: 'File browser.',
    permission: 'studio.view',
    healthEndpoint: '',
    implemented: true,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Manage external integrations.',
    permission: 'studio.view',
    healthEndpoint: '',
    implemented: true,
  },
  {
    id: 'upload',
    label: 'Upload',
    description: 'File upload utility.',
    permission: 'studio.view',
    healthEndpoint: '',
    implemented: true,
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Operations panel.',
    permission: 'studio.view',
    healthEndpoint: '',
    implemented: true,
  },
  {
    id: 'errors',
    label: 'Errors',
    description: 'Error monitoring.',
    permission: 'studio.view',
    healthEndpoint: '',
    implemented: true,
  },
  {
    id: 'video',
    label: 'Video',
    description: 'Video management.',
    permission: 'studio.view',
    healthEndpoint: '',
    implemented: true,
  },
];

export function getWorkspaceById(id: StudioWorkspaceId): StudioWorkspaceDefinition | undefined {
  return STUDIO_WORKSPACES.find((ws) => ws.id === id);
}

export function isWorkspaceImplemented(id: StudioWorkspaceId): boolean {
  const ws = getWorkspaceById(id);
  return ws?.implemented ?? false;
}

export function getImplementedWorkspaces(): StudioWorkspaceDefinition[] {
  return STUDIO_WORKSPACES.filter((ws) => ws.implemented);
}
