/**
 * lib/config.ts
 *
 * Runtime config reader with two-tier fallback:
 *   1. platform_settings table (admin-editable, takes precedence)
 *   2. process.env (build-time / .env.local fallback)
 *
 * BOOTSTRAP KEYS (Supabase connection) always come from process.env —
 * they are needed to establish the DB connection before any DB read is possible.
 *
 * All other keys are read from platform_settings first so admins can
 * rotate secrets from the dashboard without a redeploy.
 *
 * Usage:
 *   import { getConfig } from '@/lib/config';
 *   const key = await getConfig('OPENAI_API_KEY');
 *
 * Cache: settings are cached in-process for CACHE_TTL_MS to avoid
 * a DB round-trip on every request. Cache is invalidated on POST to
 * /api/admin/env-vars (via the X-Config-Bust header).
 */

import { logger } from '@/lib/logger';

// ── Bootstrap keys — always from process.env ─────────────────────────────────
// These are required to connect to Supabase, so they can never come from DB.
const BOOTSTRAP_KEYS = new Set([
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_PROJECT_REF',
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PASSWORD',
  'NODE_ENV',
]);

// ── In-process cache ──────────────────────────────────────────────────────────
const CACHE_TTL_MS = 60_000; // 1 minute

let _cache: Map<string, string> | null = null;
let _cacheAt = 0;

export function bustConfigCache() {
  _cache = null;
  _cacheAt = 0;
}

async function loadFromDB(): Promise<Map<string, string>> {
  try {
    // Dynamic import avoids circular dependency with supabase clients
    const { requireAdminClient: getAdminClient } = await import('@/lib/supabase/admin');
    const db = await requireAdminClient();
    if (!db) return new Map();

    const { data, error } = await db
      .from('platform_settings')
      .select('key, value')
      .eq('is_active', true);

    if (error) {
      logger.warn('[config] platform_settings read failed', { error: error.message });
      return new Map();
    }

    return new Map((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
  } catch (err) {
    logger.warn('[config] platform_settings unavailable', {
      error: err instanceof Error ? err.message : String(err),
    });
    return new Map();
  }
}

async function getCache(): Promise<Map<string, string>> {
  const now = Date.now();
  if (_cache && now - _cacheAt < CACHE_TTL_MS) return _cache;
  _cache = await loadFromDB();
  _cacheAt = now;
  return _cache;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get a single config value.
 * Bootstrap keys always return process.env.
 * All other keys: platform_settings → process.env fallback.
 */
export async function getConfig(key: string): Promise<string | undefined> {
  if (BOOTSTRAP_KEYS.has(key)) return process.env[key];

  const db = await getCache();
  if (db.has(key)) return db.get(key);

  return process.env[key];
}

/**
 * Get a config value synchronously from process.env only.
 * Use this in contexts where async is not possible (middleware, edge runtime).
 * Does NOT read from platform_settings.
 */
export function getConfigSync(key: string): string | undefined {
  return process.env[key];
}

/**
 * Get multiple config values in one call.
 * Returns a record of key → value (undefined if not set anywhere).
 */
export async function getConfigs(keys: string[]): Promise<Record<string, string | undefined>> {
  const db = await getCache();
  const result: Record<string, string | undefined> = {};
  for (const key of keys) {
    if (BOOTSTRAP_KEYS.has(key)) {
      result[key] = process.env[key];
    } else {
      result[key] = db.has(key) ? db.get(key) : process.env[key];
    }
  }
  return result;
}

/**
 * Returns true if the key is set in platform_settings (not just process.env).
 * Used by the EnvManager UI to show the source badge.
 */
export async function isDBConfig(key: string): Promise<boolean> {
  if (BOOTSTRAP_KEYS.has(key)) return false;
  const db = await getCache();
  return db.has(key);
}

/**
 * Preload all keys into cache. Call once at app startup for warm cache.
 */
export async function preloadConfig(): Promise<void> {
  await getCache();
}
