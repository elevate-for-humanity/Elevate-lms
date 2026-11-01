import { logger } from '@/lib/logger';

export type FailureDisposition = {
  category: 'billing' | 'credentials' | 'source' | 'quality' | 'approval' | 'transient' | 'unknown';
  recovery: 'existing_retry_policy' | 'attention_required';
  nextAction: string;
};

/** Classify every failure; classification never authorizes replaying a mutation. */
export function classifyParisFailure(error: unknown): FailureDisposition {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/billing|\bcredits?\b|payment required|insufficient_quota|HTTP.?402/i.test(message))
    return { category: 'billing', recovery: 'attention_required', nextAction: 'Verify billing and remaining funds before resuming paid work.' };
  if (/401|403|credential|unauthori[sz]|forbidden|api.?key|permission|bad credentials|token rejected|resource not accessible by personal access token/i.test(message))
    return { category: 'credentials', recovery: 'attention_required', nextAction: 'Verify the affected service credential or permission; preserve saved progress.' };
  if (/licens|missing.source|dependencies.unresolved|source.required|AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED/i.test(message))
    return { category: 'source', recovery: 'attention_required', nextAction: 'Resolve the missing source or license through the saved workflow checkpoint.' };
  if (/quality|media.qa|frozen|assessment|validation/i.test(message))
    return { category: 'quality', recovery: 'attention_required', nextAction: 'Inspect the failed quality evidence and use the canonical checkpoint repair.' };
  if (/approval|owner.pause|confirmation/i.test(message))
    return { category: 'approval', recovery: 'attention_required', nextAction: 'Wait for the recorded owner approval or resume instruction.' };
  if (/timeout|timed.out|aborted due to timeout|ECONNRESET|fetch failed|429|\b5\d\d\b|circuit/i.test(message))
    return { category: 'transient', recovery: 'existing_retry_policy', nextAction: 'Use the existing bounded retry or lease recovery policy; never duplicate active work.' };
  return { category: 'unknown', recovery: 'attention_required', nextAction: 'Inspect the correlated execution logs and diagnose the failure before replaying work.' };
}

export function safeParisFailureSummary(error: unknown): {
  category: FailureDisposition['category'];
  message: string;
} {
  const disposition = classifyParisFailure(error);
  return {
    category: disposition.category,
    message: `PARIS execution failed (${disposition.category}). ${disposition.nextAction}`,
  };
}

export type ParisObservation = {
  operation: string;
  kind: 'inference' | 'command' | 'workflow';
  status: 'completed' | 'failed' | 'blocked' | 'approval_required' | 'running' | 'advisory';
  durationMs: number;
  actorId?: string;
  correlationId?: string | null;
  provider?: string;
  error?: unknown;
};

/** Durable, cross-process observations. Never store prompts, responses or secrets. */
export async function recordParisObservation(event: ParisObservation): Promise<void> {
  try {
    const { requireAdminClient } = await import('@/lib/supabase/admin');
    const db = await requireAdminClient();
    const failure = event.status === 'failed' || event.status === 'blocked' || event.status === 'approval_required'
      ? classifyParisFailure(event.error ?? event.status) : null;
    const { error } = await db.from('paris_runtime_events').insert({
      identity: 'PARIS', operation: event.operation.slice(0, 160), kind: event.kind,
      status: event.status, duration_ms: Math.max(0, Math.round(event.durationMs)),
      actor_id: event.actorId ?? null, correlation_id: event.correlationId?.slice(0, 160) ?? null,
      provider: event.provider?.slice(0, 80) ?? null,
      failure_category: failure?.category ?? null, recovery: failure?.recovery ?? null,
      next_action: failure?.nextAction ?? null,
    }).abortSignal(AbortSignal.timeout(2000));
    if (error) throw error;
  } catch {
    logger.warn('[PARIS] supervision persistence unavailable', { operation: event.operation, status: event.status });
  }
}
