import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export function newTraceId(): string {
  return randomUUID();
}

export interface DevAuditParams {
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  traceId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export async function writeDevAuditLog(db: SupabaseClient, params: DevAuditParams): Promise<void> {
  const row = {
    actor_id: params.actorId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId ?? null,
    trace_id: params.traceId ?? null,
    ip_address: params.ipAddress ?? null,
    metadata: params.metadata ?? {},
  };

  const { error } = await db.from('dev_audit_logs').insert(row);
  if (error) {
    logger.warn('[dev-studio/os] dev_audit_logs insert failed', { error: error.message, row });
  }
}
