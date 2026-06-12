/**
 * Workflow Engine — canonical execution path.
 *
 * Observability: structured logs on every step start/end/fail with run_id + duration_ms.
 * Self-healing: per-step retry (max 3, exponential backoff) + dead-letter on exhaustion.
 * Telemetry: workflow_step_logs row per step, workflow_runs updated throughout.
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { emitEvent } from '@/lib/platform/events';
import { sendEmail } from '@/lib/email/service';
import { aiChat } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';

export type RunStatus = 'success' | 'failed' | 'running' | 'cancelled';

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  action_type: string;
  action_config: Record<string, unknown>;
  condition_expr?: string | null;
  step_order: number;
  enabled: boolean;
}

const MAX_STEP_RETRIES = 3;
const RETRY_BASE_MS = 500;

interface RunContext {
  workflowId: string;
  runId: string;
  triggerPayload: Record<string, unknown>;
}

// ── Interpolation ─────────────────────────────────────────────────────────────

function interpolate(v: unknown, payload: Record<string, unknown>): unknown {
  if (typeof v === 'string') {
    return v.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path: string) => {
      const val = path.split('.').reduce<unknown>((o, k) =>
        o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined, payload);
      return val !== undefined ? String(val) : '';
    });
  }
  if (Array.isArray(v)) return v.map(item => interpolate(item, payload));
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, interpolate(val, payload)])
    );
  }
  return v;
}

function interpolateObj(obj: Record<string, unknown>, payload: Record<string, unknown>): Record<string, unknown> {
  return interpolate(obj, payload) as Record<string, unknown>;
}

// ── Step executors ────────────────────────────────────────────────────────────

async function execSendNotification(config: Record<string, unknown>, ctx: RunContext) {
  const db = await requireAdminClient();
  const r = interpolateObj(config, ctx.triggerPayload);
  const { error } = await db.from('notifications').insert({
    user_id: r.user_id ?? null,
    title: r.title ?? 'Workflow Notification',
    message: r.body ?? r.message ?? '',
    type: r.type ?? 'info',
    metadata: { workflow_id: ctx.workflowId, run_id: ctx.runId },
  });
  if (error) return { ok: false, output: { error: error.message } };
  return { ok: true, output: { inserted: true } };
}

async function execEmitEvent(config: Record<string, unknown>, ctx: RunContext) {
  const r = interpolateObj(config, ctx.triggerPayload);
  await emitEvent(
    (r.event_type as string) ?? 'workflow.action',
    (r.category as any) ?? 'system',
    {
      severity: (r.severity as any) ?? 'info',
      actor_type: 'system',
      subject_id: ctx.runId,
      subject_type: 'workflow_run',
      payload: { workflow_id: ctx.workflowId, ...ctx.triggerPayload },
      message: (r.message as string) ?? undefined,
    },
  );
  return { ok: true, output: { emitted: r.event_type } };
}

async function execWebhookCall(config: Record<string, unknown>, ctx: RunContext) {
  const r = interpolateObj(config, ctx.triggerPayload);
  const url = r.url as string;
  if (!url) return { ok: false, output: { error: 'webhook_call requires url' } };
  try {
    const method = (r.method as string) ?? 'POST';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (r.secret_header) {
      const [hKey, hVal] = String(r.secret_header).split(':').map((s: string) => s.trim());
      if (hKey && hVal) headers[hKey] = hVal;
    }
    const res = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' ? JSON.stringify(r.body ?? {}) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    return { ok: res.ok, output: { status: res.status, url } };
  } catch (err: unknown) {
    return { ok: false, output: { error: err instanceof Error ? err.message : String(err) } };
  }
}

async function execSendEmail(config: Record<string, unknown>, ctx: RunContext) {
  const r = interpolateObj(config, ctx.triggerPayload);
  const to = r.to as string | string[] | undefined;
  const subject = r.subject as string | undefined;
  if (!to || !subject) return { ok: false, output: { error: 'send_email requires to and subject' } };
  try {
    await sendEmail({ to, subject, html: (r.html as string) ?? subject });
    return { ok: true, output: { to, subject } };
  } catch (err: unknown) {
    return { ok: false, output: { error: err instanceof Error ? err.message : String(err) } };
  }
}

function execCondition(config: Record<string, unknown>, conditionExpr: string | null, ctx: RunContext) {
  const expr = (config.condition_expr as string | undefined) ?? conditionExpr;
  if (!expr) return { ok: true, output: { condition: 'passed', reason: 'no_expression' } };
  const match = expr.trim().match(/^([\w.]+)\s*(==|!=|>=|<=|>|<|contains|exists)\s*(.*)$/);
  if (!match) return { ok: true, output: { condition: 'passed', reason: 'unparseable' } };
  const [, path, op, rawExpected] = match;
  const expected = rawExpected.trim().replace(/^["']|["']$/g, '');
  const actual = path.split('.').reduce<unknown>((obj, key) =>
    obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined,
    ctx.triggerPayload as unknown);
  const actualStr = String(actual ?? '');
  const actualNum = parseFloat(actualStr);
  const expectedNum = parseFloat(expected);
  let passed: boolean;
  switch (op) {
    case '==':       passed = actualStr === expected; break;
    case '!=':       passed = actualStr !== expected; break;
    case '>':        passed = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum > expectedNum; break;
    case '<':        passed = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum < expectedNum; break;
    case '>=':       passed = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum >= expectedNum; break;
    case '<=':       passed = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum <= expectedNum; break;
    case 'contains': passed = actualStr.includes(expected); break;
    case 'exists':   passed = actual !== undefined && actual !== null && actual !== ''; break;
    default:         passed = true;
  }
  return { ok: passed, output: { condition: passed ? 'passed' : 'failed', expr, actual: actualStr, expected } };
}

async function execCreateRecord(config: Record<string, unknown>, ctx: RunContext) {
  const table = config.table as string | undefined;
  const values = config.values as Record<string, unknown> | string | undefined;
  if (!table || !values) return { ok: false, output: { error: 'create_record requires table and values' } };
  let parsed: Record<string, unknown>;
  try { parsed = typeof values === 'string' ? JSON.parse(values) : values; }
  catch { return { ok: false, output: { error: 'create_record values must be valid JSON' } }; }
  const db = await requireAdminClient();
  const { data, error } = await db.from(table).insert(interpolateObj(parsed, ctx.triggerPayload)).select().maybeSingle();
  if (error) return { ok: false, output: { error: error.message } };
  return { ok: true, output: { created: data } };
}

async function execUpdateRecord(config: Record<string, unknown>, ctx: RunContext) {
  const table = config.table as string | undefined;
  const matchRaw = config.match as Record<string, unknown> | string | undefined;
  const valuesRaw = config.values as Record<string, unknown> | string | undefined;
  if (!table || !matchRaw || !valuesRaw) return { ok: false, output: { error: 'update_record requires table, match, and values' } };
  let matchObj: Record<string, unknown>;
  let valuesObj: Record<string, unknown>;
  try {
    matchObj = typeof matchRaw === 'string' ? JSON.parse(matchRaw) : matchRaw;
    valuesObj = typeof valuesRaw === 'string' ? JSON.parse(valuesRaw) : valuesRaw;
  } catch { return { ok: false, output: { error: 'update_record match/values must be valid JSON' } }; }
  const db = await requireAdminClient();
  const { error } = await db.from(table).update(interpolateObj(valuesObj, ctx.triggerPayload)).match(interpolateObj(matchObj, ctx.triggerPayload));
  if (error) return { ok: false, output: { error: error.message } };
  return { ok: true, output: { updated: true } };
}

async function execAiAction(config: Record<string, unknown>, ctx: RunContext) {
  const prompt = config.prompt as string | undefined;
  if (!prompt) return { ok: false, output: { error: 'ai_action requires prompt' } };
  const resolvedPrompt = String(interpolate(prompt, ctx.triggerPayload));
  logger.info('[workflow/ai_action] calling aiChat', { run_id: ctx.runId, prompt_length: resolvedPrompt.length });
  try {
    const response = await aiChat([
      { role: 'system', content: 'You are an operational AI assistant for Elevate for Humanity. Respond concisely and factually.' },
      { role: 'user', content: resolvedPrompt },
    ]);
    const persistTable = config.persist_table as string | undefined;
    const persistMatch = config.persist_match as Record<string, unknown> | string | undefined;
    const persistField = config.persist_field as string | undefined;
    if (persistTable && persistMatch && persistField && response) {
      const db = await requireAdminClient();
      let matchObj: Record<string, unknown>;
      try { matchObj = typeof persistMatch === 'string' ? JSON.parse(persistMatch) : persistMatch; }
      catch { matchObj = {}; }
      await db.from(persistTable).update({ [persistField]: response }).match(interpolateObj(matchObj, ctx.triggerPayload))
        .then(undefined, (err) => logger.warn('[workflow/ai_action] persist failed', { run_id: ctx.runId, error: String(err) }));
    }
    return { ok: true, output: { response } };
  } catch (err: unknown) {
    return { ok: false, output: { error: err instanceof Error ? err.message : String(err) } };
  }
}

async function execStep(step: WorkflowStep, ctx: RunContext): Promise<{ ok: boolean; output: Record<string, unknown> }> {
  switch (step.action_type) {
    case 'send_notification': return execSendNotification(step.action_config, ctx);
    case 'emit_event':        return execEmitEvent(step.action_config, ctx);
    case 'webhook_call':      return execWebhookCall(step.action_config, ctx);
    case 'send_email':        return execSendEmail(step.action_config, ctx);
    case 'condition':         return execCondition(step.action_config, step.condition_expr ?? null, ctx);
    case 'create_record':     return execCreateRecord(step.action_config, ctx);
    case 'update_record':     return execUpdateRecord(step.action_config, ctx);
    case 'ai_action':         return execAiAction(step.action_config, ctx);
    default:
      logger.warn('[workflow/engine] unknown action_type', { action_type: step.action_type, run_id: ctx.runId });
      return { ok: false, output: { error: `Unsupported workflow action_type '${step.action_type}'` } };
  }
}

async function execStepWithRetry(
  step: WorkflowStep,
  ctx: RunContext,
  db: Awaited<ReturnType<typeof requireAdminClient>>,
): Promise<{ ok: boolean; output: Record<string, unknown>; attempts: number }> {
  let lastResult: { ok: boolean; output: Record<string, unknown> } = { ok: false, output: {} };
  let attempts = 0;
  for (let attempt = 1; attempt <= MAX_STEP_RETRIES; attempt++) {
    attempts = attempt;
    if (attempt > 1) {
      await new Promise(r => setTimeout(r, RETRY_BASE_MS * Math.pow(2, attempt - 2)));
      logger.info('[workflow/engine] retrying step', { run_id: ctx.runId, step_id: step.id, attempt });
    }
    lastResult = await execStep(step, ctx);
    if (lastResult.ok) return { ...lastResult, attempts };
  }
  // Dead-letter
  await Promise.resolve(
    db.from('workflow_dead_letters').insert({
      workflow_id: ctx.workflowId,
      run_id: ctx.runId,
      step_id: step.id,
      action_type: step.action_type,
      action_config: step.action_config,
      trigger_payload: ctx.triggerPayload,
      error: (lastResult.output.error as string) ?? 'Step failed after max retries',
      attempts,
      created_at: new Date().toISOString(),
    })
  ).catch((err: unknown) => logger.error('[workflow/engine] dead-letter write failed', { run_id: ctx.runId, error: String(err) }));
  logger.error('[workflow/engine] step exhausted retries → dead-letter', {
    run_id: ctx.runId, step_id: step.id, action_type: step.action_type, attempts,
  });
  return { ...lastResult, attempts };
}

// ── Main executor ─────────────────────────────────────────────────────────────

export async function executeWorkflow(
  workflowId: string,
  triggeredBy: 'manual' | 'event' | 'schedule' | 'webhook',
  triggerPayload: Record<string, unknown> = {},
  triggerId?: string,
  traceId?: string,
  tenantId?: string,
): Promise<{ runId: string; status: RunStatus; stepsRun: number; error?: string }> {
  const runStart = Date.now();
  const db = await requireAdminClient();
  const trace = traceId ?? (triggerPayload['trace_id'] as string | undefined) ?? 'no-trace';

  logger.info('[WORKFLOW START]', { workflowId, triggeredBy, trigger_id: triggerId, trace_id: trace });

  const { data: steps, error: stepsErr } = await db
    .from('workflow_steps')
    .select('*')
    .eq('workflow_id', workflowId)
    .eq('enabled', true)
    .order('step_order', { ascending: true });

  if (stepsErr) {
    logger.error('[WORKFLOW FAILED] could not load steps', { workflowId, error: stepsErr.message, trace_id: trace });
    return { runId: '', status: 'failed', stepsRun: 0, error: stepsErr.message };
  }

  const { data: run, error: runErr } = await db
    .from('workflow_runs')
    .insert({
      workflow_id: workflowId,
      trigger_id: triggerId ?? null,
      status: 'running',
      triggered_by: triggeredBy,
      trigger_payload: { ...triggerPayload, trace_id: trace },
      steps_total: (steps ?? []).length,
      steps_done: 0,
      retry_count: 0,
      started_at: new Date().toISOString(),
      ...(tenantId ? { tenant_id: tenantId } : {}),
    })
    .select('id')
    .single();

  if (runErr || !run) {
    logger.error('[WORKFLOW FAILED] could not create run record', { workflowId, error: runErr?.message, trace_id: trace });
    return { runId: '', status: 'failed', stepsRun: 0, error: runErr?.message };
  }

  const runId = run.id;
  const ctx: RunContext = { workflowId, runId, triggerPayload: { ...triggerPayload, trace_id: trace } };
  let stepsDone = 0;
  let finalStatus: RunStatus = 'success';
  let errorMessage: string | undefined;

  for (const step of steps ?? []) {
    const stepStart = Date.now();
    logger.info('[workflow/engine] step start', {
      run_id: runId, step_id: step.id, step_order: step.step_order, action_type: step.action_type,
    });

    let stepStatus: RunStatus = 'success';
    let output: Record<string, unknown> = {};
    let stepError: string | undefined;
    let attempts = 1;

    try {
      const result = await execStepWithRetry(step as WorkflowStep, ctx, db);
      attempts = result.attempts;
      output = result.output;
      if (!result.ok) {
        stepStatus = 'failed';
        stepError = (result.output.error as string) ?? 'Step failed';
        finalStatus = 'failed';
        errorMessage = stepError;
      }
    } catch (err: unknown) {
      stepStatus = 'failed';
      stepError = err instanceof Error ? err.message : String(err);
      finalStatus = 'failed';
      errorMessage = stepError;
    }

    const stepDuration = Date.now() - stepStart;
    stepsDone++;

    logger.info(`[workflow/engine] step ${stepStatus}`, {
      run_id: runId, step_id: step.id, action_type: step.action_type,
      duration_ms: stepDuration, attempts, error: stepError,
    });

    await Promise.resolve(
      db.from('workflow_step_logs').insert({
        run_id: runId, step_id: step.id, step_order: step.step_order,
        action_type: step.action_type, status: stepStatus, output,
        error_message: stepError ?? null, duration_ms: stepDuration, attempts,
      })
    ).catch((e: unknown) => logger.warn('[workflow/engine] step log write failed', { run_id: runId, error: String(e) }));

    await Promise.resolve(
      db.from('workflow_runs').update({ steps_done: stepsDone }).eq('id', runId)
    ).catch((e: unknown) => logger.warn('[workflow/engine] progress update failed', { run_id: runId, error: String(e) }));

    if (finalStatus === 'failed') break;
  }

  const totalDuration = Date.now() - runStart;

  await db.from('workflow_runs').update({
    status: finalStatus,
    steps_done: stepsDone,
    completed_at: new Date().toISOString(),
    error_message: errorMessage ?? null,
    duration_ms: totalDuration,
  }).eq('id', runId);

  if (finalStatus === 'success') {
    logger.info('[WORKFLOW SUCCESS]', { workflowId, runId, stepsRun: stepsDone, duration_ms: totalDuration, trace_id: trace });
  } else {
    logger.error('[WORKFLOW FAILED]', { workflowId, runId, stepsRun: stepsDone, duration_ms: totalDuration, error: errorMessage, trace_id: trace });
  }

  return { runId, status: finalStatus, stepsRun: stepsDone, error: errorMessage };
}
