import 'server-only';
import { aiChat, getActiveProviderName } from '@/lib/ai/ai-service';
import { executePaidInference, paidArtifactFingerprint, reservePaidInference } from '@/lib/ai/paid-inference-gateway';
import type { ChatCompletionOptions, ChatCompletionResult } from '@/lib/ai/types';
import { hydrateProcessEnv } from '@/lib/secrets';
import type { SupabaseClient } from '@/lib/supabase';

export type CourseAuthoringChat = (options: ChatCompletionOptions, fingerprint?: string) => Promise<ChatCompletionResult>;

export class CourseAuthoringUnavailable extends Error {
  constructor(readonly status: number, readonly decision: string, readonly projectedCostMicros?: number) {
    super(status === 503 ? 'The configured course authoring provider is unavailable.' : 'Paid course authoring is not authorized.');
  }
}

export async function createCourseAuthoringChat(db: SupabaseClient, actorId: string, operation: string): Promise<CourseAuthoringChat> {
  await hydrateProcessEnv();
  const provider = getActiveProviderName();
  if (provider === 'none') throw new CourseAuthoringUnavailable(503, 'provider_unavailable');
  if (provider === 'elevate') {
    return (options) => aiChat({ ...options, model: undefined, providerPolicy: 'owned-only' });
  }
  const { data, error } = await db.from('profiles').select('tenant_id').eq('id', actorId).single();
  if (error || !data) throw new Error('Unable to verify the course authoring budget scope.');
  const tenantId = typeof data.tenant_id === 'string' ? data.tenant_id : null;
  const scopeKey = tenantId ? `tenant:${tenantId}` : 'platform';
  const projectedCostMicros = Math.max(0, Number(process.env.COURSE_DRAFT_MAX_COST_MICROS ?? '2000000'));

  return async (options, fingerprint) => {
    const model = provider === 'openai' ? options.model : undefined;
    const artifactFingerprint = fingerprint && provider === 'openai' ? fingerprint :
      paidArtifactFingerprint({ operation, provider, ...options, model });
    const result = await executePaidInference({
      db,
      authorize: () => reservePaidInference(db, {
        scopeKey, tenantId, actorId, operation, artifactFingerprint, provider, model: model ?? provider,
        idempotencyKey: `${operation}:${artifactFingerprint}`, projectedCostMicros,
      }),
      dispatch: () => aiChat({ ...options, model, provider, providerPolicy: 'canonical' }),
    });
    if (result.decision !== 'approved' || !result.value) {
      throw new CourseAuthoringUnavailable(result.decision === 'budget_exceeded' ? 402 : 409, result.decision, projectedCostMicros);
    }
    return result.value;
  };
}
