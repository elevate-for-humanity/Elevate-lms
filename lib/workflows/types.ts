export type TriggerType = 'event' | 'schedule' | 'manual' | 'webhook';
export type ActionType =
  | 'send_email'
  | 'send_notification'
  | 'update_record'
  | 'create_record'
  | 'emit_event'
  | 'webhook_call'
  | 'ai_action'
  | 'condition';
export type RunStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';
export type WorkflowStatus = 'active' | 'inactive' | 'paused' | 'error';

export interface Workflow {
  id: string;
  name: string;
  workflow_key: string;
  category: string;
  status: WorkflowStatus;
  last_run_at: string | null;
  last_run_status: string | null;
  run_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTrigger {
  id: string;
  workflow_id: string;
  trigger_type: TriggerType;
  event_filter: Record<string, unknown>;
  cron_expr: string | null;
  webhook_secret: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  is_condition: boolean;
  condition_expr: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  trigger_id: string | null;
  status: RunStatus;
  triggered_by: string;
  trigger_payload: Record<string, unknown>;
  steps_total: number;
  steps_done: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  // joined
  workflow?: { name: string; category: string };
}

export interface WorkflowStepLog {
  id: string;
  run_id: string;
  step_id: string | null;
  step_order: number;
  action_type: string | null;
  status: RunStatus;
  output: Record<string, unknown>;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export const ACTION_LABELS: Record<ActionType, string> = {
  send_email: 'Send Email',
  send_notification: 'Send Notification',
  update_record: 'Update Record',
  create_record: 'Create Record',
  emit_event: 'Emit Event',
  webhook_call: 'Webhook Call',
  ai_action: 'AI Action',
  condition: 'Condition / Branch',
};

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  event: 'Platform Event',
  schedule: 'Schedule (Cron)',
  manual: 'Manual',
  webhook: 'Inbound Webhook',
};

export const STATUS_COLORS: Record<WorkflowStatus | RunStatus, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-700',
  paused: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  pending: 'bg-slate-100 text-slate-600',
  running: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  skipped: 'bg-slate-100 text-slate-500',
};
