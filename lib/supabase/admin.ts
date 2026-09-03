import { timedFetch } from '@/lib/supabase/timed-fetch';
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
 * `getAdminClient()` calls `hydrateProcessEnv()` only when credentials are
 * absent. Trusted CLI/build workers with preloaded credentials do not import
 * the Next-only secrets hydrator.
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
  // Next.js sets NEXT_RUNTIME in request/serverless contexts. If the service
  // key is absent there, request-time callers must use getAdminClient() so the
  // secret store can hydrate before the client is created.
  if (process.env.NEXT_RUNTIME && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'createAdminClient() called before env hydration in a Next.js runtime context. ' +
        'Use getAdminClient() instead — it hydrates secrets when required.',
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('MISSING_ENV: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is not set');
  }
  if (!key) {
    throw new Error('MISSING_ENV: SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: { fetch: timedFetch },
  });
}

/**
 * Async version of createAdminClient that hydrates secrets only when the
 * process does not already have a service-role credential.
 *
 * This distinction is intentional:
 * - Next request runtimes may start before secret hydration and therefore need
 *   `hydrateProcessEnv()`.
 * - trusted server/CLI/CI workers receive credentials before process startup;
 *   importing the Next-only secret hydrator there is both unnecessary and can
 *   trip the `server-only` package guard.
 *
 * Returns null if SUPABASE_SERVICE_ROLE_KEY remains absent. Use
 * `requireAdminClient()` when null is not acceptable.
 */
export async function getAdminClient(): Promise<SupabaseClient<any> | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { hydrateProcessEnv } = await import('@/lib/secrets');
      await hydrateProcessEnv();
    } catch {
      // Secrets hydration unavailable (build-time prerender, local tooling).
    }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/**
 * Like getAdminClient() but throws if the service role key is absent.
 */
export async function requireAdminClient(): Promise<SupabaseClient<any>> {
  const client = await getAdminClient();
  if (!client) {
    throw new Error(
      'requireAdminClient(): SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'Ensure secrets are configured in the environment.',
    );
  }
  return client;
}

/**
 * Create an admin client with audit context pre-set.
 * The audit trigger will read these session variables to attribute the write.
 */
export async function createAuditedAdminClient(ctx: {
  actorUserId?: string | null;
  systemActor?: string | null;
  requestId?: string | null;
}): Promise<SupabaseClient<any>> {
  const client = await requireAdminClient();

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
