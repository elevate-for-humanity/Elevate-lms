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
  locale: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
