import { logger } from '@/lib/logger';
import { createClient } from "@/lib/supabase/server";

export type AuditAction = {
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Simple audit log wrapper for admin safeguard actions.
 * For more comprehensive logging, use logAuditEvent from audit-logger.ts
 */
export async function logAction(actor_id: string, actor_role: string, payload: AuditAction) {
  const supabase = await createClient();

  const { error } = await supabase.from("audit_logs").insert({
    user_id: actor_id,
    action: payload.action,
    resource_type: payload.entity_type ?? null,
    resource_id: payload.entity_id ?? null,
    details: {
      ...payload.metadata,
      actor_role,
    },
    success: true,
    created_at: new Date().toISOString(),
  });

  if (error) {
    logger.error("audit log insert failed", error);
  }
}
