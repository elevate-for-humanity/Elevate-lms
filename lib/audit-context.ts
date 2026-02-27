/**
 * Audit context propagation for service-role writes.
 *
 * When using the service role key (bypassing RLS), auth.uid() is NULL.
 * This module sets PostgreSQL session variables so the database audit
 * trigger can attribute the write to a specific actor.
 *
 * Usage:
 *   const db = createAdminClient();
 *   await setAuditContext(db, { actorUserId: user.id, systemActor: 'admin_api' });
 *   await db.from('profiles').update({ role: 'admin' }).eq('id', targetId);
 *   // The audit trigger now knows who did this.
 *
 * For background jobs / webhooks without a user session:
 *   await setAuditContext(db, { systemActor: 'stripe_webhook', requestId: event.id });
 */
import { logger } from '@/lib/logger';

interface AuditContext {
  actorUserId?: string | null;
  systemActor?: string | null;
  requestId?: string | null;
}

/**
 * Set audit context on a Supabase client connection.
 * Uses the set_audit_context RPC which calls SET LOCAL (transaction-scoped).
 * Never throws.
 */
export async function setAuditContext(
  db: { rpc: (fn: string, params: Record<string, unknown>) => Promise<{ error: unknown }> },
  ctx: AuditContext
): Promise<void> {
  try {
    const { error } = await db.rpc('set_audit_context', {
      actor_user_id: ctx.actorUserId ?? null,
      system_actor: ctx.systemActor ?? null,
      request_id: ctx.requestId ?? null,
    });
    if (error) {
      logger.error('setAuditContext RPC failed', error as Error, { ctx });
    }
  } catch (e) {
    // Non-fatal: audit context is best-effort
    logger.error('setAuditContext exception', e as Error, { ctx });
  }
}

/**
 * Generate a request ID for audit correlation.
 * Use this at the top of API routes / server actions.
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
