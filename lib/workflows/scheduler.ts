import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { emitPlatformEvent } from '@/lib/platform/orchestration/events';
import { executeWorkflow } from '@/lib/workflows/engine';

export const SCHEDULE_DUE_EVENT = 'workflow.schedule_due';
const SOURCE = 'workflow-scheduler';
const MINUTE = 60_000;
const MAX_LOOKBACK = 24 * 60 * MINUTE;

function cronField(field: string, minimum: number, maximum: number, sunday = false) {
  const values = new Set<number>();
  for (const part of field.split(',')) {
    const match = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
    if (!match) throw new Error('UNSUPPORTED_WORKFLOW_CRON');
    const step = match[2] ? Number(match[2]) : 1;
    if (!Number.isSafeInteger(step) || step < 1 || step > maximum - minimum + 1) {
      throw new Error('INVALID_WORKFLOW_CRON_STEP');
    }
    let start = minimum;
    let end = maximum;
    if (match[1] !== '*') {
      const range = match[1].split('-').map(Number);
      start = range[0];
      end = range[1] ?? (match[2] ? maximum : start);
    }
    if (start < minimum || end > maximum || start > end) throw new Error('INVALID_WORKFLOW_CRON_RANGE');
    for (let value = start; value <= end; value += step) values.add(sunday && value === 7 ? 0 : value);
  }
  return { values, wildcard: field === '*' || field.startsWith('*/') };
}

export function parseWorkflowCron(expression: string) {
  const fields = String(expression ?? '').trim().split(/\s+/);
  if (fields.length !== 5) throw new Error('UNSUPPORTED_WORKFLOW_CRON');
  const [minute, hour, day, month, weekday] = [
    cronField(fields[0], 0, 59), cronField(fields[1], 0, 23),
    cronField(fields[2], 1, 31), cronField(fields[3], 1, 12), cronField(fields[4], 0, 7, true),
  ];
  return (date: Date) => {
    const dayMatches = day.values.has(date.getUTCDate());
    const weekdayMatches = weekday.values.has(date.getUTCDay());
    // Standard five-field cron uses OR when both day fields are restricted.
    const calendarMatches = day.wildcard || weekday.wildcard
      ? dayMatches && weekdayMatches : dayMatches || weekdayMatches;
    return minute.values.has(date.getUTCMinutes()) && hour.values.has(date.getUTCHours())
      && month.values.has(date.getUTCMonth() + 1) && calendarMatches;
  };
}

function sign(secret: string, kind: string, value: unknown) {
  return createHmac('sha256', secret).update(JSON.stringify([kind, value])).digest('hex');
}

function validProof(actual: unknown, expected: string) {
  return typeof actual === 'string' && /^[a-f0-9]{64}$/.test(actual)
    && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function cursorValue(triggerId: string, definitionVersion: string, observedThrough: string) {
  return { triggerId, definitionVersion, observedThrough };
}

function occurrenceValue(triggerId: string, workflowId: string, tenantId: string | null, definitionVersion: string, scheduledFor: string) {
  return { triggerId, workflowId, tenantId, definitionVersion, scheduledFor };
}

function requireSecret(secret: string | undefined): asserts secret is string {
  if (!secret) throw new Error('WORKFLOW_SCHEDULER_CREDENTIAL_REQUIRED');
}

function definitionVersion(trigger: any, workflow: any) {
  const updatedAt = trigger.updated_at || trigger.created_at;
  if (!updatedAt) throw new Error('WORKFLOW_SCHEDULE_VERSION_REQUIRED');
  // Bind receipts to the saved definition and the workflow activation revision.
  // A schedule edit or workflow reactivation starts a fresh observation window.
  return createHash('sha256').update(JSON.stringify([
    trigger.workflow_id, trigger.cron_expr, updatedAt,
    workflow.updated_at || workflow.created_at || null,
  ])).digest('hex');
}

/**
 * Coalesce a delayed tick to the latest due occurrence, with an explicit count.
 * The first observation starts now; it never replays historical schedules.
 * Occurrences use the canonical event queue's unique keys and atomic leases.
 */
export async function enqueueDueWorkflowSchedules(db: any, now = new Date(), secret = process.env.CRON_SECRET) {
  requireSecret(secret);
  const nowMinute = Math.floor(now.getTime() / MINUTE) * MINUTE;
  if (!Number.isFinite(nowMinute)) throw new Error('INVALID_SCHEDULER_TIME');
  const observedThrough = new Date(nowMinute).toISOString();
  const { data: triggers, error } = await db.from('workflow_triggers')
    .select('id,workflow_id,cron_expr,enabled,created_at,updated_at')
    .eq('trigger_type', 'schedule').eq('enabled', true).order('id', { ascending: true }).limit(101);
  if (error) throw error;
  if ((triggers?.length ?? 0) > 100) throw new Error('WORKFLOW_SCHEDULE_BATCH_LIMIT_EXCEEDED');
  const result = { observed: 0, queued: 0, duplicates: 0, coalesced: 0, truncated: 0, failed: 0, failures: [] as Array<{ triggerId: string; code: string }> };
  if (!triggers?.length) return result;
  const workflowIds = [...new Set(triggers.map((trigger: any) => trigger.workflow_id))];
  const { data: workflows, error: workflowError } = await db.from('workflows')
    .select('id,status,tenant_id,created_at,updated_at').in('id', workflowIds);
  if (workflowError) throw workflowError;
  const active = new Map<string, any>((workflows ?? []).filter((workflow: any) => workflow.status === 'active').map((workflow: any) => [workflow.id, workflow]));

  for (const trigger of triggers) {
    const workflow = active.get(trigger.workflow_id);
    if (!workflow) continue;
    try {
      const matches = parseWorkflowCron(trigger.cron_expr);
      const version = definitionVersion(trigger, workflow);
      const cursorKey = `workflow:schedule:cursor:${trigger.id}`;
      const { data: savedCursor, error: cursorError } = await db.from('platform_events')
        .select('id,payload').eq('idempotency_key', cursorKey).maybeSingle();
      if (cursorError) throw cursorError;
      let cursor = savedCursor;
      let previous = nowMinute - MINUTE;
      if (!cursor) {
        // Persist the start of the first observation window, not its end.
        // If queuing fails, a subsequent tick must still retry this occurrence.
        const value = cursorValue(trigger.id, version, new Date(previous).toISOString());
        const inserted = await emitPlatformEvent(db, {
          eventType: 'workflow.schedule_cursor', category: 'workflow', source: SOURCE,
          subjectType: 'workflow_trigger', subjectId: trigger.id, actorType: 'cron',
          tenantId: workflow.tenant_id ?? null, idempotencyKey: cursorKey, dispatch: false,
          payload: { ...value, proof: sign(secret, 'cursor', value) },
        });
        if (!inserted.id) throw new Error('WORKFLOW_SCHEDULE_CURSOR_WRITE_FAILED');
        const reloaded = await db.from('platform_events').select('id,payload').eq('id', inserted.id).single();
        if (reloaded.error || !reloaded.data) throw new Error('WORKFLOW_SCHEDULE_CURSOR_READ_FAILED');
        cursor = reloaded.data;
      }
      previous = Date.parse(cursor.payload?.observedThrough);
      const oldValue = cursorValue(trigger.id, cursor.payload?.definitionVersion, cursor.payload?.observedThrough);
      if (!validProof(cursor.payload?.proof, sign(secret, 'cursor', oldValue)) || !Number.isFinite(previous)) {
        throw new Error('WORKFLOW_SCHEDULE_CURSOR_AUTHORITY_INVALID');
      }
      // An edited/re-enabled saved definition starts a new observation window.
      if (cursor.payload.definitionVersion !== version) previous = nowMinute - MINUTE;
      if (previous > nowMinute) throw new Error('WORKFLOW_SCHEDULE_CURSOR_IN_FUTURE');
      const truncated = previous < nowMinute - MAX_LOOKBACK;
      const lowerBound = Math.max(previous, nowMinute - MAX_LOOKBACK);
      let latest: number | null = null;
      let due = 0;
      for (let time = nowMinute; time > lowerBound; time -= MINUTE) {
        if (matches(new Date(time))) { latest ??= time; due++; }
      }
      if (latest !== null) {
        const scheduledFor = new Date(latest).toISOString();
        const value = occurrenceValue(trigger.id, trigger.workflow_id, workflow.tenant_id ?? null, version, scheduledFor);
        const queued = await emitPlatformEvent(db, {
          eventType: SCHEDULE_DUE_EVENT, category: 'workflow', source: SOURCE,
          subjectType: 'workflow_trigger', subjectId: trigger.id, actorType: 'cron',
          tenantId: workflow.tenant_id ?? null,
          idempotencyKey: `workflow:schedule:${trigger.id}:${scheduledFor}`,
          payload: { ...value, proof: sign(secret, 'occurrence', value) },
        });
        if (!queued.id) throw new Error('WORKFLOW_SCHEDULE_EVENT_WRITE_FAILED');
        if (queued.duplicate) result.duplicates++; else result.queued++;
      }
      const value = cursorValue(trigger.id, version, observedThrough);
      const updated = await db.from('platform_events')
        .update({ payload: { ...value, proof: sign(secret, 'cursor', value) } })
        .eq('id', cursor.id).eq('payload->>proof', cursor.payload.proof);
      if (updated.error) throw updated.error;
      result.observed++;
      result.coalesced += Math.max(0, due - 1);
      if (truncated) result.truncated++;
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : '';
      result.failed++;
      result.failures.push({ triggerId: trigger.id, code: /^WORKFLOW_|^UNSUPPORTED_WORKFLOW_|^INVALID_WORKFLOW_/.test(message) ? message : 'WORKFLOW_SCHEDULE_STORAGE_FAILED' });
    }
  }
  return result;
}

/** Consume only a server-signed occurrence of an existing active definition. */
export async function executeScheduledWorkflowEvent(db: any, event: any, secret = process.env.CRON_SECRET) {
  requireSecret(secret);
  const payload = event.payload ?? {};
  const value = occurrenceValue(payload.triggerId, payload.workflowId, event.tenant_id ?? null, payload.definitionVersion, payload.scheduledFor);
  const scheduledAt = Date.parse(payload.scheduledFor);
  if (event.event_type !== SCHEDULE_DUE_EVENT || event.source !== SOURCE || event.actor_type !== 'cron'
    || event.subject_type !== 'workflow_trigger' || event.subject_id !== payload.triggerId
    || event.idempotency_key !== `workflow:schedule:${payload.triggerId}:${payload.scheduledFor}`
    || !Number.isFinite(scheduledAt) || scheduledAt > Date.now() || scheduledAt % MINUTE !== 0
    || !validProof(payload.proof, sign(secret, 'occurrence', value))) {
    throw new Error('WORKFLOW_SCHEDULE_EVENT_AUTHORITY_INVALID');
  }
  const { data: trigger, error: triggerError } = await db.from('workflow_triggers')
    .select('id,workflow_id,trigger_type,enabled,cron_expr,created_at,updated_at').eq('id', payload.triggerId).maybeSingle();
  if (triggerError) throw triggerError;
  if (!trigger || !trigger.enabled || trigger.trigger_type !== 'schedule') return 0;
  const { data: workflow, error: workflowError } = await db.from('workflows')
    .select('id,status,tenant_id,created_at,updated_at').eq('id', trigger.workflow_id).maybeSingle();
  if (workflowError) throw workflowError;
  if (!workflow || workflow.status !== 'active') return 0;
  if (trigger.workflow_id !== payload.workflowId || (workflow.tenant_id ?? null) !== (event.tenant_id ?? null)) {
    throw new Error('WORKFLOW_SCHEDULE_TARGET_MISMATCH');
  }
  if (definitionVersion(trigger, workflow) !== payload.definitionVersion) return 0;
  if (!parseWorkflowCron(trigger.cron_expr)(new Date(scheduledAt))) throw new Error('WORKFLOW_SCHEDULE_OCCURRENCE_NOT_DUE');
  const existing = await db.from('workflow_runs').select('id,status')
    .eq('platform_event_id', event.id).eq('workflow_id', workflow.id).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.status === 'success') return 0;
  if (existing.data) throw new Error('WORKFLOW_SCHEDULE_PRIOR_RUN_REQUIRES_REVIEW');
  const run = await executeWorkflow(workflow.id, 'schedule', {
    scheduled_for: payload.scheduledFor,
    schedule_trigger_id: trigger.id,
  }, trigger.id, event.id, workflow.tenant_id ?? undefined, undefined, { platformEventId: event.id });
  if (run.status !== 'success' || !run.runId) throw new Error('WORKFLOW_SCHEDULE_EXECUTION_FAILED');
  const verified = await db.from('workflow_runs').select('id,status')
    .eq('id', run.runId).eq('platform_event_id', event.id).eq('workflow_id', workflow.id).maybeSingle();
  if (verified.error || verified.data?.status !== 'success') throw new Error('WORKFLOW_SCHEDULE_RESULT_NOT_PERSISTED');
  return 1;
}
