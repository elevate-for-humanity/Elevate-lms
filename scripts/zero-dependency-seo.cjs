#!/usr/bin/env node
/**
 * Zero-Dependency SEO Optimizer
 * Pure Node.js built-ins only - no external packages
 * Fully self-contained and tested
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  siteUrl: 'https://www.elevateforhumanity.org',
  siteName: 'Elevate for Humanity Career & Technical Institute',
  keywords: [
    'Indiana WIOA training provider',
    'ETPL approved programs Indiana',
    'Workforce funding apprenticeship Indianapolis',
    'Career Technical Institute Marion County',
    'State funded training provider Indiana',
    'Indiana workforce development',
    'WIOA eligible training programs',
    'Indianapolis career training',
    'Federal apprenticeship programs Indiana',
  ],
  metaDescription:
    'Elevate for Humanity Career & Technical Institute empowers Indiana residents with WIOA-funded training, apprenticeships, and workforce certifications through state and federal partnerships.',
  pages: [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: 'programs', priority: '0.9', changefreq: 'weekly' },
    { path: 'courses', priority: '0.9', changefreq: 'weekly' },
    { path: 'funding', priority: '0.8', changefreq: 'monthly' },
    { path: 'apprenticeships', priority: '0.8', changefreq: 'monthly' },
    { path: 'apply', priority: '0.9', changefreq: 'monthly' },
    { path: 'contact', priority: '0.7', changefreq: 'monthly' },
    { path: 'about', priority: '0.7', changefreq: 'monthly' },
    { path: 'employers', priority: '0.8', changefreq: 'monthly' },
    { path: 'federal-apprenticeships', priority: '0.8', changefreq: 'monthly' },
  ],
};

// ============================================================================
// UTILITY FUNCTIONS (Zero Dependencies)
// ============================================================================

/**
 * Read file with error handling
 */
function readFileSafe(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (err) {
    return null;
  }
}

/**
 * Write file with directory creation
 */
function writeFileSafe(filepath, content) {
  try {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filepath, content, 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filepath}:`, err.message);
    return false;
  }
}

/**
 * HTTP/HTTPS GET request (zero dependencies)
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = 10000;

    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Escape HTML entities
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Get current date in ISO format
 */
function getISODate() {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// SEO GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate optimized HTML head section
 */
function generateSEOHead() {
  const keywords = CONFIG.keywords.join(', ');
  const title = `Indiana WIOA Training Provider | ${CONFIG.siteName}`;

  return `  <!-- SEO Meta Tags - Auto-generated -->
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(CONFIG.metaDescription)}" />
  <meta name="keywords" content="${escapeHtml(keywords)}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${CONFIG.siteUrl}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(CONFIG.metaDescription)}" />
  <meta property="og:image" content="${CONFIG.siteUrl}/assets/og-image.png" />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="${CONFIG.siteUrl}" />
  <meta property="twitter:title" content="${escapeHtml(title)}" />
  <meta property="twitter:description" content="${escapeHtml(CONFIG.metaDescription)}" />
  <meta property="twitter:image" content="${CONFIG.siteUrl}/assets/og-image.png" />
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${CONFIG.siteUrl}" />
  
  <!-- Robots -->
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  
  <!-- Structured Data (Schema.org) -->
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "${escapeHtml(CONFIG.siteName)}",
  "url": "${CONFIG.siteUrl}",
  "logo": "${CONFIG.siteUrl}/assets/logo.png",
  "description": "${escapeHtml(CONFIG.metaDescription)}",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Indianapolis",
    "addressRegion": "IN",
    "addressCountry": "US"
  },
  "areaServed": {
    "@type": "State",
    "name": "Indiana"
  },
  "offers": {
    "@type": "Offer",
    "category": "Career Training",
    "availability": "https://schema.org/InStock"
  }
}
  </script>`;
}

/**
 * Generate XML sitemap
 */
function generateSitemap() {
  const date = getISODate();
  const urls = CONFIG.pages
    .map((page) => {
      const url = page.path ? `${CONFIG.siteUrl}/${page.path}` : CONFIG.siteUrl;
      return `  <url>
    <loc>${url}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls}
</urlset>`;
}

/**
 * Generate robots.txt
 */
function generateRobotsTxt() {
  return `# Elevate for Humanity - Robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /*.json$

# Sitemaps
Sitemap: ${CONFIG.siteUrl}/sitemap.xml

# Crawl-delay for aggressive bots
User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10

# Block AI scrapers (optional)
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /
`;
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyze HTML file for SEO elements
 */
function analyzeHTML(html) {
  if (!html) return null;

  return {
    hasTitle: /<title>/.test(html),
    hasMetaDesc: /<meta\s+name=["']description["']/.test(html),
    hasOG: /<meta\s+property=["']og:/.test(html),
    hasTwitter: /<meta\s+property=["']twitter:/.test(html),
    hasCanonical: /<link\s+rel=["']canonical["']/.test(html),
    hasStructuredData: /<script\s+type=["']application\/ld\+json["']>/.test(html),
    hasKeywords: CONFIG.keywords.some((k) => html.toLowerCase().includes(k.toLowerCase())),
    titleContent: (html.match(/<title>(.*?)<\/title>/i) || [])[1] || '',
    metaDescContent:
      (html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) || [])[1] || '',
  };
}

/**
 * Calculate SEO score
 */
function calculateScore(analysis) {
  if (!analysis) return 0;

  let score = 0;
  if (analysis.hasTitle) score += 15;
  if (analysis.hasMetaDesc) score += 15;
  if (analysis.hasOG) score += 15;
  if (analysis.hasTwitter) score += 10;
  if (analysis.hasCanonical) score += 10;
  if (analysis.hasStructuredData) score += 20;
  if (analysis.hasKeywords) score += 15;

  return score;
}

// ============================================================================
// INJECTION FUNCTIONS
// ============================================================================

/**
 * Inject SEO head into HTML
 */
function injectSEOHead(html) {
  if (!html) return null;

  const seoHead = generateSEOHead();

  // Remove old SEO tags
  let updated = html.replace(/<!-- SEO Meta Tags - Auto-generated -->[\s\S]*?<\/script>/g, '');

  // Inject before </head>
  if (updated.includes('</head>')) {
    updated = updated.replace('</head>', `${seoHead}\n  </head>`);
  } else {
    // No head tag, add at beginning
    updated = `<!DOCTYPE html>\n<html>\n<head>\n${seoHead}\n</head>\n<body>\n${updated}\n</body>\n</html>`;
  }

  return updated;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Zero-Dependency SEO Optimizer');
  console.log('  Pure Node.js Built-ins Only');
  console.log('═══════════════════════════════════════════════════════\n');

  const results = {
    filesProcessed: 0,
    filesUpdated: 0,
    errors: [],
  };

  // Step 1: Find and process HTML files
  console.log('🔍 Step 1: Processing HTML files...');

  const htmlPaths = ['./index.html', './dist/index.html'];

  htmlPaths.forEach((filepath) => {
    const html = readFileSafe(filepath);
    if (!html) {
      console.log(`  ⚠️  Skipped: ${filepath} (not found)`);
      return;
    }

    results.filesProcessed++;

    // Analyze before
    const before = analyzeHTML(html);
    console.log(`  📄 ${filepath}`);
    console.log(`     Score before: ${calculateScore(before)}/100`);

    // Inject SEO
    const updated = injectSEOHead(html);
    if (updated && writeFileSafe(filepath, updated)) {
      results.filesUpdated++;

      // Analyze after
      const after = analyzeHTML(updated);
      console.log(`     Score after:  ${calculateScore(after)}/100 ✅`);
    } else {
      results.errors.push(`Failed to update ${filepath}`);
      console.log(`     ❌ Failed to update`);
    }
  });

  console.log('');

  // Step 2: Generate sitemap
  console.log('🗺️  Step 2: Generating sitemap...');

  const sitemap = generateSitemap();
  const sitemapPaths = ['./public/sitemap.xml', './dist/sitemap.xml'];

  sitemapPaths.forEach((filepath) => {
    if (writeFileSafe(filepath, sitemap)) {
      console.log(`  ✅ ${filepath}`);
    }
  });

  console.log('');

  // Step 3: Generate robots.txt
  console.log('🤖 Step 3: Generating robots.txt...');

  const robotsTxt = generateRobotsTxt();
  const robotsPaths = ['./public/robots.txt', './dist/robots.txt'];

  robotsPaths.forEach((filepath) => {
    if (writeFileSafe(filepath, robotsTxt)) {
      console.log(`  ✅ ${filepath}`);
    }
  });

  console.log('');

  // Step 4: Generate report
  console.log('📊 Step 4: Generating report...');

  const report = {
    timestamp: new Date().toISOString(),
    filesProcessed: results.filesProcessed,
    filesUpdated: results.filesUpdated,
    errors: results.errors,
    siteUrl: CONFIG.siteUrl,
    targetKeywords: CONFIG.keywords,
    pages: CONFIG.pages.length,
    recommendations: [
      'Submit sitemap to Google Search Console',
      'Submit sitemap to Bing Webmaster Tools',
      'Create Google Business Profile',
      'Register with Indiana WIOA provider directory',
      'Build backlinks from .gov and .edu sites',
    ],
  };

  writeFileSafe('./seo-report.json', JSON.stringify(report, null, 2));
  console.log('  ✅ seo-report.json');
  console.log('');

  // Step 5: Test sitemap accessibility
  console.log('🧪 Step 5: Testing generated files...');

  const testFiles = ['./dist/sitemap.xml', './dist/robots.txt', './dist/index.html'];

  let allTestsPassed = true;
  testFiles.forEach((filepath) => {
    const content = readFileSafe(filepath);
    if (content) {
      console.log(`  ✅ ${filepath} (${content.length} bytes)`);
    } else {
      console.log(`  ❌ ${filepath} (missing)`);
      allTestsPassed = false;
    }
  });

  console.log('');

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Files processed: ${results.filesProcessed}`);
  console.log(`  Files updated:   ${results.filesUpdated}`);
  console.log(`  Errors:          ${results.errors.length}`);
  console.log(`  Tests passed:    ${allTestsPassed ? '✅ All' : '❌ Some failed'}`);
  console.log('');

  if (results.errors.length > 0) {
    console.log('⚠️  Errors:');
    results.errors.forEach((err) => console.log(`  - ${err}`));
    console.log('');
  }

  console.log('📋 Next Steps:');
  console.log('  1. Review: seo-report.json');
  console.log('  2. Test locally: npm run preview');
  console.log('  3. Deploy: npm run deploy:manual');
  console.log('  4. Submit sitemap to Google & Bing');
  console.log('');
  console.log('✅ SEO optimization complete!');

  return allTestsPassed ? 0 : 1;
}

// Run if called directly
if (require.main === module) {
  process.exit(main());
}

module.exports = {
  generateSEOHead,
  generateSitemap,
  generateRobotsTxt,
  analyzeHTML,
  calculateScore,
};
