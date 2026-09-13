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
  tenantId: string; actorId?: string|null; courseId?: string|null; lessonId?: string|null;
  runId?: string|null; jobId?: string|null; artifactFingerprint: string;
  idempotencyKey: string; provider: string; model: string; operation: string;
  projectedCostMicros: number;
}): Promise<{decision: PaidInferenceDecision; requestId: string|null}> {
  const { data, error } = await db.rpc('reserve_paid_inference_v1' as never, {
    p_tenant_id: input.tenantId, p_actor_id: input.actorId ?? null,
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
  return { decision: result.decision, requestId: result.request_id };
}

export async function executePaidInference<T>(input: {
  authorize: () => Promise<{decision: PaidInferenceDecision; requestId: string|null}>;
  dispatch: (requestId: string) => Promise<T>;
}): Promise<{decision: PaidInferenceDecision; value?: T}> {
  const authorization = await input.authorize();
  if (authorization.decision !== 'approved' || !authorization.requestId) return {decision: authorization.decision};
  return {decision: 'approved', value: await input.dispatch(authorization.requestId)};
}
