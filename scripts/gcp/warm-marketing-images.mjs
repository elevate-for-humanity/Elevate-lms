// Warm the Marketing image-optimizer cache after a deploy.
//
// Why: Next.js `/_next/image` variants are generated on demand by the
// server and cached on that instance's ephemeral disk. Every new Cloud Run
// revision starts with a COLD image cache, so the first visitor after a
// deploy waits seconds per picture (the full-width hero took 9.5s on
// 2026-11-24 after the f8043f23 release, and on 2026-11-25 the whole site
// looked like "no pictures are loading" right after the 7361ece1 deploy)
// and the homepage looks broken until the variants exist. `minimumCacheTTL`
// only helps browsers and repeat visitors; it does not warm the server-side
// cache.
//
// Run this immediately after every Marketing deploy (and after any
// revision change) so visitors never pay the cold-MISS cost:
//   node scripts/gcp/warm-marketing-images.mjs
//   node scripts/gcp/warm-marketing-images.mjs https://www.elevateforhumanity.org/ https://www.elevateforhumanity.org/programs
//
// Fixes vs the original version (2026-11-25):
// - Default page set now covers the main public pages, not just the home
//   page, so program/host-shop heroes are warm too.
// - Optimizer URLs are collected from the whole HTML (src AND srcset),
//   not only `src="..."` attributes.
// - Per-request timeout raised 60s -> 180s and every URL gets up to 3
//   attempts: a cold full-width generation under load can exceed 60s, and
//   the old script recorded those as failures and gave up.
// - /videos/*.mp4 references found on the pages are range-checked too, so
//   a missing hero video fails the run loudly instead of silently.
//
// TODO (needs workflow scope): add this as a post-deploy step in the
// Marketing release workflow so warming is automatic, not manual.

const ORIGIN = 'https://www.elevateforhumanity.org';
const DEFAULT_PAGES = [
  '/',
  '/programs',
  '/programs/hvac-technician',
  '/programs/barber-apprenticeship',
  '/programs/cosmetology-apprenticeship',
  '/programs/esthetician-apprenticeship',
  '/partners/host-shops',
  '/partners/host-shops/barber',
  '/host-shops',
  '/about',
  '/apply',
  '/careers',
  '/store',
  '/lms',
  '/employers',
  '/training-providers',
  '/get-started',
  '/contact',
  '/student-portal',
].map((p) => ORIGIN + p);
const CONCURRENCY = 4;
const TIMEOUT_MS = 180_000;
const ATTEMPTS = 3;

const pages = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PAGES;

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&');
}

async function fetchText(url, timeoutMs = TIMEOUT_MS) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function warmOne(url, headers = {}) {
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const started = Date.now();
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
      await res.arrayBuffer();
      const out = { url, status: res.status, ms: Date.now() - started, attempt };
      if (res.status === 200 || res.status === 206) return out;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, 5_000));
  }
  return { url, status: 0, ms: 0, attempt: ATTEMPTS, error: String(lastError?.message || lastError) };
}

async function runPool(items, worker, concurrency) {
  const results = [];
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      results.push(await worker(item));
    }
  });
  await Promise.all(runners);
  return results;
}

const failures = [];
const imageUrls = new Set();
const videoUrls = new Set();
for (const page of pages) {
  let html;
  try {
    html = await fetchText(page);
  } catch (error) {
    console.error(`PAGE FETCH FAILED ${page}: ${error.message}`);
    failures.push(page);
    continue;
  }
  for (const m of html.matchAll(/\/_next\/image\?[^"'\s,\\)]+/g)) {
    imageUrls.add(new URL(decodeEntities(m[0]), page).toString());
  }
  for (const m of html.matchAll(/(?:src|href)="(\/videos\/[^"]+\.mp4)"/g)) {
    videoUrls.add(new URL(m[1], page).toString());
  }
}

console.log(`warming ${imageUrls.size} image variants from ${pages.length} pages`);
const imageResults = await runPool([...imageUrls], (u) => warmOne(u), CONCURRENCY);
for (const r of imageResults.sort((a, b) => b.ms - a.ms)) {
  console.log(`  ${r.status} ${(r.ms / 1000).toFixed(2)}s attempt=${r.attempt} ${r.url}${r.error ? ` ERROR ${r.error}` : ''}`);
  if (r.status !== 200) failures.push(r.url);
}

console.log(`checking ${videoUrls.size} page-referenced videos (range request)`);
const videoResults = await runPool([...videoUrls], (u) => warmOne(u, { Range: 'bytes=0-1023' }), CONCURRENCY);
for (const r of videoResults) {
  console.log(`  ${r.status} ${(r.ms / 1000).toFixed(2)}s ${r.url}${r.error ? ` ERROR ${r.error}` : ''}`);
  if (r.status !== 200 && r.status !== 206) failures.push(r.url);
}

if (failures.length) {
  console.error(`WARM FAILED for ${failures.length} URL(s)`);
  process.exit(1);
}
console.log('Warm complete: all image variants served 200 and all page videos respond.');
