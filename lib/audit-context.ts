/**
 * Audit context for request tracing.
 * Used by webhook handlers and API routes to track audit events.
 */

interface AuditContext {
  actorId?: string;
  actorUserId?: string;
  systemActor?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

const contextHolder: AuditContext = {};

export async function setAuditContext(
  _supabase: unknown,
  context: AuditContext
): Promise<void> {
  contextHolder.actorId = context.actorId;
  contextHolder.actorUserId = context.actorUserId;
  contextHolder.systemActor = context.systemActor;
  contextHolder.requestId = context.requestId;
  contextHolder.metadata = context.metadata;
}

export function getAuditContext(): AuditContext {
  return { ...contextHolder };
}

export function clearAuditContext(): void {
  contextHolder.actorId = undefined;
  contextHolder.actorUserId = undefined;
  contextHolder.systemActor = undefined;
  contextHolder.requestId = undefined;
  contextHolder.metadata = undefined;
}
