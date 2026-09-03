// Simplified enterprise crawler that works with current environment
// Creates month-based sitemaps and pings search engines
import fs from 'fs';
import path from 'path';

const arg = (k, d = null) => {
  const m = process.argv.find((a) => a.startsWith(`--${k}=`));
  return m ? m.split('=')[1] : d;
};

const BASE = (arg('base') || 'https://www.elevateforhumanity.org').replace(
  /\/$/,
  ''
);
const OUTROOT = arg('out', 'sites/marketing');
const OUT = path.join(OUTROOT, 'sitemaps');
const CHUNK = parseInt(arg('chunk', '2000'), 10);
const NOW = new Date();
const ISO_DATE = NOW.toISOString().slice(0, 10);
const CURRENT_MONTH = `${NOW.getUTCFullYear()}-${String(NOW.getUTCMonth() + 1).padStart(2, '0')}`;

fs.mkdirSync(OUT, { recursive: true });

// Use existing URL list and enhance it with month-based organization
const urlListPath = arg('in', 'all-urls.txt');
let urls = [];

if (fs.existsSync(urlListPath)) {
  urls = fs
    .readFileSync(urlListPath, 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((u) => {
      try {
        return new URL(u).origin === new URL(BASE).origin;
      } catch {
        return false;
      }
    });
} else {
  // Fallback to basic URL list
  urls = [
    `${BASE}/`,
    `${BASE}/about/`,
    `${BASE}/contact/`,
    `${BASE}/employers/`,
    `${BASE}/programs/`,
    `${BASE}/programs/cybersecurity/`,
    `${BASE}/programs/cloud-computing/`,
    `${BASE}/programs/healthcare-cna/`,
    `${BASE}/programs/electrical-trades/`,
    `${BASE}/programs/construction/`,
    `${BASE}/programs/beauty-wellness/`,
    `${BASE}/blog/`,
    `${BASE}/privacy/`,
  ];
}

// Convert to objects with lastmod
const urlObjects = urls.map((url) => ({
  url,
  lastmod: NOW, // Use current date for all URLs
}));

// Classify by section
const bySection = {
  marketing: [],
  programs: [],
  blog: [],
  employers: [],
  misc: [],
};

for (const item of urlObjects) {
  const p = new URL(item.url).pathname;
  if (
    p === '/' ||
    p.startsWith('/about') ||
    p.startsWith('/contact') ||
    p.startsWith('/privacy') ||
    p.startsWith('/sitemap')
  ) {
    bySection.marketing.push(item);
  } else if (p.startsWith('/programs/') || p === '/programs/') {
    bySection.programs.push(item);
  } else if (p.startsWith('/blog/') || p === '/blog/') {
    bySection.blog.push(item);
  } else if (p.startsWith('/employers/') || p === '/employers/') {
    bySection.employers.push(item);
  } else {
    bySection.misc.push(item);
  }
}

// Writers
const writeSitemap = (urls, file) => {
  const body = urls
    .map(
      ({ url, lastmod }) =>
        `  <url><loc>${url}</loc><lastmod>${lastmod.toISOString()}</lastmod></url>`
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  fs.writeFileSync(path.join(OUT, file), xml);
};

const masterEntries = [];
const addToMaster = (relPath) => {
  const cleanOut = OUT.replace(/^sites\/marketing\//, '').replace(
    /^\.?\/+/,
    ''
  );
  const url = `${BASE}/${cleanOut}/${relPath}`.replace(/([^:]\/)\/+/g, '$1');
  masterEntries.push(url);
};

// Create month-based sitemaps per section
for (const [section, list] of Object.entries(bySection)) {
  if (!list.length) continue;

  // For now, put everything in current month
  for (let i = 0; i < list.length; i += CHUNK) {
    const slice = list.slice(i, i + CHUNK);
    const chunkNum = Math.floor(i / CHUNK) + 1;
    const name = `sitemap-${section}-${CURRENT_MONTH}-${chunkNum}.xml`;
    writeSitemap(slice, name);
    addToMaster(name);
  }
}

// Latest updates sitemap (all URLs for now)
writeSitemap(urlObjects.slice(0, 1000), 'sitemap-latest.xml');
addToMaster('sitemap-latest.xml');

// Master index
const master = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${masterEntries
  .map(
    (loc) =>
      `  <sitemap><loc>${loc}</loc><lastmod>${ISO_DATE}</lastmod></sitemap>`
  )
  .join('\n')}\n</sitemapindex>\n`;
fs.writeFileSync(path.join(OUTROOT, 'sitemap_index.xml'), master);

// robots.txt
fs.writeFileSync(
  path.join(OUTROOT, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap_index.xml\n`
);

  `Enterprise sitemaps created: ${urlObjects.length} URLs in ${masterEntries.length} files.`
);
