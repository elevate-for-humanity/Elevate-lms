import 'server-only';

export type WorkflowActionRisk = 'low' | 'medium' | 'high' | 'critical';

export type WorkflowActionPolicy = {
  id: string;
  description: string;
  risk: WorkflowActionRisk;
  approvalRequired: boolean;
  timeoutMs: number;
  maxRetries: number;
  idempotent: boolean;
  auditRequired: boolean;
};

/**
 * Low-level policy for workflow-engine primitives only.
 * Domain/agent tools remain canonically owned by lib/ai/tools/registry.ts.
 */
export const WORKFLOW_ACTION_POLICIES: Record<string, WorkflowActionPolicy> = {
  send_notification: { id: 'send_notification', description: 'Create an in-platform notification.', risk: 'low', approvalRequired: false, timeoutMs: 10_000, maxRetries: 3, idempotent: false, auditRequired: true },
  emit_event: { id: 'emit_event', description: 'Emit a governed platform event.', risk: 'low', approvalRequired: false, timeoutMs: 10_000, maxRetries: 3, idempotent: true, auditRequired: true },
  webhook_call: { id: 'webhook_call', description: 'Call an explicitly allowlisted external or internal webhook.', risk: 'high', approvalRequired: false, timeoutMs: 10_000, maxRetries: 3, idempotent: false, auditRequired: true },
  send_email: { id: 'send_email', description: 'Send a transactional workflow email.', risk: 'medium', approvalRequired: false, timeoutMs: 30_000, maxRetries: 3, idempotent: false, auditRequired: true },
  condition: { id: 'condition', description: 'Evaluate a deterministic workflow condition.', risk: 'low', approvalRequired: false, timeoutMs: 2_000, maxRetries: 1, idempotent: true, auditRequired: false },
  create_record: { id: 'create_record', description: 'Create a record only in an explicitly allowlisted workflow table.', risk: 'high', approvalRequired: false, timeoutMs: 15_000, maxRetries: 2, idempotent: false, auditRequired: true },
  update_record: { id: 'update_record', description: 'Update records only in an explicitly allowlisted workflow table.', risk: 'high', approvalRequired: false, timeoutMs: 15_000, maxRetries: 2, idempotent: false, auditRequired: true },
  ai_action: { id: 'ai_action', description: 'Invoke the canonical Elevate AI service for an operational reasoning/generation task.', risk: 'medium', approvalRequired: false, timeoutMs: 120_000, maxRetries: 3, idempotent: true, auditRequired: true },
};

const DEFAULT_MUTATION_TABLES = new Set([
  'notifications', 'workflow_runs', 'workflow_step_logs', 'workflow_dead_letters',
  'platform_events', 'provisioning_events', 'leads', 'contacts', 'applications',
  'program_enrollments', 'user_tasks',
]);

function configuredMutationTables(): Set<string> {
  const configured = (process.env.WORKFLOW_MUTATION_TABLES ?? '')
    .split(',').map((value) => value.trim()).filter(Boolean);
  return new Set([...DEFAULT_MUTATION_TABLES, ...configured]);
}

export function isWorkflowMutationTableAllowed(table: string): boolean {
  return configuredMutationTables().has(table.trim());
}

const DEFAULT_WEBHOOK_HOSTS = new Set([
  'elevateforhumanity.org', 'www.elevateforhumanity.org',
  'admin.elevateforhumanity.org', 'app.elevateforhumanity.org',
]);

function configuredWebhookHosts(): Set<string> {
  const configured = (process.env.WORKFLOW_WEBHOOK_ALLOWED_HOSTS ?? '')
    .split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
  return new Set([...DEFAULT_WEBHOOK_HOSTS, ...configured]);
}

export function validateWorkflowWebhookUrl(value: string): { ok: true; url: URL } | { ok: false; error: string } {
  let url: URL;
  try { url = new URL(value); } catch { return { ok: false, error: 'webhook_call requires a valid absolute URL' }; }
  if (url.protocol !== 'https:') return { ok: false, error: 'webhook_call requires HTTPS' };
  const host = url.hostname.toLowerCase();
  if (!configuredWebhookHosts().has(host)) return { ok: false, error: `webhook host '${host}' is not allowlisted` };
  return { ok: true, url };
}

export function getWorkflowActionPolicy(actionType: string): WorkflowActionPolicy | null {
  return WORKFLOW_ACTION_POLICIES[actionType] ?? null;
}
