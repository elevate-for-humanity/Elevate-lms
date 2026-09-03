#!/usr/bin/env node

/**
 * Multi-tenant Enterprise Engine
 * For each tenant: crawl -> tiny sitemaps (section+month) -> latest feed -> robots -> schema -> redirects -> (optional) IndexNow ping
 *
 * Usage:
 *   node scripts/tenant-engine.mjs
 *
 * Requires: node >= 18
 *   npm i -D cheerio node-fetch@3 robots-parser fast-xml-parser
 */

import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

// Use built-in fetch for Node 18+
const fetch = globalThis.fetch;

// Basic XML builder (no external dependency needed)
class XMLBuilder {
  constructor() {}
  build(obj) {
    if (obj.urlset) {
      const urls = obj.urlset.url
        .map(
          (u) =>
            `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`
        )
        .join('\n');
      return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
    }
    if (obj.sitemapindex) {
      const maps = obj.sitemapindex.sitemap
        .map(
          (s) =>
            `  <sitemap>\n    <loc>${s.loc}</loc>\n    <lastmod>${s.lastmod}</lastmod>\n  </sitemap>`
        )
        .join('\n');
      return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${maps}\n</sitemapindex>`;
    }
    return '';
  }
}

// Basic robots parser (no external dependency needed)
const robotsParser = () => ({ isAllowed: () => true });

const TENANTS_PATH = process.env.TENANTS_PATH || 'tenants.json';
if (!fs.existsSync(TENANTS_PATH)) {
  console.error(`Missing ${TENANTS_PATH}. Create tenants.json (see example).`);
  process.exit(1);
}

const tenants = JSON.parse(fs.readFileSync(TENANTS_PATH, 'utf8'));
const NOW = new Date();
const ISO = NOW.toISOString().slice(0, 10);

const builder = new XMLBuilder();

const classifySection = (pathname) => {
  if (
    pathname === '/' ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/sitemap')
  )
    return 'marketing';
  if (pathname.startsWith('/programs/') || pathname === '/programs/')
    return 'programs';
  if (pathname.startsWith('/blog/') || pathname === '/blog/') return 'blog';
  if (pathname.startsWith('/employers/') || pathname === '/employers/')
    return 'employers';
  return 'misc';
};

const normalize = (base, url) => {
  try {
    const x = new URL(url, base);
    x.hash = '';
    if (!x.pathname.match(/\.[a-z0-9]{2,5}$/i))
      x.pathname = x.pathname.replace(/\/$/, '') + '/';
    return x.toString();
  } catch {
    return null;
  }
};

async function processTenant(t) {
  const BASE = t.base.replace(/\/$/, '');
  const OUTROOT = t.out;
  const SM_DIR = path.join(OUTROOT, 'sitemaps');
  const CHUNK = Number(t.chunk || 1000);
  const LATEST = Number(t.latest || 1000);
  fs.mkdirSync(SM_DIR, { recursive: true });


  // --- robots.txt fetch for allow rules ---
  const robotsUrl = `${BASE}/robots.txt`;
  let robots = robotsParser();
  try {
    const txt = await fetch(robotsUrl).then((r) => r.text());
    robots = robotsParser(robotsUrl, txt);
  } catch {
  }

  // --- Crawl (BFS) same-origin HTML pages ---
  const q = [normalize(BASE, '/')];
  const seen = new Map(); // url -> {status,lastmod}
  const sameHost = (u) => {
    try {
      return new URL(u, BASE).host === new URL(BASE).host;
    } catch {
      return false;
    }
  };

  let crawled = 0;
  const maxPages = 1000; // Safety limit

  while (q.length && crawled < maxPages) {
    const url = q.shift();
    if (!url || seen.has(url)) continue;

    if (!robots.isAllowed(url, '*')) {
      seen.set(url, { status: 999 });
      continue;
    }

    try {
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': 'EFH-Multi-Tenant-Engine/1.0' },
      });
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      seen.set(url, {
        status: res.status,
        lastmod: res.headers.get('last-modified'),
      });

      if (res.status >= 400 || !ct.includes('text/html')) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      $('a[href]').each((_, a) => {
        const href = $(a).attr('href');
        if (!href) return;
        try {
          const abs = new URL(href, url).toString();
          if (!sameHost(abs)) return;
          const n = normalize(BASE, abs);
          if (n && !seen.has(n) && !q.includes(n)) q.push(n);
        } catch {}
      });

      crawled++;
    } catch (error) {
      seen.set(url, { status: 0 });
    }
  }


  // --- Keep good pages only ---
  const all = [...seen.entries()]
    .filter(([, m]) => m.status && m.status < 400)
    .map(([url, m]) => ({ url, last: m.lastmod ? new Date(m.lastmod) : NOW }));


  // --- Section buckets ---
  const buckets = {
    marketing: [],
    programs: [],
    blog: [],
    employers: [],
    misc: [],
  };
  for (const it of all) {
    const p = new URL(it.url).pathname;
    buckets[classifySection(p)].push(it);
  }

    `   📂 Section distribution:`,
    Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length]))
  );

  // --- Helpers ---
  const writeSM = (items, file) => {
    const data = {
      urlset: {
        url: items.map((i) => ({
          loc: i.url,
          lastmod: i.last ? i.last.toISOString() : ISO,
        })),
      },
    };
    fs.writeFileSync(path.join(SM_DIR, file), builder.build(data));
  };

  const master = [];
  const addMaster = (rel) => {
    const relRoot = SM_DIR.replace(/^\.?\/*/, '').replace(
      /^sites\/[^/]+\//,
      ''
    ); // expose under domain root
    const loc = `${BASE}/${path.posix.join(relRoot, rel).replace(/\\/g, '/')}`;
    master.push(loc);
  };

  // --- Per-section, per-month, chunked ---
  const byMonth = (arr) => {
    const m = new Map();
    for (const it of arr) {
      const d = it.last || NOW;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(it);
    }
    return m;
  };

  let sitemapCount = 0;
  for (const [section, list] of Object.entries(buckets)) {
    if (!list.length) continue;
    const monthly = byMonth(list);
    for (const [ym, items] of monthly) {
      for (let i = 0; i < items.length; i += CHUNK) {
        const slice = items.slice(i, i + CHUNK);
        const name = `sitemap-${section}-${ym}-${Math.floor(i / CHUNK) + 1}.xml`;
        writeSM(slice, name);
        addMaster(name);
        sitemapCount++;
      }
    }
  }

  // --- Latest updates feed ---
  const latest = [...all]
    .sort((a, b) => (b.last?.getTime() || 0) - (a.last?.getTime() || 0))
    .slice(0, LATEST);
  writeSM(latest, 'sitemap-latest.xml');
  addMaster('sitemap-latest.xml');
  sitemapCount++;


  // --- Master index & robots ---
  const idx = {
    sitemapindex: { sitemap: master.map((m) => ({ loc: m, lastmod: ISO })) },
  };
  fs.writeFileSync(path.join(OUTROOT, 'sitemap_index.xml'), builder.build(idx));
  fs.writeFileSync(
    path.join(OUTROOT, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap_index.xml\n`
  );

  // --- Organization JSON-LD (basic, override later if needed) ---
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Elevate for Humanity Career & Training Institute',
    url: BASE,
    sameAs: [
      'https://www.facebook.com/61578240192934/',
      'https://www.linkedin.com/company/elevateforhumanity',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+1-317-555-1234',
        contactType: 'customer service',
        availableLanguage: 'English',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Indianapolis',
      addressRegion: 'IN',
      addressCountry: 'US',
    },
    description:
      'Enterprise-grade career training and workforce development programs',
    tenant: t.slug,
    generated: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(OUTROOT, 'schema.json'),
    JSON.stringify(orgSchema, null, 2)
  );

  // --- Netlify redirects (baseline legacy → new) ---
  const redirects = `/career-uplift-services/certify-and-thrive-program   /programs/cybersecurity/ 301!
/career-uplift-services/secure-your-future--security---safety-training /programs/electrical-trades/ 301!
/career-uplift-services/healthcare-training                         /programs/healthcare-cna/ 301!
/career-uplift-services/cloud-computing-training                    /programs/cloud-computing/ 301!
/career-uplift-services/construction-skills-training                /programs/construction/ 301!
/career-uplift-services/beauty-and-wellness                         /programs/beauty-wellness/ 301!
/blog.php  /blog/ 301!
/blog?p=:any  /blog/ 301!
/programs  /programs/ 301!

# Security headers
/*  /index.html  200
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin`;
  fs.writeFileSync(path.join(OUTROOT, '_redirects'), redirects);

  // --- Pings (Google + Bing) ---
  for (const ping of [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(`${BASE}/sitemap_index.xml`)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(`${BASE}/sitemap_index.xml`)}`,
  ]) {
    try {
      const r = await fetch(ping);
        `   ✅ Ping ${ping.includes('google') ? 'Google' : 'Bing'}: ${r.status}`
      );
    } catch (e) {
      console.warn(`   ⚠️  Ping failed: ${e.message}`);
    }
  }

  // --- IndexNow (optional) ---
  if (t.indexnowKey) {
    try {
      const payload = {
        host: new URL(BASE).host,
        key: t.indexnowKey,
        keyLocation: `${BASE}/${t.indexnowKey}.txt`,
        urlList: [
          `${BASE}/sitemap_index.xml`,
          ...latest.slice(0, 10).map((x) => x.url),
        ],
      };
      const r = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Create IndexNow key file
      fs.writeFileSync(
        path.join(OUTROOT, `${t.indexnowKey}.txt`),
        t.indexnowKey
      );
    } catch (e) {
      console.warn(`   ⚠️  IndexNow failed: ${e.message}`);
    }
  }

  return {
    slug: t.slug,
    out: OUTROOT,
    base: BASE,
    total: all.length,
    files: master.length,
    sections: Object.fromEntries(
      Object.entries(buckets).map(([k, v]) => [k, v.length])
    ),
  };
}

// Run all tenants

const results = [];
for (const t of tenants) {
  // Ensure publish dir exists
  fs.mkdirSync(t.out, { recursive: true });
  const res = await processTenant(t);
  results.push(res);
    `✅ Tenant ${t.slug} complete: ${res.total} pages, ${res.files} sitemaps`
  );
}

// Write manifest
fs.writeFileSync('tenant-manifest.json', JSON.stringify(results, null, 2));

console.table(
  results.map((r) => ({
    slug: r.slug,
    pages: r.total,
    sitemaps: r.files,
    out: r.out,
    marketing: r.sections.marketing || 0,
    programs: r.sections.programs || 0,
    blog: r.sections.blog || 0,
  }))
);
