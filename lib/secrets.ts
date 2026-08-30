import { logger } from '@/lib/logger';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Runtime secret hydration.
 *
 * Precedence (highest -> lowest):
 *   1. platform_secrets where scope='runtime' (canonical Admin/Studio source)
 *   2. app_secrets where scope='runtime' (legacy fallback during migration)
 *   3. process.env (Northflank/container injection)
 *
 * Build-only and unused Studio values must never be copied into process.env.
 */

let cache: Record<string, string> | null = null;
let cacheTimestamp = 0;
let hydrated = false;
const CACHE_TTL_MS = 5 * 60 * 1000;
const SECRETS_FETCH_TIMEOUT_MS = 3000;

function getBootstrapClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), SECRETS_FETCH_TIMEOUT_MS);
        return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
      },
    },
  });
}

function acceptSecret(target: Record<string, string>, key: unknown, value: unknown) {
  if (typeof key !== 'string' || typeof value !== 'string') return;
  const trimmed = value.trim();
  if (trimmed) target[key] = value;
}

async function loadSecrets(): Promise<Record<string, string>> {
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL_MS) return cache;

  const client = getBootstrapClient();
  if (!client) return {};

  const secrets: Record<string, string> = {};

  // Legacy fallback first. Canonical platform_secrets values below overwrite it.
  try {
    const result = await client
      .from('app_secrets')
      .select('key,value')
      .eq('scope', 'runtime');
    if (!result.error) {
      for (const row of result.data ?? []) acceptSecret(secrets, row.key, row.value);
    } else if (result.error.code !== '42P01') {
      logger.error('Failed to load legacy app_secrets', result.error);
    }
  } catch (error) {
    logger.error('Failed to load legacy app_secrets', error instanceof Error ? error : undefined);
  }

  // Canonical source. Scope is enforced in the database and here at hydration.
  try {
    const result = await client
      .from('platform_secrets')
      .select('key,value_enc,scope')
      .eq('scope', 'runtime');
    if (!result.error) {
      for (const row of result.data ?? []) acceptSecret(secrets, row.key, row.value_enc);
    } else {
      logger.error('Failed to load platform_secrets', result.error);
    }
  } catch (error) {
    logger.error('Failed to load platform_secrets', error instanceof Error ? error : undefined);
  }

  cache = secrets;
  cacheTimestamp = Date.now();
  return secrets;
}

/** Merge canonical runtime secrets into process.env. */
export async function hydrateProcessEnv(): Promise<void> {
  if (hydrated && Date.now() - cacheTimestamp < CACHE_TTL_MS) return;

  const secrets = await loadSecrets();
  for (const [key, value] of Object.entries(secrets)) {
    if (value.trim()) process.env[key] = value;
  }
  hydrated = true;
}

/** Get a single runtime secret, falling back to process.env. */
export async function getSecret(key: string): Promise<string | undefined> {
  const secrets = await loadSecrets();
  return secrets[key] ?? process.env[key];
}

/** Get multiple runtime secrets, falling back to process.env per key. */
export async function getSecrets<K extends string>(
  keys: K[],
): Promise<Record<K, string | undefined>> {
  const secrets = await loadSecrets();
  const result = {} as Record<K, string | undefined>;
  for (const key of keys) result[key] = secrets[key] ?? process.env[key];
  return result;
}

/** Synchronous read after hydration; process.env remains the final fallback. */
export function getCachedSecret(key: string): string | undefined {
  return cache?.[key] ?? process.env[key];
}

/** Force-refresh after a Studio secret mutation. */
export async function refreshSecrets(): Promise<void> {
  cache = null;
  cacheTimestamp = 0;
  hydrated = false;
  await hydrateProcessEnv();
}


/**
 * Decrypt one canonical platform secret by exact key.
 *
 * Control-plane callers must use this instead of hydrating the whole secret
 * table into process.env. The restricted database function is the only place
 * that can decrypt value_enc.
 */
export async function getDecryptedPlatformSecret(key: string): Promise<string | undefined> {
  const client = getBootstrapClient();
  if (!client) return process.env[key];

  const { data, error } = await client.rpc('get_platform_secret', { p_key: key });
  if (error || typeof data !== 'string' || !data.trim()) return process.env[key];
  return data.trim();
}

/**
 * Hydrate only Northflank control-plane credentials.
 * Values are decrypted by exact key and never returned to a browser response.
 */
export async function hydrateNorthflankEnv(): Promise<void> {
  const keys = ['NORTHFLANK_API_TOKEN', 'NORTHFLANK_PROJECT_ID'] as const;
  const values = await Promise.all(
    keys.map(async (key) => ({
      key,
      value: await getDecryptedPlatformSecret(key),
    })),
  );

  for (const { key, value } of values) {
    if (value) process.env[key] = value;
  }
}
