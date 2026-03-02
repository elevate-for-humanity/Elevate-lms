/**
 * Runtime secrets fetched from Supabase `app_secrets` table and merged
 * into process.env so existing code continues to work unchanged.
 *
 * Why: Netlify injects all site env vars into every Lambda function.
 * With 160+ vars the serialized payload exceeds AWS Lambda's 4 KB limit,
 * causing deploys to fail (HTTP 400). This module keeps only 3 bootstrap
 * vars in Netlify env and loads the rest from Supabase at runtime.
 *
 * Bootstrap vars (stay in Netlify):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage — explicit fetch:
 *   import { getSecret, getSecrets } from '@/lib/secrets';
 *   const key = await getSecret('STRIPE_SECRET_KEY');
 *
 * Usage — hydrate process.env (call once at startup):
 *   import { hydrateProcessEnv } from '@/lib/secrets';
 *   await hydrateProcessEnv();
 *   // now process.env.STRIPE_SECRET_KEY works as before
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cache: Record<string, string> | null = null;
let cacheTimestamp = 0;
let hydrated = false;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — survives warm Lambda reuse

function getBootstrapClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function loadSecrets(): Promise<Record<string, string>> {
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cache;
  }

  const client = getBootstrapClient();
  if (!client) {
    // No Supabase creds — local dev or misconfigured. Fall through to process.env.
    return {};
  }

  const { data, error } = await client
    .from('app_secrets')
    .select('key, value')
    .eq('scope', 'runtime');

  if (error) {
    console.error('[secrets] Failed to load from app_secrets:', error.message);
    return cache ?? {};
  }

  const secrets: Record<string, string> = {};
  for (const row of data ?? []) {
    secrets[row.key] = row.value;
  }

  cache = secrets;
  cacheTimestamp = Date.now();
  return secrets;
}

/**
 * Merge all runtime secrets into process.env.
 * Existing process.env values take precedence (so Netlify-set vars win).
 * Call once at function/server startup.
 */
export async function hydrateProcessEnv(): Promise<void> {
  if (hydrated && Date.now() - cacheTimestamp < CACHE_TTL_MS) return;

  const secrets = await loadSecrets();
  for (const [key, value] of Object.entries(secrets)) {
    // Don't overwrite vars already set in the environment
    if (!process.env[key]) {
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
  keys: K[]
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
