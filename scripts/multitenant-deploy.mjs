#!/usr/bin/env node

/**
 * Multi-tenant Quick Deploy Script
 * Generates enterprise assets for all tenants and deploys immediately
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOW = new Date();
const ISO = NOW.toISOString().slice(0, 10);

// Load tenants configuration
const tenants = JSON.parse(fs.readFileSync('tenants.json', 'utf8'));


const results = [];

for (const tenant of tenants) {

  const BASE = tenant.base;
  const OUT = tenant.out;
  const SM_DIR = path.join(OUT, 'sitemaps');

  // Ensure directories exist
  fs.mkdirSync(SM_DIR, { recursive: true });


  // Generate sample URLs for this tenant
  const sampleUrls = [
    { url: `${BASE}/`, lastmod: ISO },
    { url: `${BASE}/about/`, lastmod: ISO },
    { url: `${BASE}/contact/`, lastmod: ISO },
    { url: `${BASE}/programs/`, lastmod: ISO },
    { url: `${BASE}/programs/cybersecurity/`, lastmod: ISO },
    { url: `${BASE}/programs/healthcare-cna/`, lastmod: ISO },
    { url: `${BASE}/programs/electrical-trades/`, lastmod: ISO },
    { url: `${BASE}/programs/construction/`, lastmod: ISO },
    { url: `${BASE}/programs/beauty-wellness/`, lastmod: ISO },
    { url: `${BASE}/blog/`, lastmod: ISO },
    { url: `${BASE}/employers/`, lastmod: ISO },
  ];

  // Generate ultra-tiny sitemap
  const generateSitemap = (urls, filename) => {
    const urlEntries = urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.url}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    fs.writeFileSync(path.join(SM_DIR, filename), xml);
    return `${BASE}/sitemaps/${filename}`;
  };

  // Generate section-based sitemaps
  const marketingUrls = sampleUrls.filter(
    (u) =>
      u.url.includes('/about') ||
      u.url.includes('/contact') ||
      u.url === `${BASE}/`
  );
  const marketingSitemap = generateSitemap(
    marketingUrls,
    'sitemap-marketing-2025-09-1.xml'
  );

  const programUrls = sampleUrls.filter((u) => u.url.includes('/programs'));
  const programsSitemap = generateSitemap(
    programUrls,
    'sitemap-programs-2025-09-1.xml'
  );

  const latestSitemap = generateSitemap(
    sampleUrls.slice(0, 5),
    'sitemap-latest.xml'
  );

  // Generate master sitemap index
  const masterSitemaps = [marketingSitemap, programsSitemap, latestSitemap];
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${masterSitemaps
  .map(
    (url) =>
      `  <sitemap>\n    <loc>${url}</loc>\n    <lastmod>${ISO}</lastmod>\n  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;

  fs.writeFileSync(path.join(OUT, 'sitemap_index.xml'), indexXml);

  // Generate enterprise robots.txt
  const robotsContent = `User-agent: *
Allow: /

# Multi-tenant enterprise sitemaps
Sitemap: ${BASE}/sitemap_index.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Tenant: ${tenant.slug}
`;

  fs.writeFileSync(path.join(OUT, 'robots.txt'), robotsContent);

  // Generate tenant-specific schema
  const schema = {
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
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Indianapolis',
      addressRegion: 'IN',
      addressCountry: 'US',
    },
    description:
      'Multi-tenant enterprise-grade career training and workforce development programs',
    tenant: {
      slug: tenant.slug,
      base: tenant.base,
      chunkSize: tenant.chunk,
      generated: new Date().toISOString(),
    },
  };

  fs.writeFileSync(
    path.join(OUT, 'schema.json'),
    JSON.stringify(schema, null, 2)
  );

  // Generate tenant-specific redirects
  const redirects = `# Multi-tenant enterprise redirects for ${tenant.slug}
/career-uplift-services/certify-and-thrive-program   /programs/cybersecurity/ 301!
/career-uplift-services/secure-your-future--security---safety-training /programs/electrical-trades/ 301!
/career-uplift-services/healthcare-training          /programs/healthcare-cna/ 301!
/career-uplift-services/cloud-computing-training     /programs/cloud-computing/ 301!
/career-uplift-services/construction-skills-training /programs/construction/ 301!
/career-uplift-services/beauty-and-wellness          /programs/beauty-wellness/ 301!

# Blog redirects
/blog.php /blog/ 301!
/blog?p=:any /blog/ 301!

# Clean URL patterns
/programs/:program/index.html /programs/:program/ 301!

# Multi-tenant security headers
/*  /index.html  200
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  X-Tenant: ${tenant.slug}
`;

  fs.writeFileSync(path.join(OUT, '_redirects'), redirects);

  // Generate IndexNow key file if configured
  if (tenant.indexnowKey) {
    fs.writeFileSync(
      path.join(OUT, `${tenant.indexnowKey}.txt`),
      tenant.indexnowKey
    );
  }

  const result = {
    slug: tenant.slug,
    base: tenant.base,
    out: tenant.out,
    pages: sampleUrls.length,
    sitemaps: masterSitemaps.length,
    chunkSize: tenant.chunk,
    generated: new Date().toISOString(),
  };

  results.push(result);

    `   🗂️  Files: sitemap_index.xml, robots.txt, schema.json, _redirects`
  );
}

// Generate tenant manifest
const manifest = {
  generated: new Date().toISOString(),
  engine: 'EFH-Multi-Tenant-Deploy/1.0',
  tenants: results,
  summary: {
    totalTenants: results.length,
    totalPages: results.reduce((sum, r) => sum + r.pages, 0),
    totalSitemaps: results.reduce((sum, r) => sum + r.sitemaps, 0),
  },
  revenueModel: {
    singleTenant: '$5,000',
    multiTenant: '$25,000',
    enterpriseSaaS: '$50,000',
    whiteLabel: '$100,000',
  },
};

fs.writeFileSync('tenant-manifest.json', JSON.stringify(manifest, null, 2));

console.table(
  results.map((r) => ({
    tenant: r.slug,
    pages: r.pages,
    sitemaps: r.sitemaps,
    output: r.out,
  }))
);

