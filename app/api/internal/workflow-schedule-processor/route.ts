/**
 * POST /api/internal/workflow-schedule-processor
 *
 * Fires workflows whose schedule triggers are due.
 * Runs every 5 minutes alongside workflow-event-processor.
 *
 * For each enabled workflow_trigger with trigger_type='schedule':
 *   - Parses cron_expr to determine if the trigger is due within the current 5-min window
 *   - Checks workflow_runs to avoid double-firing within the same window
 *   - Calls executeWorkflow() if due and not already run
 *
 * Cron expression support: standard 5-field cron (minute hour dom month dow).
 * Uses a simple "is this cron due in the last 5 minutes?" check rather than
 * a full cron scheduler — sufficient for 5-min polling cadence.
 */

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { executeWorkflow } from '@/lib/workflows/engine';
import { logger } from '@/lib/logger';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Returns true if the cron expression was due at any minute in the last
 * `windowMinutes` minutes. Supports standard 5-field cron syntax.
 * Handles: exact values, *, /step, comma lists, ranges.
 */
function cronDueInWindow(expr: string, windowMinutes = 5): boolean {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) return false;
  const [minF, hourF, domF, monF, dowF] = fields;

  const matchField = (field: string, value: number, min: number, max: number): boolean => {
    if (field === '*') return true;
    for (const part of field.split(',')) {
      if (part.includes('/')) {
        const [base, step] = part.split('/');
        const start = base === '*' ? min : parseInt(base, 10);
        const stepN = parseInt(step, 10);
        if (!isNaN(start) && !isNaN(stepN)) {
          for (let v = start; v <= max; v += stepN) {
            if (v === value) return true;
          }
        }
      } else if (part.includes('-')) {
        const [lo, hi] = part.split('-').map(Number);
        if (value >= lo && value <= hi) return true;
      } else {
        if (parseInt(part, 10) === value) return true;
      }
    }
    return false;
  };

  const now = new Date();
  for (let offset = 0; offset < windowMinutes; offset++) {
    const t = new Date(now.getTime() - offset * 60 * 1000);
    const minute = t.getUTCMinutes();
    const hour   = t.getUTCHours();
    const dom    = t.getUTCDate();
    const month  = t.getUTCMonth() + 1;
    const dow    = t.getUTCDay();

    if (
      matchField(minF, minute, 0, 59) &&
      matchField(hourF, hour, 0, 23) &&
      matchField(domF, dom, 1, 31) &&
      matchField(monF, month, 1, 12) &&
      matchField(dowF, dow, 0, 6)
    ) {
      return true;
    }
  }
  return false;
}

export const POST = withRuntime({ cron: true }, async () => {
  const db = await requireAdminClient();

  // Load all enabled schedule triggers
  const { data: triggers, error: triggersErr } = await db
    .from('workflow_triggers')
    .select('id, workflow_id, cron_expr')
    .eq('trigger_type', 'schedule')
    .eq('enabled', true)
    .not('cron_expr', 'is', null);

  if (triggersErr) {
    logger.error('[workflow-schedule-processor] Failed to load triggers', triggersErr);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!triggers?.length) {
    return NextResponse.json({ ok: true, fired: 0 });
  }

  // Window start for dedup check (last 5 minutes)
  const windowStart = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  let fired = 0;
  let skipped = 0;

  for (const trigger of triggers) {
    if (!trigger.cron_expr || !cronDueInWindow(trigger.cron_expr)) {
      skipped++;
      continue;
    }

    // Dedup: skip if this workflow already ran in the last 5 minutes via this trigger
    const { data: recentRun } = await db
      .from('workflow_runs')
      .select('id')
      .eq('workflow_id', trigger.workflow_id)
      .eq('trigger_id', trigger.id)
      .eq('triggered_by', 'schedule')
      .gte('started_at', windowStart)
      .limit(1)
      .maybeSingle();

    if (recentRun) {
      skipped++;
      continue;
    }

    // Concurrency guard: skip if workflow already has an active run
    const { data: activeRun } = await db
      .from('workflow_runs')
      .select('id')
      .eq('workflow_id', trigger.workflow_id)
      .eq('status', 'running')
      .maybeSingle();

    if (activeRun) {
      logger.warn('[workflow-schedule-processor] Skipping — workflow already running', {
        workflow_id: trigger.workflow_id,
        active_run_id: activeRun.id,
      });
      skipped++;
      continue;
    }

    try {
      await executeWorkflow(trigger.workflow_id, 'schedule', { trigger_id: trigger.id }, trigger.id);
      fired++;
    } catch (err) {
      logger.error('[workflow-schedule-processor] executeWorkflow failed', err as Error, {
        workflow_id: trigger.workflow_id,
        trigger_id: trigger.id,
      });
    }
  }

  logger.info('[workflow-schedule-processor] Run complete', { fired, skipped });
  return NextResponse.json({ ok: true, fired, skipped });
});
