#!/usr/bin/env node
// 🔍 Verify SEO files are properly preserved in deployment
import fs from 'node:fs';
import path from 'node:path';

const DEPLOY_DIR = 'deploy';
const BASE_URL = 'https://www.elevateforhumanity.org';

const seoChecks = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: [],
};

function check(name, condition, message, isWarning = false) {
  if (condition) {
    seoChecks.passed++;
    seoChecks.details.push(`✅ ${name}: ${message}`);
  } else {
    if (isWarning) {
      seoChecks.warnings++;
      seoChecks.details.push(`⚠️  ${name}: ${message}`);
    } else {
      seoChecks.failed++;
      seoChecks.details.push(`❌ ${name}: ${message}`);
    }
  }
}

// 1. Check core SEO files
const robotsPath = path.join(DEPLOY_DIR, 'robots.txt');
check(
  'robots.txt',
  fs.existsSync(robotsPath),
  fs.existsSync(robotsPath)
    ? 'Present and accessible'
    : 'Missing - search engines cannot find crawl instructions',
);

const sitemapPath = path.join(DEPLOY_DIR, 'sitemap.xml');
check(
  'sitemap.xml',
  fs.existsSync(sitemapPath),
  fs.existsSync(sitemapPath)
    ? 'Present and accessible'
    : 'Missing - search engines cannot discover pages',
);

const sitemapsDir = path.join(DEPLOY_DIR, 'sitemaps');
check(
  'sitemaps directory',
  fs.existsSync(sitemapsDir),
  fs.existsSync(sitemapsDir)
    ? 'Present with split sitemaps'
    : 'Missing - sitemap organization lost',
);

// 2. Verify sitemap content
if (fs.existsSync(sitemapPath)) {
  try {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    check(
      'Sitemap format',
      sitemapContent.includes('<?xml') && sitemapContent.includes('sitemapindex'),
      sitemapContent.includes('sitemapindex')
        ? 'Valid XML sitemap index format'
        : 'Invalid or corrupted sitemap format',
    );

    check(
      'Sitemap URLs',
      sitemapContent.includes(BASE_URL),
      sitemapContent.includes(BASE_URL)
        ? 'Contains correct domain URLs'
        : 'Missing or incorrect domain URLs',
    );
  } catch (error) {
    check('Sitemap content', false, 'Could not read sitemap content');
  }
}

// 3. Check robots.txt content
if (fs.existsSync(robotsPath)) {
  try {
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    check(
      'Robots.txt format',
      robotsContent.includes('User-agent:') && robotsContent.includes('Sitemap:'),
      robotsContent.includes('Sitemap:')
        ? 'Valid format with sitemap reference'
        : 'Missing sitemap reference or invalid format',
    );

    check(
      'Robots.txt sitemap URL',
      robotsContent.includes(`${BASE_URL}/sitemap.xml`),
      robotsContent.includes(`${BASE_URL}/sitemap.xml`)
        ? 'Correct sitemap URL referenced'
        : 'Incorrect or missing sitemap URL',
    );
  } catch (error) {
    check('Robots.txt content', false, 'Could not read robots.txt content');
  }
}

// 4. Check individual sitemap files
if (fs.existsSync(sitemapsDir)) {
  const expectedSitemaps = ['core.xml', 'programs.xml', 'policies.xml', 'services.xml'];
  expectedSitemaps.forEach((sitemap) => {
    const sitemapFile = path.join(sitemapsDir, sitemap);
    check(
      `${sitemap}`,
      fs.existsSync(sitemapFile),
      fs.existsSync(sitemapFile) ? 'Present and accessible' : 'Missing from sitemaps directory',
      true, // Warning, not critical
    );
  });
}

// 5. Check page-level SEO
const pages = [
  { path: 'index.html', name: 'Homepage' },
  { path: 'programs/index.html', name: 'Programs page' },
  { path: 'contracts/index.html', name: 'Contracts page' },
  { path: 'students/index.html', name: 'Students page' },
  { path: 'contact/index.html', name: 'Contact page' },
];

pages.forEach(({ path: pagePath, name }) => {
  const fullPath = path.join(DEPLOY_DIR, pagePath);
  if (fs.existsSync(fullPath)) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');

      // Check for canonical URL
      check(
        `${name} canonical`,
        content.includes('rel="canonical"'),
        content.includes('rel="canonical"') ? 'Has canonical URL' : 'Missing canonical URL',
        true,
      );

      // Check for meta description
      check(
        `${name} meta description`,
        content.includes('name="description"'),
        content.includes('name="description"')
          ? 'Has meta description'
          : 'Missing meta description',
        true,
      );

      // Check for proper title
      check(
        `${name} title`,
        content.includes('<title>') && !content.includes('<title></title>'),
        content.includes('<title>') && !content.includes('<title></title>')
          ? 'Has proper title tag'
          : 'Missing or empty title tag',
      );
    } catch (error) {
      check(`${name} content`, false, 'Could not read page content', true);
    }
  } else {
    check(`${name} file`, false, 'Page file missing from deployment', true);
  }
});

// 6. Check for structured data
const indexPath = path.join(DEPLOY_DIR, 'index.html');
if (fs.existsSync(indexPath)) {
  try {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    check(
      'Structured data',
      indexContent.includes('application/ld+json'),
      indexContent.includes('application/ld+json')
        ? 'JSON-LD structured data present'
        : 'Missing structured data',
      true,
    );
  } catch (error) {
    check('Structured data', false, 'Could not verify structured data', true);
  }
}

// 7. Generate SEO verification report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    passed: seoChecks.passed,
    failed: seoChecks.failed,
    warnings: seoChecks.warnings,
    total: seoChecks.passed + seoChecks.failed + seoChecks.warnings,
  },
  status: seoChecks.failed === 0 ? 'PASS' : 'FAIL',
  details: seoChecks.details,
  recommendations: [],
};

// Add recommendations based on failures
if (seoChecks.failed > 0) {
  report.recommendations.push('Fix critical SEO issues before deployment');
}
if (seoChecks.warnings > 0) {
  report.recommendations.push('Address SEO warnings to improve search visibility');
}
if (!fs.existsSync(robotsPath)) {
  report.recommendations.push('Ensure robots.txt is included in deployment');
}
if (!fs.existsSync(sitemapPath)) {
  report.recommendations.push('Ensure sitemap.xml is generated and included');
}

// Save report
fs.writeFileSync(
  path.join(DEPLOY_DIR, 'seo-verification-report.json'),
  JSON.stringify(report, null, 2),
);

// Summary

if (report.recommendations.length > 0) {
  report.recommendations.forEach((rec) => console.log(`   • ${rec}`));
}

// Exit with appropriate code
process.exit(seoChecks.failed > 0 ? 1 : 0);
