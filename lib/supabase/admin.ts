import { logger } from '@/lib/logger';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createAdminClient(): SupabaseClient<any> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('[Supabase Admin] Missing credentials. Admin features disabled.');
    }
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create an admin client with audit context pre-set.
 * The audit trigger will read these session variables to attribute the write.
 *
 * Usage:
 *   const db = await createAuditedAdminClient({ actorUserId: user.id, systemActor: 'admin_api' });
 *   await db.from('profiles').update({ role: 'admin' }).eq('id', targetId);
 */
export async function createAuditedAdminClient(ctx: {
  actorUserId?: string | null;
  systemActor?: string | null;
  requestId?: string | null;
}): Promise<SupabaseClient<any> | null> {
  const client = createAdminClient();
  if (!client) return null;

  try {
    await client.rpc('set_audit_context', {
      actor_user_id: ctx.actorUserId ?? null,
      system_actor: ctx.systemActor ?? null,
      request_id: ctx.requestId ?? null,
    });
  } catch (e) {
    logger.error('createAuditedAdminClient: failed to set context', e as Error, { ctx });
  }

  return client;
}
