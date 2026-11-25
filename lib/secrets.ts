import { logger } from '@/lib/logger';
import { resolveServerSupabaseRawEnv } from '@/lib/supabase/public-config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Runtime secret hydration.
 *
 * Precedence (highest -> lowest):
 *   1. platform_secrets where scope='runtime' (canonical Admin/Studio source)
 *   2. app_secrets where scope='runtime' (legacy fallback during migration)
 *   3. process.env (container injection)
 *
 * Runtimes explicitly switched to Google Secret Manager use only their bound
 * values. Enable that authority only after the service inventory is complete.
 * PBX_RUNTIME_CONFIG_PROVIDER applies the same authority only to PBX keys,
 * allowing the phone integration to migrate independently of other settings.
 * OWNED_MODEL_RUNTIME_CONFIG_PROVIDER scopes the same authority to owned-model
 * connection, provider selection, and CPU/GPU routing settings.
 *
 * Build-only and unused Studio values must never be copied into process.env.
 */

let cache: Record<string, string> | null = null;
let cacheTimestamp = 0;
let hydrated = false;
const CACHE_TTL_MS = 5 * 60 * 1000;
// A failed canonical read is cached as an outcome too. Before this, only a
// successful read filled the cache, so on any instance where the canonical
// store was unreachable EVERY request repaid the full serial read cost
// (two table reads plus one RPC per runtime key, each allowed a 30s fetch
// timeout and up to 3 attempts) before it could proceed. A failure now
// suppresses synchronous re-reads for FAILURE_CACHE_TTL_MS; the partial
// (legacy-only) result is served in the meantime and the next attempt
// happens on the first request after the TTL, or in the background when an
// interactive caller uses the bounded hydration variant.
const FAILURE_CACHE_TTL_MS = Math.max(
  1000,
  Number.parseInt(process.env.SUPABASE_FAILURE_CACHE_TTL_MS || '30000', 10) || 30000,
);
// Synchronous budget for interactive paths (see hydrateProcessEnvBounded).
// A cold or failing hydration must never hold a visitor-facing request
// longer than this; hydration continues in the background and merges into
// process.env when it lands.
export const HYDRATION_SYNC_BUDGET_MS = Math.max(
  0,
  Number.parseInt(process.env.HYDRATION_SYNC_BUDGET_MS || '1500', 10) || 1500,
);
let failureCache: Record<string, string> | null = null;
let failureTimestamp = 0;
let lastLoadCompletedAt = 0;
let lastLoadSucceeded = false;
let inFlightLoad: Promise<Record<string, string>> | null = null;
let inFlightHydration: Promise<void> | null = null;

function successCacheFresh(): boolean {
  return Boolean(cache && Date.now() - cacheTimestamp < CACHE_TTL_MS);
}

function failureCacheFresh(): boolean {
  return Boolean(failureCache && Date.now() - failureTimestamp < FAILURE_CACHE_TTL_MS);
}

/** True when the last completed hydration attempt (success OR failure) is
 * still inside its TTL, so no new synchronous read is owed. */
function hydrationOutcomeFresh(): boolean {
  if (!lastLoadCompletedAt) return false;
  const ttl = lastLoadSucceeded ? CACHE_TTL_MS : FAILURE_CACHE_TTL_MS;
  return Date.now() - lastLoadCompletedAt < ttl;
}
const SECRETS_FETCH_TIMEOUT_MS = Math.max(
  1000,
  Number.parseInt(process.env.SUPABASE_FETCH_TIMEOUT_MS || '30000', 10) || 30000,
);
const SECRETS_READ_ATTEMPTS = Math.max(
  1,
  Number.parseInt(process.env.SUPABASE_READ_MAX_ATTEMPTS || '3', 10) || 3,
);

function isRetiredPhoneSecret(key: unknown): boolean {
  return typeof key === 'string' && /^TELNYX_/i.test(key);
}

function usesGoogleRuntimeBindings(key?: string): boolean {
  return process.env.ELEVATE_RUNTIME_CONFIG_PROVIDER === 'google-secret-manager' ||
    key === 'PBX_RUNTIME_CONFIG_PROVIDER' ||
    key === 'OWNED_MODEL_RUNTIME_CONFIG_PROVIDER' ||
    Boolean(typeof key === 'string' && process.env.OWNED_MODEL_RUNTIME_CONFIG_PROVIDER === 'google-secret-manager' &&
      (key.startsWith('ELEVATE_LLM_') || ['AI_PROVIDER', 'AI_PROVIDER_ORDER', 'PARIS_INFERENCE_TIER', 'PARIS_GPU_ENABLED'].includes(key))) ||
    Boolean(typeof key === 'string' && key.startsWith('PBX_') && process.env.PBX_RUNTIME_CONFIG_PROVIDER === 'google-secret-manager');
}

function retryableSecretRead(
  error: { code?: string; message?: string } | null | undefined,
): boolean {
  if (!error) return false;
  return (
    ['PGRST002', 'PGRST000', '57014'].includes(error.code || '') ||
    /schema cache|retry|timeout|timed out|fetch failed|network/i.test(error.message || '')
  );
}

async function readRuntimeSecrets(
  client: SupabaseClient,
  table: 'app_secrets' | 'platform_secrets',
  columns: 'key,value' | 'key,value_enc,scope' | 'key,scope',
) {
  let lastResult: any = null;
  for (let attempt = 1; attempt <= SECRETS_READ_ATTEMPTS; attempt += 1) {
    const result = await client.from(table).select(columns).eq('scope', 'runtime');
    lastResult = result;
    if (!result.error || !retryableSecretRead(result.error)) return result;
    if (attempt < SECRETS_READ_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(250 * 2 ** (attempt - 1), 1000)));
    }
  }
  return lastResult;
}

function getBootstrapClient(): SupabaseClient | null {
  const { url } = resolveServerSupabaseRawEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), SECRETS_FETCH_TIMEOUT_MS);
        const signal = init?.signal ? AbortSignal.any([controller.signal, init.signal]) : controller.signal;
        return fetch(input, { ...init, signal }).finally(() =>
          clearTimeout(timer),
        );
      },
    },
  });
}

function acceptSecret(target: Record<string, string>, key: unknown, value: unknown) {
  if (typeof key !== 'string' || typeof value !== 'string') return;
  if (isRetiredPhoneSecret(key) || usesGoogleRuntimeBindings(key)) return;
  const trimmed = value.trim();
  if (trimmed) target[key] = value;
}

async function performLoadSecrets(): Promise<Record<string, string>> {
  if (usesGoogleRuntimeBindings()) return {};
  if (successCacheFresh()) return cache!;

  const client = getBootstrapClient();
  if (!client) {
    // No bootstrap credentials: nothing can be read. Record the outcome so
    // callers serve process.env instead of re-checking on every request.
    failureCache = {};
    failureTimestamp = Date.now();
    lastLoadCompletedAt = failureTimestamp;
    lastLoadSucceeded = false;
    return {};
  }

  const secrets: Record<string, string> = {};
  let canonicalReadSucceeded = false;

  // The legacy and canonical list reads are independent: run them in
  // parallel instead of serially (they used to cost up to
  // 2 x SECRETS_READ_ATTEMPTS x SECRETS_FETCH_TIMEOUT_MS back to back).
  // Precedence is still applied afterwards, in order: legacy first,
  // canonical platform_secrets values overwrite it.
  const [legacyOutcome, canonicalOutcome] = await Promise.all([
    (async () => {
      try {
        return { result: await readRuntimeSecrets(client, 'app_secrets', 'key,value'), error: null as unknown };
      } catch (error) {
        return { result: null, error };
      }
    })(),
    (async () => {
      try {
        return { result: await readRuntimeSecrets(client, 'platform_secrets', 'key,scope'), error: null as unknown };
      } catch (error) {
        return { result: null, error };
      }
    })(),
  ]);

  // Legacy fallback first. Canonical platform_secrets values below overwrite it.
  if (legacyOutcome.error) {
    logger.error('Failed to load legacy app_secrets', legacyOutcome.error instanceof Error ? legacyOutcome.error : undefined);
  } else if (legacyOutcome.result) {
    if (!legacyOutcome.result.error) {
      for (const row of legacyOutcome.result.data ?? []) acceptSecret(secrets, row.key, row.value);
    } else if (legacyOutcome.result.error.code !== '42P01') {
      logger.error('Failed to load legacy app_secrets', legacyOutcome.result.error);
    }
  }

  // Canonical source. Never hydrate value_enc directly: it is encrypted at rest.
  // Resolve each runtime key through the restricted database function so only
  // decrypted values reach process.env. The per-key RPCs already run in
  // parallel via Promise.all.
  if (canonicalOutcome.error) {
    logger.error('Failed to load platform_secrets', canonicalOutcome.error instanceof Error ? canonicalOutcome.error : undefined);
  } else if (canonicalOutcome.result) {
    const result = canonicalOutcome.result;
    if (!result.error) {
      let allDecryptionsSucceeded = true;
      const decryptedRows = await Promise.all(
        (result.data ?? []).filter(row => !isRetiredPhoneSecret(row.key) && !usesGoogleRuntimeBindings(row.key)).map(async (row) => {
          const decrypted = await client.rpc('get_platform_secret', { p_key: row.key });
          if (decrypted.error) {
            allDecryptionsSucceeded = false;
            logger.error(`Failed to decrypt platform secret ${row.key}`, decrypted.error);
          }
          return { key: row.key, value: decrypted.data };
        }),
      );
      for (const row of decryptedRows) acceptSecret(secrets, row.key, row.value);
      canonicalReadSucceeded = allDecryptionsSucceeded;
    } else {
      logger.error('Failed to load platform_secrets', result.error);
    }
  }

  const completedAt = Date.now();
  lastLoadCompletedAt = completedAt;
  if (canonicalReadSucceeded) {
    // Only a successful canonical read fills the success cache.
    cache = secrets;
    cacheTimestamp = completedAt;
    failureCache = null;
    failureTimestamp = 0;
    lastLoadSucceeded = true;
  } else {
    // Cache the failure OUTCOME (with whatever partial values were read)
    // for FAILURE_CACHE_TTL_MS so a transient canonical-store failure is
    // not repaid synchronously by every request on this instance.
    failureCache = secrets;
    failureTimestamp = completedAt;
    lastLoadSucceeded = false;
  }
  return secrets;
}

/**
 * Load runtime secrets with outcome caching and in-flight dedupe.
 *
 * - Success: cached for CACHE_TTL_MS (unchanged semantics).
 * - Failure: the partial result is cached for FAILURE_CACHE_TTL_MS and
 *   served to subsequent callers without new reads.
 * - Concurrent callers share one in-flight load instead of each starting
 *   their own serial read chain.
 */
async function loadSecrets(): Promise<Record<string, string>> {
  if (usesGoogleRuntimeBindings()) return {};
  if (successCacheFresh()) return cache!;
  if (inFlightLoad) return inFlightLoad;
  if (failureCacheFresh()) return failureCache!;
  inFlightLoad = performLoadSecrets().finally(() => {
    inFlightLoad = null;
  });
  return inFlightLoad;
}

function mergeSecretsIntoEnv(secrets: Record<string, string>): void {
  for (const [key, value] of Object.entries(secrets)) {
    if (!usesGoogleRuntimeBindings(key) && value.trim()) process.env[key] = value;
  }
}

/**
 * The single shared hydration run. Concurrent callers share it; when it
 * lands it merges into process.env exactly once. Never rejects: load
 * failures are recorded as a cached failure outcome by loadSecrets and
 * callers fall back to whatever process.env already holds.
 */
function ensureHydration(): Promise<void> {
  for (const key of Object.keys(process.env)) if (isRetiredPhoneSecret(key)) delete process.env[key];
  if (usesGoogleRuntimeBindings()) return Promise.resolve();
  if (hydrated && hydrationOutcomeFresh()) return Promise.resolve();
  if (inFlightHydration) return inFlightHydration;
  inFlightHydration = (async () => {
    try {
      const secrets = await loadSecrets();
      mergeSecretsIntoEnv(secrets);
      hydrated = true;
    } catch (error) {
      // loadSecrets records failures itself; hydration must never take a
      // request down with it. Serve the env that is already present.
      logger.error('Failed to hydrate process env', error instanceof Error ? error : undefined);
    }
  })().finally(() => {
    inFlightHydration = null;
  });
  return inFlightHydration;
}

/**
 * Merge canonical runtime secrets into process.env — STRICT variant.
 *
 * Awaits the full hydration, however long the underlying reads take
 * (bounded only by the per-read fetch timeout and retry policy). This is
 * the guarantee non-interactive callers rely on: withRuntime and
 * cronHandler validate required secrets immediately after this returns,
 * and instrumentation hydrates once at boot. Keep those callers on this
 * variant. Interactive, visitor-facing routes should use
 * hydrateProcessEnvBounded instead.
 */
export async function hydrateProcessEnv(): Promise<void> {
  await ensureHydration();
}

/**
 * Bounded hydration for interactive paths (e.g. the PARIS chat route).
 *
 * Starts (or joins) hydration, then waits at most `budgetMs`. If hydration
 * has not landed by then, the caller proceeds with whatever process.env
 * already holds — the exact state the strict path ultimately fell back to
 * after a failed read — while hydration continues in the background and
 * merges into process.env when it completes, so the next request on this
 * instance is warm. A failing canonical store therefore costs an
 * interactive request at most the budget, once per failure TTL, instead
 * of the full read chain on every request.
 */
export async function hydrateProcessEnvBounded(budgetMs: number = HYDRATION_SYNC_BUDGET_MS): Promise<void> {
  const hydration = ensureHydration();
  if (budgetMs <= 0) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      hydration,
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, budgetMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Get a single runtime secret, falling back to process.env. */
export async function getSecret(key: string): Promise<string | undefined> {
  if (isRetiredPhoneSecret(key)) return undefined;
  if (usesGoogleRuntimeBindings(key)) return process.env[key];
  const secrets = await loadSecrets();
  return secrets[key] ?? process.env[key];
}

/** Get multiple runtime secrets, falling back to process.env per key. */
export async function getSecrets<K extends string>(
  keys: K[],
): Promise<Record<K, string | undefined>> {
  const secrets = keys.some(key => !isRetiredPhoneSecret(key) && !usesGoogleRuntimeBindings(key)) ? await loadSecrets() : {};
  const result = {} as Record<K, string | undefined>;
  for (const key of keys) result[key] = isRetiredPhoneSecret(key) ? undefined : usesGoogleRuntimeBindings(key) ? process.env[key] : secrets[key] ?? process.env[key];
  return result;
}

/** Read only the requested runtime keys for bounded diagnostics. Reuse the
 * canonical cache when warm; never mark a partial read as a full cache fill. */
export async function getSelectedRuntimeSecrets<K extends string>(
  keys: K[], { signal }: { signal?: AbortSignal } = {},
): Promise<Record<K, string | undefined>> {
  signal?.throwIfAborted();
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL_MS) return getSecrets(keys);
  const requested = [...new Set(keys.filter(key => !isRetiredPhoneSecret(key) && !usesGoogleRuntimeBindings(key)))];
  const values: Record<string, string> = {};
  const client = requested.length ? getBootstrapClient() : null;
  if (client) {
    const bounded = <T extends { abortSignal(signal: AbortSignal): T }>(query: T) => signal ? query.abortSignal(signal) : query;
    const [legacy, canonical] = await Promise.all([
      bounded(client.from('app_secrets').select('key,value').eq('scope', 'runtime').in('key', requested)),
      bounded(client.from('platform_secrets').select('key,scope').eq('scope', 'runtime').in('key', requested)),
    ]);
    signal?.throwIfAborted();
    if ((legacy.error && legacy.error.code !== '42P01') || canonical.error)
      throw new Error('RUNTIME_SECRET_READ_UNAVAILABLE');
    for (const row of legacy.data ?? []) if (requested.includes(row.key)) acceptSecret(values, row.key, row.value);
    await Promise.all((canonical.data ?? []).filter(row => requested.includes(row.key)).map(async row => {
      const result = await bounded(client.rpc('get_platform_secret', { p_key: row.key }));
      signal?.throwIfAborted();
      if (result.error) throw new Error('RUNTIME_SECRET_READ_UNAVAILABLE');
      acceptSecret(values, row.key, result.data);
    }));
  }
  signal?.throwIfAborted();
  return Object.fromEntries(keys.map(key => [key, isRetiredPhoneSecret(key) ? undefined : usesGoogleRuntimeBindings(key) ? process.env[key] : values[key] ?? process.env[key]])) as Record<K, string | undefined>;
}

/** Synchronous read after hydration; process.env remains the final fallback. */
export function getCachedSecret(key: string): string | undefined {
  if (isRetiredPhoneSecret(key)) return undefined;
  if (usesGoogleRuntimeBindings(key)) return process.env[key];
  return cache?.[key] ?? process.env[key];
}

/** Force-refresh after a Studio secret mutation. */
export async function refreshSecrets(): Promise<void> {
  cache = null;
  cacheTimestamp = 0;
  failureCache = null;
  failureTimestamp = 0;
  lastLoadCompletedAt = 0;
  lastLoadSucceeded = false;
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
export async function getDecryptedPlatformSecret(key: string, { signal }: { signal?: AbortSignal } = {}): Promise<string | undefined> {
  if (isRetiredPhoneSecret(key)) return undefined;
  signal?.throwIfAborted();
  if (usesGoogleRuntimeBindings(key)) return process.env[key];
  const client = getBootstrapClient();
  if (!client) return process.env[key];

  const query = client.rpc('get_platform_secret', { p_key: key });
  const { data, error } = await (signal ? query.abortSignal(signal) : query);
  signal?.throwIfAborted();
  if (error || typeof data !== 'string' || !data.trim()) return process.env[key];
  return data.trim();
}

/**
 * Exact encrypted Admin GitHub App source. Unlike the generic runtime resolver,
 * this never falls back to process.env, a Google-mounted key or a legacy PAT.
 * Missing or inaccessible canonical secrets must fail closed.
 */
export async function getAdminGitHubAppSecret(
  key: 'GITHUB_APP_ID' | 'GITHUB_APP_INSTALLATION_ID' | 'GITHUB_APP_PRIVATE_KEY',
  { signal }: { signal?: AbortSignal } = {},
): Promise<string | undefined> {
  signal?.throwIfAborted();
  const client = getBootstrapClient();
  if (!client) throw new Error('GITHUB_APP_DASHBOARD_STORE_UNAVAILABLE');
  const query = client.rpc('get_platform_secret', { p_key: key });
  const { data, error } = await (signal ? query.abortSignal(signal) : query);
  signal?.throwIfAborted();
  if (error) throw new Error('GITHUB_APP_DASHBOARD_STORE_UNAVAILABLE');
  return typeof data === 'string' && data.trim() ? data.trim() : undefined;
}
