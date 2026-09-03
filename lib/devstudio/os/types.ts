export type AiAgentStatus = 'idle' | 'busy' | 'offline' | 'error';

export type AiTaskStatus =
  | 'queued'
  | 'planning'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rolled_back';

export type AiTaskStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'awaiting_approval';

export type BuildKind = 'lint' | 'typecheck' | 'test' | 'build';

export type DeploymentStatus =
  | 'pending'
  | 'building'
  | 'deploying'
  | 'success'
  | 'failed'
  | 'rolled_back';

export interface CreateTaskInput {
  title: string;
  description?: string;
  agentSlug?: string;
  requestedBy: string;
  command?: string;
  priority?: number;
  traceId?: string;
}

export interface TaskPlanStep {
  name: string;
  action_type: string;
  input_json?: Record<string, unknown>;
}

export interface CommandCenterSnapshot {
  activeTasks: number;
  failedTasks: number;
  awaitingApproval: number;
  latestDeployments: Array<{
    id: string;
    service_name: string;
    status: string;
    created_at: string;
    health_status: string | null;
  }>;
  buildStatus: {
    lastBuild: { id: string; status: string; kind: string } | null;
    northflankConfigured: boolean;
  };
  health: {
    website: boolean;
    lms: boolean;
    database: boolean;
  };
  activeAgents: number;
  recentAuditErrors: Array<{
    id: string;
    action: string;
    resource_type: string;
    created_at: string;
  }>;
  integrationPending: string[];
}
