import 'server-only';
import crypto from 'node:crypto';
import type { SupabaseClient } from '@/lib/supabase';

export type PaidInferenceDecision = 'approved'|'approval_required'|'budget_exceeded'|'duplicate'|'cache_hit'|'paused'|'retry_exhausted'|'provider_unavailable'|'insufficient_balance'|'invalid_request';

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

export function paidArtifactFingerprint(input: Record<string, unknown>): string {
  const stable = JSON.stringify(canonicalize(input));
  return crypto.createHash('sha256').update(stable).digest('hex');
}

export async function reservePaidInference(db: SupabaseClient, input: {
  scopeKey: string; tenantId?: string|null; actorId?: string|null; courseId?: string|null; lessonId?: string|null;
  runId?: string|null; jobId?: string|null; artifactFingerprint: string;
  idempotencyKey: string; provider: string; model: string; operation: string;
  projectedCostMicros: number;
}): Promise<{decision: PaidInferenceDecision; requestId: string|null}> {
  const { data, error } = await db.rpc('reserve_paid_inference_v1' as never, {
    p_scope_key: input.scopeKey, p_tenant_id: input.tenantId ?? null, p_actor_id: input.actorId ?? null,
    p_course_id: input.courseId ?? null, p_lesson_id: input.lessonId ?? null,
    p_run_id: input.runId ?? null, p_job_id: input.jobId ?? null,
    p_artifact_fingerprint: input.artifactFingerprint,
    p_idempotency_key: input.idempotencyKey, p_provider: input.provider,
    p_model: input.model, p_operation: input.operation,
    p_projected_cost_micros: input.projectedCostMicros,
  } as never);
  if (error) throw new Error(`Paid inference authorization unavailable: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') throw new Error('Paid inference authorization unavailable');
  const result = row as {decision: PaidInferenceDecision; request_id: string|null};
  if (result.decision === 'duplicate' && result.request_id) {
    const { data: existing, error: existingError } = await db
      .from('paid_inference_requests')
      .select('status')
      .eq('id', result.request_id)
      .eq('scope_key', input.scopeKey)
      .maybeSingle();
    if (existingError) {
      throw new Error(`Paid inference authorization reconciliation failed: ${existingError.message}`);
    }
    if ((existing as { status?: string } | null)?.status === 'approved') {
      return { decision: 'approved', requestId: result.request_id };
    }
  }
  return { decision: result.decision, requestId: result.request_id };
}

export async function approvePaidInference(
  db: SupabaseClient,
  requestId: string,
  approvedBy: string,
): Promise<boolean> {
  const { data, error } = await db.rpc('approve_paid_inference_v1' as never, {
    p_request_id: requestId,
    p_approved_by: approvedBy,
  } as never);
  if (error) throw new Error(`Paid inference approval failed: ${error.message}`);
  return data === true;
}

async function claimPaidInferenceDispatch(
  db: SupabaseClient,
  requestId: string,
): Promise<void> {
  const { data, error } = await db.rpc('claim_paid_inference_dispatch_v1' as never, {
    p_request_id: requestId,
  } as never);
  if (error || data !== true) {
    throw new Error(`Paid inference dispatch claim failed${error ? `: ${error.message}` : ''}`);
  }
}

async function finishPaidInference(
  db: SupabaseClient,
  requestId: string,
  status: 'completed' | 'failed' | 'uncertain',
  latencyMs: number,
  details: {
    actualCostMicros?: number | null;
    providerRequestId?: string | null;
    errorCategory?: string | null;
    errorMessage?: string | null;
    resultLocation?: string | null;
  } = {},
): Promise<void> {
  const { data, error } = await db.rpc('finish_paid_inference_v1' as never, {
    p_request_id: requestId,
    p_status: status,
    p_latency_ms: Math.max(0, Math.round(latencyMs)),
    p_actual_cost_micros: details.actualCostMicros ?? null,
    p_provider_request_id: details.providerRequestId ?? null,
    p_error_category: details.errorCategory ?? null,
    p_error_message: details.errorMessage ?? null,
    p_result_location: details.resultLocation ?? null,
  } as never);
  if (error || data !== true) {
    throw new Error(`Paid inference completion reconciliation failed${error ? `: ${error.message}` : ''}`);
  }
}

export async function executePaidInference<T>(input: {
  db: SupabaseClient;
  authorize: () => Promise<{decision: PaidInferenceDecision; requestId: string|null}>;
  dispatch: (requestId: string) => Promise<T>;
}): Promise<{decision: PaidInferenceDecision; requestId?: string; value?: T}> {
  const authorization = await input.authorize();
  if (authorization.decision !== 'approved' || !authorization.requestId) {
    return {decision: authorization.decision};
  }

  const requestId = authorization.requestId;
  await claimPaidInferenceDispatch(input.db, requestId);
  const startedAt = Date.now();
  try {
    const value = await input.dispatch(requestId);
    await finishPaidInference(input.db, requestId, 'completed', Date.now() - startedAt);
    return {decision: 'approved', requestId, value};
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    await finishPaidInference(input.db, requestId, 'failed', Date.now() - startedAt, {
      errorCategory: 'provider',
      errorMessage: message,
    }).catch(() => undefined);
    throw new Error(
      `Paid inference dispatch failed after ${Date.now() - startedAt}ms: ${message}`,
      { cause },
    );
  }
}
