import { auditLog } from '@/lib/logging/auditLog';

export type AuditAction = {
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Compatibility adapter for the remaining case-manager safeguard callers.
 *
 * Canonical replacement: @/lib/logging/auditLog.
 * Removal condition: migrate the remaining logAction callers to auditLog directly.
 */
export async function logAction(actor_id: string, actor_role: string, payload: AuditAction) {
  return auditLog({
    actorId: actor_id,
    actorRole: actor_role,
    action: payload.action,
    entity: payload.entity_type ?? 'unknown',
    entityId: payload.entity_id,
    metadata: payload.metadata,
  });
}
