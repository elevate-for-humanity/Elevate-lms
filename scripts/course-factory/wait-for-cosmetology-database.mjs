const CANONICAL_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const PROGRAM_SLUG = 'cosmetology-apprenticeship';
const ATTEMPTS = Number.parseInt(process.env.COSMETOLOGY_DB_GATE_ATTEMPTS || '60', 10);
const REQUIRED_CONSECUTIVE_PASSES = Number.parseInt(
  process.env.COSMETOLOGY_DB_REQUIRED_PASSES || '5',
  10,
);
const REQUEST_TIMEOUT_MS = Number.parseInt(
  process.env.COSMETOLOGY_DB_REQUEST_TIMEOUT_MS || '15000',
  10,
);
const MAX_READY_LATENCY_MS = Number.parseInt(
  process.env.COSMETOLOGY_DB_MAX_LATENCY_MS || '8000',
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
    ['maximum ready latency', MAX_READY_LATENCY_MS],
  ];
  for (const [label, value] of values) {
    if (!Number.isFinite(value) || value <= 0) fail(`invalid ${label}: ${value}`);
  }
  if (REQUIRED_CONSECUTIVE_PASSES > ATTEMPTS) {
    fail('required consecutive passes cannot exceed total attempts');
  }
  if (MAX_READY_LATENCY_MS >= REQUEST_TIMEOUT_MS) {
    fail('maximum ready latency must be lower than the request timeout');
  }
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
  if (!response.ok) {
    return { ready: false, latencyMs, reason: `HTTP ${response.status}` };
  }

  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0]?.slug !== PROGRAM_SLUG) {
    fail('canonical Cosmetology program was not returned by the production database');
  }
  if (latencyMs > MAX_READY_LATENCY_MS) {
    return {
      ready: false,
      latencyMs,
      reason: `latency ${latencyMs}ms exceeded ${MAX_READY_LATENCY_MS}ms`,
    };
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
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const result = await checkDatabase(serviceRoleKey);
      if (result.ready) {
        consecutivePasses += 1;
        console.log(
          `[Cosmetology Database Gate] pass ${consecutivePasses}/${REQUIRED_CONSECUTIVE_PASSES} on attempt ${attempt}: ${result.reason}`,
        );
        if (consecutivePasses >= REQUIRED_CONSECUTIVE_PASSES) {
          console.log(
            `[Cosmetology Database Gate] stable: ${REQUIRED_CONSECUTIVE_PASSES} consecutive latency-qualified checks passed`,
          );
          return;
        }
      } else {
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

    if (attempt < ATTEMPTS) await sleep(retryDelay(attempt));
  }

  fail(
    `production database failed to achieve ${REQUIRED_CONSECUTIVE_PASSES} consecutive checks at or below ${MAX_READY_LATENCY_MS}ms`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
