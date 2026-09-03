// Crawl your site, classify URLs by section & month, emit tiny sitemaps,
// a "latest-updates" sitemap, and ping search engines + IndexNow.
//
// Usage:
//  node scripts/enterprise-crawl.mjs \
//    --base=https://www.elevateforhumanity.org \
//    --out=sites/marketing \
//    --chunk=2000 \
//    --latest=1000 \
//    --indexnowKey=<YOUR_INDEXNOW_KEY>    # optional (create one at https://www.bing.com/indexnow)
//
// Requires: node >=18, deps: cheerio, node-fetch, robots-parser
import fs from 'fs';
import path from 'path';
// node >=18: npm i -D cheerio node-fetch@3 robots-parser
import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';

const arg = (k, d = null) => {
  const m = process.argv.find((a) => a.startsWith(`--${k}=`));
  return m ? m.split('=')[1] : d;
};
const BASE = (arg('base') || 'https://www.elevateforhumanity.org').replace(
  /\/$/,
  ''
);
const OUTROOT = arg('out', 'sites/marketing'); // publish root
const OUT = path.join(OUTROOT, 'sitemaps'); // sitemap folder
const CHUNK = parseInt(arg('chunk', '1000'), 10); // SUPER tiny chunks
const LATEST_N = parseInt(arg('latest', '1000'), 10); // latest feed size
const INDEXNOW = arg('indexnowKey', ''); // optional
const NOW = new Date();
const ISO_DATE = NOW.toISOString().slice(0, 10);

fs.mkdirSync(OUT, { recursive: true });

const robotsUrl = `${BASE}/robots.txt`;
let robots = robotsParser(robotsUrl, '');
try {
  robots = robotsParser(
    robotsUrl,
    await fetch(robotsUrl).then((r) => r.text())
  );
} catch {}

const normalize = (u) => {
  const x = new URL(u, BASE);
  x.hash = '';
  if (!x.pathname.match(/\.[a-z0-9]{2,5}$/i))
    x.pathname = x.pathname.replace(/\/$/, '') + '/';
  return x.toString();
};
const sameHost = (u) => {
  try {
    return new URL(u, BASE).host === new URL(BASE).host;
  } catch {
    return false;
  }
};

// Crawl (BFS)
const q = [normalize(BASE + '/')];
const seen = new Map(); // url -> {status,lastmod}
while (q.length) {
  const url = q.shift();
  if (seen.has(url)) continue;
  if (!robots.isAllowed(url, '*')) {
    seen.set(url, { status: 999 });
    continue;
  }
  try {
    const res = await fetch(url, { redirect: 'follow' });
    seen.set(url, {
      status: res.status,
      lastmod: res.headers.get('last-modified'),
    });
    if (res.status >= 400) continue;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('text/html')) continue;
    const html = await res.text();
    const $ = cheerio.load(html);
    $('a[href]').each((_, a) => {
      const href = $(a).attr('href');
      if (!href) return;
      try {
        const abs = new URL(href, url).toString();
        if (!sameHost(abs)) return;
        const n = normalize(abs);
        if (!seen.has(n) && !q.includes(n)) q.push(n);
      } catch {}
    });
  } catch {
    seen.set(url, { status: 0 });
  }
}

// Filter good HTML pages
const all = [...seen.entries()]
  .filter(([, m]) => m.status && m.status < 400)
  .map(([url, m]) => ({
    url,
    lastmod: m.lastmod ? new Date(m.lastmod) : null,
  }));

// Classify
const buckets = {
  marketing: [],
  programs: [],
  blog: [],
  employers: [],
  misc: [],
};
for (const it of all) {
  const p = new URL(it.url).pathname;
  if (
    p === '/' ||
    p.startsWith('/about') ||
    p.startsWith('/contact') ||
    p.startsWith('/privacy') ||
    p.startsWith('/sitemap')
  )
    buckets.marketing.push(it);
  else if (p.startsWith('/programs/') || p === '/programs/')
    buckets.programs.push(it);
  else if (p.startsWith('/blog/') || p === '/blog/') buckets.blog.push(it);
  else if (p.startsWith('/employers/') || p === '/employers/')
    buckets.employers.push(it);
  else buckets.misc.push(it);
}
const byMonth = (arr) => {
  const map = new Map();
  for (const it of arr) {
    const d = it.lastmod || NOW;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  }
  return map;
};

// writers
const writeSitemap = (urls, file) => {
  const body = urls
    .map(
      ({ url, lastmod }) =>
        `  <url><loc>${url}</loc>${lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ''}</url>`
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  fs.writeFileSync(path.join(OUT, file), xml);
};
const masterEntries = [];
const addToMaster = (relPath) =>
  masterEntries.push(
    `${BASE}/${path.posix
      .join(
        OUT.replace(/^sites\/marketing\//, '').replace(/^\.?\/*/, ''),
        relPath
      )
      .replace(/\\/g, '/')}`
  );

// per-section, per-month, chunked
for (const [section, list] of Object.entries(buckets)) {
  if (!list.length) continue;
  const monthly = byMonth(list);
  for (const [ym, items] of monthly.entries()) {
    // small chunks
    for (let i = 0; i < items.length; i += CHUNK) {
      const slice = items.slice(i, i + CHUNK);
      const name = `sitemap-${section}-${ym}-${Math.floor(i / CHUNK) + 1}.xml`;
      writeSitemap(slice, name);
      addToMaster(name);
    }
  }
}

// latest-updates sitemap (most recent N by lastmod, cross-section)
const sortedByFresh = [...all].sort(
  (a, b) => (b.lastmod?.getTime() || 0) - (a.lastmod?.getTime() || 0)
);
const latest = sortedByFresh.slice(0, LATEST_N);
writeSitemap(latest, `sitemap-latest.xml`);
addToMaster(`sitemap-latest.xml`);

// master index
const master = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${masterEntries
  .map(
    (loc) =>
      `  <sitemap><loc>${loc}</loc><lastmod>${ISO_DATE}</lastmod></sitemap>`
  )
  .join('\n')}\n</sitemapindex>\n`;
fs.writeFileSync(path.join(OUTROOT, 'sitemap_index.xml'), master);

// robots.txt (points to master)
fs.writeFileSync(
  path.join(OUTROOT, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap_index.xml\n`
);

// Pings: Google + Bing
for (const ping of [
  `https://www.google.com/ping?sitemap=${encodeURIComponent(`${BASE}/sitemap_index.xml`)}`,
  `https://www.bing.com/ping?sitemap=${encodeURIComponent(`${BASE}/sitemap_index.xml`)}`,
]) {
  try {
    const r = await fetch(ping);
  } catch (e) {
    console.warn('Ping failed', ping, e.message);
  }
}

// IndexNow (optional; use for recent URLs and/or master sitemap)
if (INDEXNOW) {
  const endpoint = 'https://api.indexnow.org/indexnow';
  const payload = {
    host: new URL(BASE).host,
    key: INDEXNOW,
    keyLocation: `${BASE}/${INDEXNOW}.txt`,
    urlList: [`${BASE}/sitemap_index.xml`, ...latest.map((x) => x.url)],
  };
  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn('IndexNow failed:', e.message);
  }
}

  `Crawled ${all.length} good pages. Wrote ${masterEntries.length} sitemap files + master index.`
);
