#!/usr/bin/env node
// Fill the Next.js image optimizer cache on a fresh revision so the first
// visitors do not wait for every photo to be resized and re-encoded.
const origin = (process.env.WARM_ORIGIN || 'https://www.elevateforhumanity.org').replace(/\/$/, '');
const pages = (
  process.env.WARM_PAGES ||
  '/,/programs,/programs/hvac-technician,/programs/medical-assistant,/programs/it-help-desk,/programs/cna,/barber-and-beauty-apprenticeship,/host-shops,/testing,/funding,/apply,/employer,/about'
)
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);
const accepts = ['image/avif,image/webp,*/*'];
// Phone (1x/2x/3x) and desktop widths; other srcset entries are rarely requested.
const widths = new Set(
  (process.env.WARM_WIDTHS || '640,750,828,1080,1200,1920').split(',').map((w) => w.trim()),
);
const timeout = Number(process.env.WARM_TIMEOUT_MS || 20000);
const concurrency = Number(process.env.WARM_CONCURRENCY || 8);

const decode = (value) => value.replace(/&amp;/g, '&');
const imageUrls = new Set();
for (const page of pages) {
  try {
    const res = await fetch(origin + page, { signal: AbortSignal.timeout(timeout) });
    const html = await res.text();
    for (const match of html.matchAll(/\/_next\/image\?url=[^"'\s,]+/g)) {
      const url = decode(match[0]);
      if (widths.has(new URL(url, origin).searchParams.get('w') ?? '')) imageUrls.add(url);
    }
  } catch (error) {
    console.warn(`warm: could not read ${page}: ${error instanceof Error ? error.message : error}`);
  }
}

const queue = [...imageUrls].flatMap((url) => accepts.map((accept) => ({ url, accept })));
let warmed = 0;
let failed = 0;
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      try {
        const res = await fetch(origin + job.url, {
          headers: { accept: job.accept },
          signal: AbortSignal.timeout(timeout),
        });
        await res.arrayBuffer();
        if (res.ok) warmed += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }
  }),
);
console.log(JSON.stringify({ origin, pages: pages.length, images: imageUrls.size, warmed, failed }));
