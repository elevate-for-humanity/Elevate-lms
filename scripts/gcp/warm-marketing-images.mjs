// Warm the Marketing image-optimizer cache after a deploy.
//
// Why: Next.js `/_next/image` variants are generated on demand by the
// server and cached on that instance's ephemeral disk. Every new Cloud Run
// revision starts with a COLD image cache, so the first visitor after a
// deploy waits 1-4s per picture (the full-width hero took 9.5s on
// 2026-11-24 after the f8043f23 release) and the homepage looks broken
// until the variants exist. `minimumCacheTTL` only helps browsers and
// repeat visitors; it does not warm the server-side cache.
//
// Run this immediately after every Marketing deploy (and after any
// revision change) so visitors never pay the cold-MISS cost:
//   node scripts/gcp/warm-marketing-images.mjs
//   node scripts/gcp/warm-marketing-images.mjs https://www.elevateforhumanity.org/ https://www.elevateforhumanity.org/programs
//
// TODO (needs workflow scope): add this as a post-deploy step in the
// Marketing release workflow so warming is automatic, not manual.

const DEFAULT_PAGES = ['https://www.elevateforhumanity.org/'];
const CONCURRENCY = 6;
const TIMEOUT_MS = 60_000;

const pages = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PAGES;

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&');
}

async function fetchText(url, timeoutMs = TIMEOUT_MS) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function warmOne(url) {
  const started = Date.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  await res.arrayBuffer();
  return { url, status: res.status, ms: Date.now() - started, bytes: Number(res.headers.get('content-length') || 0) };
}

async function runPool(items, worker, concurrency) {
  const results = [];
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      try {
        results.push(await worker(item));
      } catch (error) {
        results.push({ url: item, status: 0, ms: 0, error: String(error?.message || error) });
      }
    }
  });
  await Promise.all(runners);
  return results;
}

const failures = [];
for (const page of pages) {
  const html = await fetchText(page);
  const urls = [...new Set([...html.matchAll(/src="([^"]*\/_next\/image\?[^"]*)"/g)].map((m) => decodeEntities(m[1])))];
  const absolute = urls.map((p) => new URL(p, page).toString());
  console.log(`${page}: warming ${absolute.length} image variants`);
  const results = await runPool(absolute, warmOne, CONCURRENCY);
  for (const r of results.sort((a, b) => b.ms - a.ms)) {
    console.log(`  ${r.status} ${(r.ms / 1000).toFixed(2)}s ${r.url}${r.error ? ` ERROR ${r.error}` : ''}`);
    if (r.status !== 200) failures.push(r.url);
  }
}

if (failures.length) {
  console.error(`WARM FAILED for ${failures.length} URL(s)`);
  process.exit(1);
}
console.log('Warm complete: all variants served 200.');
