/**
 * timedFetch — fetch with hard timeout + circuit breaker for all Supabase clients.
 *
 * Transient Supabase Data API/PostgREST failures must not immediately cascade
 * into Admin/LMS outages. Safe reads get a small bounded retry budget and use
 * the shared read circuit. Writes are never replayed automatically and must not
 * poison that read circuit: an optional telemetry write must never prevent a
 * later required canonical read from reaching Supabase.
 */
import { breakers } from '@/lib/resilience';

// Request-time rendering and authentication must never inherit batch-worker
// retry budgets. Three eight-second attempts made a transient Data API outage
// hold every page open for roughly 24.5 seconds. Batch workflows can still opt
// into longer waits through the documented environment overrides.
const DEFAULT_SUPABASE_FETCH_TIMEOUT_MS = 2_500;
const DEFAULT_SUPABASE_AUTH_FETCH_TIMEOUT_MS = 15_000;
const DEFAULT_SAFE_READ_MAX_ATTEMPTS = 1;
const TRANSIENT_STATUSES = new Set([502, 503, 504]);

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};

  return Object.fromEntries(
    headers instanceof Headers
      ? headers.entries()
      : Array.isArray(headers)
        ? headers
        : Object.entries(headers).map(([key, value]) => [key, String(value)]),
  );
}

function methodFor(init?: RequestInit): string {
  return (init?.method || 'GET').toUpperCase();
}

function isSafeRead(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

function positiveInteger(value: string | undefined, fallback: number, maximum: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

function isSupabaseAuthRequest(input: RequestInfo | URL): boolean {
  const rawUrl = input instanceof Request ? input.url : String(input);

  try {
    return new URL(rawUrl).pathname.startsWith('/auth/v1/');
  } catch {
    return rawUrl.includes('/auth/v1/');
  }
}

function fetchTimeoutMs(input: RequestInfo | URL): number {
  if (isSupabaseAuthRequest(input)) {
    return positiveInteger(
      process.env.SUPABASE_AUTH_FETCH_TIMEOUT_MS,
      DEFAULT_SUPABASE_AUTH_FETCH_TIMEOUT_MS,
      60_000,
    );
  }

  return positiveInteger(
    process.env.SUPABASE_FETCH_TIMEOUT_MS,
    DEFAULT_SUPABASE_FETCH_TIMEOUT_MS,
    60_000,
  );
}

function safeReadMaxAttempts(): number {
  return positiveInteger(process.env.SUPABASE_READ_MAX_ATTEMPTS, DEFAULT_SAFE_READ_MAX_ATTEMPTS, 5);
}

function readCircuitEnabled(): boolean {
  return process.env.SUPABASE_CIRCUIT_BREAKER_ENABLED !== 'false';
}

function retryDelayMs(attempt: number): number {
  // Small deterministic backoff keeps recovery fast without creating a retry storm.
  return attempt === 1 ? 150 : 400;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAttempt(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  headers: Record<string, string>,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), fetchTimeoutMs(input));

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      headers: {
        Connection: 'keep-alive',
        ...headers,
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export function timedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = methodFor(init);
  const headers = normalizeHeaders(init?.headers);
  const maxAttempts = isSafeRead(method) ? safeReadMaxAttempts() : 1;

  const execute = async () => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetchAttempt(input, init, headers);

        if (!TRANSIENT_STATUSES.has(response.status)) {
          return response;
        }

        lastError = new Error(`Supabase transient HTTP ${response.status}`);

        if (attempt < maxAttempts) {
          await sleep(retryDelayMs(attempt));
          continue;
        }
      } catch (error) {
        lastError = error;

        // Only safe reads may be retried. Never replay writes after an unknown
        // network outcome because the server may already have committed them.
        if (!isSafeRead(method) || attempt >= maxAttempts) {
          throw error;
        }

        await sleep(retryDelayMs(attempt));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Supabase request failed after bounded retries');
  };

  return isSafeRead(method) && readCircuitEnabled() ? breakers.supabase.call(execute) : execute();
}
