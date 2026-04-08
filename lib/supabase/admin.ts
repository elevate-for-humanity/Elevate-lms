import { logger } from '@/lib/logger';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns a Supabase client authenticated with the service role key.
 *
 * Throws if either env var is missing — there is no anon fallback.
 * A missing service role key must be caught at startup, not silently
 * degraded to an RLS-blocked anon client that fails at query time.
 *
 * Call sites that previously handled `null` returns must be updated to
 * handle a thrown error instead.
 *
 * Note: SUPABASE_SERVICE_ROLE_KEY lives in Supabase app_secrets and is
 * loaded by hydrateProcessEnv() at startup (instrumentation.ts). If this
 * throws MISSING_ENV on cold start, ensure hydrateProcessEnv() ran first.
 * For routes that cannot guarantee startup order, use getAdminClient() instead.
 */
export function createAdminClient(): SupabaseClient<any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('MISSING_ENV: NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  if (!key) {
    throw new Error('MISSING_ENV: SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Async version of createAdminClient that hydrates secrets first.
 * Use this in API routes instead of createAdminClient() to guarantee
 * SUPABASE_SERVICE_ROLE_KEY is loaded even on cold starts.
 *
 * Usage:
 *   const db = await getAdminClient();
 */
export async function getAdminClient(): Promise<SupabaseClient<any>> {
  const { hydrateProcessEnv } = await import('@/lib/secrets');
  await hydrateProcessEnv();
  return createAdminClient();
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
}): Promise<SupabaseClient<any>> {
  const client = createAdminClient();

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
