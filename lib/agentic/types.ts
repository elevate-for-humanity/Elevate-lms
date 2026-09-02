export type AgenticTargetType =
  | 'store_workspace'
  | 'website'
  | 'course'
  | 'application'
  | 'program'
  | 'workflow'
  | 'apprenticeship'
  | 'marketing_campaign'
  | 'dev_studio';

export type AgenticProjectStatus = 'active' | 'paused' | 'completed' | 'failed' | 'archived';
export type AgenticProjectLifecycleStatus =
  | 'discovery'
  | 'planned'
  | 'approved'
  | 'designing'
  | 'building'
  | 'validating'
  | 'repairing'
  | 'preview_ready'
  | 'awaiting_approval'
  | 'publishing'
  | 'live'
  | 'blocked'
  | 'publish_failed'
  | 'rolling_back'
  | 'rolled_back'
  | 'cancelled'
  | 'archived';

export type AgenticProjectSourceType =
  | 'blank'
  | 'prompt'
  | 'template'
  | 'remix'
  | 'github'
  | 'gitlab'
  | 'public_site'
  | 'existing_elevate_asset';

export interface AgenticArtifactManifest {
  schemaVersion: 1;
  artifactType: string;
  authority: string;
  targetId?: string | null;
  state: Record<string, unknown>;
  validation: {
    status: 'not_run' | 'running' | 'passed' | 'failed';
    blockingFindings: string[];
    warnings: string[];
    evidence: Array<Record<string, unknown>>;
  };
}
export type AgenticExecutionStatus =
  | 'queued'
  | 'running'
  | 'waiting_for_user'
  | 'waiting_for_approval'
  | 'completed'
  | 'failed'
  | 'canceled';
export type AgenticCostClass = 'free' | 'low' | 'medium' | 'high' | 'gpu';
export type AgenticInputMode = 'text' | 'voice' | 'system';

export interface AgenticActionResult<TChanges = Record<string, unknown>> {
  status: AgenticExecutionStatus;
  summary: string;
  changes?: TChanges;
  artifacts?: Array<{
    id?: string;
    type: string;
    url?: string;
    metadata?: Record<string, unknown>;
  }>;
  previewUpdates?: Array<{
    target: string;
    action: 'refresh' | 'navigate' | 'replace';
    value?: string;
  }>;
  creditsUsed: number;
  requiresConfirmation?: boolean;
  requiresHumanReview?: boolean;
  errors?: string[];
}

export interface AgenticWorkerDefinition {
  name: string;
  capabilities: string[];
  targetTypes: AgenticTargetType[];
  costClass: AgenticCostClass;
  approvalRequired?: boolean;
}

export interface AgenticPlanTask {
  id: string;
  worker: string;
  action: string;
  dependencies: string[];
  input: Record<string, unknown>;
  costClass: AgenticCostClass;
  approvalRequired: boolean;
}

export interface AgenticPlan {
  summary: string;
  tasks: AgenticPlanTask[];
}

export interface AgenticProjectRecord {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  target_type: AgenticTargetType;
  target_id: string | null;
  title: string;
  original_prompt: string | null;
  status: AgenticProjectStatus;
  lifecycle_status?: AgenticProjectLifecycleStatus;
  source_type?: AgenticProjectSourceType;
  artifact_manifest?: AgenticArtifactManifest | Record<string, unknown>;
  design_system?: Record<string, unknown>;
  approved_plan?: AgenticPlan | Record<string, unknown>;
  subscription_requirements?: Record<string, unknown>;
  template_version_id?: string | null;
  current_checkpoint_id?: string | null;
  current_release_id?: string | null;
  locale: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
