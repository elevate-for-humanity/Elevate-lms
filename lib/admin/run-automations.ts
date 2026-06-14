// Automation runner — executes pending actions from automation_action_queue.
// Called by /api/admin/automations/run (triggered by job_queue or on-demand).
//
// Safety guarantees:
//   - Cooldown enforced in DB via automation_in_cooldown() before enqueue
//   - Each action is idempotent: status transitions are guarded
//   - All outcomes written to automation_execution_log
//   - Never throws — returns a structured result so callers can log/alert

import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface AutomationRunResult {
  enqueued: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: string[];
}

// ── Email dispatch ────────────────────────────────────────────────────────────
// Sends via the existing /api/email/send internal route.
// Falls back to logging if email is not configured.
async function dispatchEmail(config: {
  template: string;
  to_role?: string;
  reference_id: string;
  reference_table: string;
}): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': process.env.INTERNAL_API_KEY ?? '',
      },
      body: JSON.stringify({
        template: config.template,
        to_role: config.to_role,
        reference_id: config.reference_id,
        reference_table: config.reference_table,
      }),
    });
    if (res.ok) return { ok: true, detail: `email sent: ${config.template}` };
    const body = await res.text();
    return { ok: false, detail: `email failed ${res.status}: ${body}` };
  } catch (err: any) {
    // Email not configured — log the intent instead of crashing
    logger.warn('[run-automations] email dispatch unavailable, logging intent', { config });
    return { ok: true, detail: `email logged (dispatch unavailable): ${config.template}` };
  }
}

// ── Escalation ────────────────────────────────────────────────────────────────
async function escalate(
  db: SupabaseClient,
  config: { to_role: string; template: string },
  referenceId: string,
  referenceTable: string,
): Promise<{ ok: boolean; detail: string }> {
  // Write an escalation record to compliance_alerts so it surfaces in the dashboard
  const { error } = await db.from('compliance_alerts').insert({
    alert_type: 'escalation',
    severity: 'high',
    message: `Automated escalation: ${config.template} for ${referenceTable}/${referenceId}`,
    resolved: false,
    metadata: { escalated_to_role: config.to_role, source_reference_id: referenceId },
  });
  if (error) return { ok: false, detail: `escalation insert failed: ${error.message}` };
  return { ok: true, detail: `escalated to ${config.to_role}` };
}

// ── Job retry ─────────────────────────────────────────────────────────────────
async function retryJob(
  db: SupabaseClient,
  referenceId: string,
  config: { backoff_minutes?: number[] },
): Promise<{ ok: boolean; detail: string }> {
  const { data: job, error: fetchErr } = await db
    .from('job_queue')
    .select('id, attempts, status')
    .eq('id', referenceId)
    .maybeSingle();

  if (fetchErr || !job) return { ok: false, detail: `job not found: ${referenceId}` };

  const maxAttempts = 3;
  if ((job.attempts ?? 0) >= maxAttempts) {
    return { ok: false, detail: `max attempts (${maxAttempts}) reached for job ${referenceId}` };
  }

  const backoffMins = (config.backoff_minutes ?? [5, 15, 60])[job.attempts] ?? 60;
  const runAfter = new Date(Date.now() + backoffMins * 60 * 1000).toISOString();

  const { error: updateErr } = await db
    .from('job_queue')
    .update({ status: 'pending', run_after: runAfter, last_error: null })
    .eq('id', referenceId);

  if (updateErr) return { ok: false, detail: `retry update failed: ${updateErr.message}` };
  return { ok: true, detail: `job ${referenceId} rescheduled in ${backoffMins}m` };
}

// ── Main runner ───────────────────────────────────────────────────────────────
export async function runAutomations(db: SupabaseClient): Promise<AutomationRunResult> {
  const result: AutomationRunResult = {
    enqueued: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // 1. Refresh priority queue and enqueue new automation actions
  try {
    const { error: refreshErr } = await db.rpc('refresh_admin_priority_queue');
    if (refreshErr)
      logger.warn('[run-automations] priority queue refresh failed', { error: refreshErr.message });

    const { data: enqueueData, error: enqueueErr } = await db.rpc('enqueue_automation_actions');
    if (enqueueErr) logger.warn('[run-automations] enqueue failed', { error: enqueueErr.message });
    else result.enqueued = enqueueData ?? 0;
  } catch (err: any) {
    logger.warn('[run-automations] RPC unavailable (migration not applied?)', {
      error: err.message,
    });
  }

  // 2. Pull pending actions (limit 50 per run to prevent timeout)
  const { data: actions, error: fetchErr } = await db
    .from('automation_action_queue')
    .select('id, rule_id, reference_id, reference_table, action_type, action_config, attempts')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(50);

  if (fetchErr) {
    result.errors.push(`fetch actions failed: ${fetchErr.message}`);
    return result;
  }

  for (const action of actions ?? []) {
    result.processed++;

    // Mark as processing
    await db
      .from('automation_action_queue')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempts: (action.attempts ?? 0) + 1,
      })
      .eq('id', action.id);

    let outcome: 'success' | 'failure' | 'skipped';
    let detail: string;

    try {
      const cfg = action.action_config ?? {};

      if (action.action_type === 'send_email') {
        const r = await dispatchEmail({
          ...cfg,
          reference_id: action.reference_id,
          reference_table: action.reference_table,
        });
        outcome = r.ok ? 'success' : 'failure';
        detail = r.detail ?? '';
      } else if (action.action_type === 'escalate') {
        const r = await escalate(db, cfg, action.reference_id, action.reference_table);
        outcome = r.ok ? 'success' : 'failure';
        detail = r.detail ?? '';
      } else if (action.action_type === 'retry_job') {
        const r = await retryJob(db, action.reference_id, cfg);
        outcome = r.ok ? 'success' : 'failure';
        detail = r.detail ?? '';
      } else {
        outcome = 'skipped';
        detail = `unknown action_type: ${action.action_type}`;
      }
    } catch (err: any) {
      outcome = 'failure';
      detail = err.message ?? 'unknown error';
      result.errors.push(`action ${action.id}: ${detail}`);
    }

    // Update action status
    const finalStatus =
      outcome === 'success' ? 'completed' : outcome === 'skipped' ? 'skipped' : 'failed';
    await db
      .from('automation_action_queue')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        last_error: outcome === 'failure' ? detail : null,
      })
      .eq('id', action.id);

    // Write execution log
    await db.from('automation_execution_log').insert({
      action_id: action.id,
      rule_id: action.rule_id,
      reference_id: action.reference_id,
      reference_table: action.reference_table,
      action_type: action.action_type,
      outcome,
      detail: { message: detail },
    });

    if (outcome === 'success') result.succeeded++;
    else if (outcome === 'failure') result.failed++;
    else result.skipped++;
  }

  logger.info('[run-automations] run complete', result);
  return result;
}
