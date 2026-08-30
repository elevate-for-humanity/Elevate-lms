const CANONICAL_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const PROGRAM_SLUG = 'cosmetology-apprenticeship';
const ATTEMPTS = 60;
const REQUEST_TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 30_000;

function fail(message) {
  throw new Error(`[Cosmetology Database Gate] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkDatabase(serviceRoleKey) {
  const url = new URL('/rest/v1/programs', CANONICAL_URL);
  url.searchParams.set('select', 'id,slug');
  url.searchParams.set('slug', `eq.${PROGRAM_SLUG}`);
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      accept: 'application/json',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (response.status === 401 || response.status === 403) {
    fail(`service-role credential was rejected with HTTP ${response.status}`);
  }
  if (!response.ok) return { ready: false, reason: `HTTP ${response.status}` };

  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0]?.slug !== PROGRAM_SLUG) {
    fail('canonical Cosmetology program was not returned by the production database');
  }
  return { ready: true, reason: 'canonical program query succeeded' };
}

async function main() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) fail('SUPABASE_SERVICE_ROLE_KEY is missing');

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const result = await checkDatabase(serviceRoleKey);
      if (result.ready) {
        console.log(
          `[Cosmetology Database Gate] ready on attempt ${attempt}: ${result.reason}`,
        );
        return;
      }
      console.warn(
        `[Cosmetology Database Gate] unavailable ${attempt}/${ATTEMPTS}: ${result.reason}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/credential was rejected|program was not returned|missing/i.test(message)) throw error;
      console.warn(
        `[Cosmetology Database Gate] unavailable ${attempt}/${ATTEMPTS}: ${message}`,
      );
    }

    if (attempt < ATTEMPTS) await sleep(RETRY_DELAY_MS);
  }

  fail('production database did not recover within the bounded wait window');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
