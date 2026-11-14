import 'server-only';

import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export type PlatformUsageMetric =
  | 'gpu_video_seconds'
  | 'gpu_render_seconds'
  | 'gpu_output_bytes'
  | 'video_generation_attempt';

export interface RecordPlatformUsageInput {
  tenantId?: string | null;
  actorId?: string | null;
  source: string;
  metric: PlatformUsageMetric;
  quantity: number;
  unit: string;
  idempotencyKey: string;
  externalRef?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

/**
 * Durable tenant usage ledger. Billing/credit calculations should derive from
 * this append-only/idempotent record rather than from transient worker logs.
 * Missing tenant IDs are intentionally ignored for platform-owned legacy jobs.
 */
export async function recordPlatformUsage(
  db: SupabaseClient,
  input: RecordPlatformUsageInput,
): Promise<void> {
  if (!input.tenantId) return;
  if (!Number.isFinite(input.quantity) || input.quantity < 0) {
    throw new Error(`Invalid usage quantity for ${input.metric}`);
  }

  const { error } = await db.rpc('record_platform_usage_v1', {
    p_tenant_id: input.tenantId,
    p_source: input.source,
    p_metric: input.metric,
    p_quantity: input.quantity,
    p_unit: input.unit,
    p_idempotency_key: input.idempotencyKey,
    p_external_ref: input.externalRef ?? null,
    p_actor_id: input.actorId ?? null,
    p_metadata: input.metadata ?? {},
    p_occurred_at: input.occurredAt ?? new Date().toISOString(),
  });

  if (error) {
    logger.error('[usage-metering] Failed to persist usage event', error, {
      tenantId: input.tenantId,
      metric: input.metric,
      externalRef: input.externalRef,
    });
    throw error;
  }
}
