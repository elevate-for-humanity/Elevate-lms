const CANONICAL_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const PROGRAM_SLUG = 'cosmetology-apprenticeship';
const ATTEMPTS = Number.parseInt(process.env.COSMETOLOGY_DB_GATE_ATTEMPTS || '12', 10);
const REQUIRED_CONSECUTIVE_PASSES = Number.parseInt(
  process.env.COSMETOLOGY_DB_REQUIRED_PASSES || '2',
  10,
);
const REQUEST_TIMEOUT_MS = Number.parseInt(
  process.env.COSMETOLOGY_DB_REQUEST_TIMEOUT_MS || '30000',
  10,
);
const MIN_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 30_000;

function fail(message) {
  throw new Error(`[Cosmetology Database Gate] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(attempt) {
  const exponential = Math.min(
    MAX_RETRY_DELAY_MS,
    MIN_RETRY_DELAY_MS * 2 ** Math.min(attempt - 1, 3),
  );
  return exponential + Math.floor(Math.random() * 1_000);
}

function validateConfiguration() {
  const values = [
    ['attempts', ATTEMPTS],
    ['required passes', REQUIRED_CONSECUTIVE_PASSES],
    ['request timeout', REQUEST_TIMEOUT_MS],
  ];
  for (const [label, value] of values) {
    if (!Number.isFinite(value) || value <= 0) fail(`invalid ${label}: ${value}`);
  }
  if (REQUIRED_CONSECUTIVE_PASSES > ATTEMPTS) {
    fail('required consecutive passes cannot exceed total attempts');
  }
}

function parseRetryAfter(value) {
  if (!value) return null;
  const seconds = Number.parseInt(value, 10);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const date = Date.parse(value);
  if (!Number.isFinite(date)) return null;
  return Math.max(0, date - Date.now());
}

async function checkDatabase(serviceRoleKey) {
  const url = new URL('/rest/v1/programs', CANONICAL_URL);
  url.searchParams.set('select', 'id,slug');
  url.searchParams.set('slug', `eq.${PROGRAM_SLUG}`);
  url.searchParams.set('limit', '1');

  const startedAt = performance.now();
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      accept: 'application/json',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const latencyMs = Math.round(performance.now() - startedAt);

  if (response.status === 401 || response.status === 403) {
    fail(`service-role credential was rejected with HTTP ${response.status}`);
  }
  if (response.status === 429) {
    return {
      ready: false,
      latencyMs,
      reason: 'HTTP 429',
      retryAfterMs: parseRetryAfter(response.headers.get('retry-after')),
    };
  }
  if (!response.ok) {
    return { ready: false, latencyMs, reason: `HTTP ${response.status}` };
  }

  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0]?.slug !== PROGRAM_SLUG) {
    fail('canonical Cosmetology program was not returned by the production database');
  }
  return {
    ready: true,
    latencyMs,
    reason: `canonical program query succeeded in ${latencyMs}ms`,
  };
}

async function main() {
  validateConfiguration();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) fail('SUPABASE_SERVICE_ROLE_KEY is missing');

  let consecutivePasses = 0;
  let retryAfterMs = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    retryAfterMs = null;
    try {
      const result = await checkDatabase(serviceRoleKey);
      if (result.ready) {
        consecutivePasses += 1;
        if (result.latencyMs > 8_000) {
          console.warn(
            `[Cosmetology Database Gate] slow successful response: ${result.latencyMs}ms`,
          );
        }
        console.log(
          `[Cosmetology Database Gate] pass ${consecutivePasses}/${REQUIRED_CONSECUTIVE_PASSES} on attempt ${attempt}: ${result.reason}`,
        );
        if (consecutivePasses >= REQUIRED_CONSECUTIVE_PASSES) {
          console.log(
            `[Cosmetology Database Gate] stable: ${REQUIRED_CONSECUTIVE_PASSES} consecutive authenticated checks passed`,
          );
          return;
        }
      } else {
        retryAfterMs = result.retryAfterMs ?? null;
        consecutivePasses = 0;
        console.warn(
          `[Cosmetology Database Gate] unavailable ${attempt}/${ATTEMPTS}: ${result.reason}; consecutive passes reset`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/credential was rejected|program was not returned|missing|invalid|required consecutive/i.test(message)) {
        throw error;
      }
      consecutivePasses = 0;
      console.warn(
        `[Cosmetology Database Gate] unavailable ${attempt}/${ATTEMPTS}: ${message}; consecutive passes reset`,
      );
    }

    if (attempt < ATTEMPTS) {
      const delay = retryAfterMs ?? retryDelay(attempt);
      if (retryAfterMs !== null) {
        console.warn(`[Cosmetology Database Gate] honoring Retry-After: ${delay}ms`);
      }
      await sleep(delay);
    }
  }

  fail(
    `production database failed to achieve ${REQUIRED_CONSECUTIVE_PASSES} consecutive authenticated checks`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
