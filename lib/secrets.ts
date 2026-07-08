import { logger } from '@/lib/logger';
/**
 * Runtime secrets fetched from Supabase and merged into process.env.
 *
 * Cold-start note: ECS injects each SSM secret as a sequential API call at
 * container boot. With 195 secrets that is 10–20 seconds of startup latency.
 * hydrateProcessEnv() is called per-request (cached 5 min) so it does NOT
 * add per-request latency after the first call — but the first request after
 * a cold start pays the full cost. The ECS secret count should be reduced to
 * only the secrets the container actually needs at boot (STRIPE_SECRET_KEY,
 * SUPABASE_SERVICE_ROLE_KEY, etc.). All other secrets can be loaded lazily
 * via hydrateProcessEnv() from the DB.
 *
 * Architecture (AWS ECS / Fargate):
 *   - Primary source: AWS SSM Parameter Store — injected into the ECS task
 *     environment at container start via the task definition `secrets` array.
 *     All 190+ vars are available as process.env.* at boot with no size limit.
 *   - Secondary source: `platform_secrets` table — keys saved via Admin → Dev
 *     Studio → Secrets tab. These override SSM values so admins can rotate
 *     API keys without a redeploy.
 *   - Tertiary source: `app_secrets` table — legacy runtime scope, kept for
 *     backward compatibility.
 *
 * Precedence (highest → lowest):
 *   1. platform_secrets (admin UI rotation — takes effect immediately)
 *   2. app_secrets (legacy runtime scope)
 *   3. process.env (ECS task definition / SSM injection)
 *
 * Usage — explicit fetch:
 *   import { getSecret } from '@/lib/secrets';
 *   const key = await getSecret('STRIPE_SECRET_KEY');
 *
 * Usage — hydrate process.env (call once per request in API routes):
 *   import { hydrateProcessEnv } from '@/lib/secrets';
 *   await hydrateProcessEnv();
 */

// Direct SDK import intentional: this module IS the hydration bootstrap.
// All other files must use @/lib/supabase/* instead.
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cache: Record<string, string> | null = null;
let cacheTimestamp = 0;
let hydrated = false;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — in-process cache for ECS long-running container

// Abort app_secrets fetch if Supabase doesn't respond within this window.
// Without a timeout, a container with no service role key can hang on startup.
const SECRETS_FETCH_TIMEOUT_MS = 3000;

function getBootstrapClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      // Per-request AbortSignal timeout — prevents indefinite hangs on cold starts.
      fetch: (input, init) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), SECRETS_FETCH_TIMEOUT_MS);
        return fetch(input, { ...init, signal: controller.signal }).finally(() =>
          clearTimeout(timer),
        );
      },
    },
  });
}

async function loadSecrets(): Promise<Record<string, string>> {
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cache;
  }

  const client = getBootstrapClient();
  if (!client) {
    // SUPABASE_SERVICE_ROLE_KEY absent — local dev without .env.local.
    // Fall through to process.env (SSM vars already injected by ECS task definition).
    return {};
  }

  const secrets: Record<string, string> = {};

  // 1. Load from app_secrets (runtime scope) — legacy/bootstrap secrets
  try {
    const result = await client.from('app_secrets').select('key, value').eq('scope', 'runtime');
    if (!result.error) {
      for (const row of result.data ?? []) {
        // Skip blank values — they must not shadow SSM-injected env vars
        if (row.key && row.value && row.value.trim().length > 0) secrets[row.key] = row.value;
      }
    } else {
      logger.error('Failed to load from app_secrets', result.error);
    }
  } catch (e) {
    logger.error('Failed to load from app_secrets', e instanceof Error ? e : undefined);
  }

  // 2. Load from platform_secrets — keys saved via admin Secrets tab.
  //    These take precedence over app_secrets so admins can rotate without a deploy.
  try {
    const result = await client.from('platform_secrets').select('key, value_enc');
    if (!result.error) {
      for (const row of result.data ?? []) {
        // Skip blank values — they must not shadow SSM-injected env vars
        if (row.key && row.value_enc && row.value_enc.trim().length > 0) secrets[row.key] = row.value_enc;
      }
    } else {
      logger.error('Failed to load from platform_secrets', result.error);
    }
  } catch (e) {
    logger.error('Failed to load from platform_secrets', e instanceof Error ? e : undefined);
  }

  cache = secrets;
  cacheTimestamp = Date.now();
  return secrets;
}

/**
 * Merge all runtime secrets into process.env.
 *
 * Precedence (highest → lowest):
 *   1. platform_secrets (admin UI) — always wins, enables key rotation without redeploy
 *   2. app_secrets (legacy runtime scope)
 *   3. process.env (ECS task definition / build-time vars)
 *
 * Previously process.env took precedence, which meant keys set via the admin
 * Integrations UI were silently ignored whenever a stale or empty value existed
 * in the task definition environment.
 */
export async function hydrateProcessEnv(): Promise<void> {
  if (hydrated && Date.now() - cacheTimestamp < CACHE_TTL_MS) return;

  const secrets = await loadSecrets();
  for (const [key, value] of Object.entries(secrets)) {
    // Only write to process.env when the DB value is non-empty.
    // An empty string in platform_secrets / app_secrets must NOT overwrite a
    // valid SSM value that was injected by the ECS task definition at boot.
    // This was the root cause of chat/git/shell failures: a blank row saved via
    // the admin Secrets UI would silently shadow the correct SSM value.
    if (value && value.trim().length > 0) {
      process.env[key] = value;
    }
  }
  hydrated = true;
}

/** Get a single secret. Falls back to process.env. */
export async function getSecret(key: string): Promise<string | undefined> {
  const secrets = await loadSecrets();
  return secrets[key] ?? process.env[key];
}

/** Get multiple secrets. Falls back to process.env per key. */
export async function getSecrets<K extends string>(
  keys: K[],
): Promise<Record<K, string | undefined>> {
  const secrets = await loadSecrets();
  const result = {} as Record<K, string | undefined>;
  for (const key of keys) {
    result[key] = secrets[key] ?? process.env[key];
  }
  return result;
}

/** Synchronous read from cache. Only works after hydrate/getSecret has run. */
export function getCachedSecret(key: string): string | undefined {
  return cache?.[key] ?? process.env[key];
}

/** Force-refresh (e.g., after rotating a secret via admin UI). */
export async function refreshSecrets(): Promise<void> {
  cache = null;
  cacheTimestamp = 0;
  hydrated = false;
  await hydrateProcessEnv();
}
