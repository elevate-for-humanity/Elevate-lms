import { logger } from '@/lib/logger';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * @deprecated Use `getAdminClient()` instead in all request-time code
 * (server components, layouts, server actions, API routes).
 *
 * This function is synchronous and throws if SUPABASE_SERVICE_ROLE_KEY is not
 * yet hydrated — which happens on every cold serverless start. That causes a
 * 500 on the first request to any page that calls this directly.
 *
 * `getAdminClient()` calls `hydrateProcessEnv()` first and is safe on cold starts.
 *
 * The only valid remaining uses of `createAdminClient()` are:
 *   - `lib/` utilities called after hydration is guaranteed (e.g. from within getAdminClient itself)
 *   - `scripts/` and build-time tooling where env is pre-loaded
 *   - `instrumentation.ts` startup code
 *
 * Do NOT call this from `app/` — use `getAdminClient()` there.
 */
// SAFE: non-request-time context — scripts/ or internal admin.ts, hydration guaranteed by caller
export function createAdminClient(): SupabaseClient<any> {
  // ── Request-context guard ────────────────────────────────────────────────
  // Next.js sets NEXT_RUNTIME in all serverless function contexts.
  // If SUPABASE_SERVICE_ROLE_KEY is absent at call time, we are almost
  // certainly on a cold start before hydrateProcessEnv() has run.
  // Callers in app/ must use getAdminClient() instead.
  // Callers in lib/ that are invoked from request paths must also use
  // getAdminClient() — see the @deprecated notice above.
  //
  // We detect the likely-cold-start condition (NEXT_RUNTIME set but key
  // missing) and throw with an actionable message rather than letting the
  // Supabase client silently fail on the first query.
  if (
    process.env.NEXT_RUNTIME &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      // SAFE: non-request-time context — scripts/ or internal admin.ts, hydration guaranteed by caller
      'createAdminClient() called before env hydration in a Next.js runtime context. ' +
      'Use getAdminClient() instead — it calls hydrateProcessEnv() first.'
    );
  }
  // ────────────────────────────────────────────────────────────────────────

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
  // SAFE: non-request-time context — scripts/ or internal admin.ts, hydration guaranteed by caller
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
  // SAFE: non-request-time context — scripts/ or internal admin.ts, hydration guaranteed by caller
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
