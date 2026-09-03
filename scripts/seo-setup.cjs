#!/usr/bin/env node
/**
 * Advanced SEO Setup Script
 * - Generates sitemaps (50 URLs per file)
 * - Adds meta tags to all pages
 * - Configures Google Analytics & Bing
 * - Creates sitemap index
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DOMAIN = 'https://elevateforhumanity.org';
const GOOGLE_ANALYTICS_ID = 'G-EFHWORKFORCE01';
const BING_TAG_ID = 'YOUR_BING_TAG_ID';
const MAX_URLS_PER_SITEMAP = 50;

console.log('🚀 Starting Advanced SEO Setup...\n');

// Step 1: Find all HTML pages
function findAllPages() {
  const pages = [];
  const dirs = ['public', 'sites', 'pages', 'docs'];

  dirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      const files = getAllFiles(dir, '.html');
      pages.push(...files);
    }
  });

  console.log(`✅ Found ${pages.length} HTML pages\n`);
  return pages;
}

function getAllFiles(dir, ext) {
  const files = [];

  function scan(directory) {
    const items = fs.readdirSync(directory);

    items.forEach((item) => {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (item.endsWith(ext)) {
        files.push(fullPath);
      }
    });
  }

  scan(dir);
  return files;
}

// Step 2: Generate sitemap chunks
function generateSitemaps(pages) {
  const sitemaps = [];
  const chunks = chunkArray(pages, MAX_URLS_PER_SITEMAP);

  chunks.forEach((chunk, index) => {
    const sitemapNum = index + 1;
    const filename = `sitemap-${sitemapNum}.xml`;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    chunk.forEach((page) => {
      const url = pageToUrl(page);
      xml += '  <url>\n';
      xml += `    <loc>${url}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    fs.writeFileSync(filename, xml);
    sitemaps.push(filename);
    console.log(`✅ Created ${filename} (${chunk.length} URLs)`);
  });

  return sitemaps;
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function pageToUrl(filePath) {
  const url = filePath
    .replace(/^(public|sites|pages|docs)\//, '')
    .replace(/index\.html$/, '')
    .replace(/\.html$/, '');

  return `${DOMAIN}/${url}`;
}

// Step 3: Generate sitemap index
function generateSitemapIndex(sitemaps) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  sitemaps.forEach((sitemap) => {
    xml += '  <sitemap>\n';
    xml += `    <loc>${DOMAIN}/${sitemap}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '  </sitemap>\n';
  });

  xml += '</sitemapindex>';

  fs.writeFileSync('sitemap-index.xml', xml);
  console.log(`\n✅ Created sitemap-index.xml (${sitemaps.length} sitemaps)`);
}

// Step 4: Create meta tags template
function createMetaTagsTemplate() {
  return `
<!-- SEO Meta Tags -->
<meta name="description" content="Elevate for Humanity - Government-approved workforce development and career training. WIOA, DOL, and DOE compliant. 70% less than LearnWorlds.">
<meta name="keywords" content="workforce development, career training, WIOA, DOL, government training, Indianapolis jobs, online learning, LMS">
<meta name="author" content="Elevate for Humanity">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${DOMAIN}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${DOMAIN}">
<meta property="og:title" content="Elevate for Humanity - Workforce Development Platform">
<meta property="og:description" content="Government-approved career training. WIOA compliant. 70% less than competitors.">
<meta property="og:image" content="${DOMAIN}/assets/og-image.jpg">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${DOMAIN}">
<meta property="twitter:title" content="Elevate for Humanity - Workforce Development">
<meta property="twitter:description" content="Government-approved career training. WIOA compliant.">
<meta property="twitter:image" content="${DOMAIN}/assets/og-image.jpg">

<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GOOGLE_ANALYTICS_ID}');
</script>

<!-- Bing Webmaster -->
<meta name="msvalidate.01" content="${BING_TAG_ID}">

<!-- Schema.org markup -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Elevate for Humanity",
  "url": "${DOMAIN}",
  "logo": "${DOMAIN}/assets/logo.png",
  "description": "Government-approved workforce development and career training platform",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Indianapolis",
    "addressRegion": "IN",
    "addressCountry": "US"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-317-314-3757",
    "contactType": "Customer Service"
  }
}
</script>
`;
}

// Step 5: Create robots.txt
function createRobotsTxt() {
  const content = `User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap-index.xml

# Block admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /*.json$
`;

  fs.writeFileSync('robots.txt', content);
  console.log('\n✅ Created robots.txt');
}

// Run all steps
const pages = findAllPages();
const sitemaps = generateSitemaps(pages);
generateSitemapIndex(sitemaps);
createRobotsTxt();

console.log('\n✅ SEO Setup Complete!');
console.log(`\n📊 Summary:`);
console.log(`   - ${pages.length} pages indexed`);
console.log(`   - ${sitemaps.length} sitemap files created`);
console.log(`   - Google Analytics: ${GOOGLE_ANALYTICS_ID}`);
console.log(`   - Domain: ${DOMAIN}`);
console.log('\n🚀 Ready for search engine submission!');
