#!/usr/bin/env npx ts-node

/**
 * SEO Validation CI Script
 *
 * Enforces SEO governance rules at build time.
 * Fails the build if any rule is violated.
 *
 * Rules enforced:
 * 1. Default noindex for new pages
 * 2. Index whitelist validation
 * 3. Blocked routes never indexed
 * 4. Canonical validation
 * 5. Metadata uniqueness
 * 6. Sitemap safety
 *
 * Usage: npx ts-node scripts/ci/seo-validation.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

// Configuration
const APP_DIR = path.join(process.cwd(), 'app');
const WHITELIST_PATH = path.join(process.cwd(), 'config', 'seo-index-whitelist.json');
const PRODUCTION_DOMAIN = 'https://www.elevateforhumanity.org';

// Blocked route patterns - NEVER indexable
const BLOCKED_PATTERNS = [
  '/auth',
  '/admin',
  '/dashboard',
  '/checkout',
  '/api',
  '/login',
  '/signup',
  '/reset',
  '/verify',
  '/instructor',
  '/creator',
  '/admin/staff-portal',
  '/program-holder',
  '/workforce-board',
  '/employer/dashboard',
  '/employer/analytics',
  '/lms/dashboard',
  '/lms/courses/',
  '/lms/assignments',
  '/lms/grades',
  '/lms/messages',
  '/lms/profile',
  '/lms/settings',
];

interface ValidationError {
  file: string;
  route: string;
  rule: string;
  message: string;
  fix: string;
}

interface PageMetadata {
  file: string;
  route: string;
  title?: string;
  description?: string;
  robots?: string;
  canonical?: string;
}

const errors: ValidationError[] = [];
const warnings: string[] = [];

// Load whitelist
function loadWhitelist(): string[] {
  try {
    if (fs.existsSync(WHITELIST_PATH)) {
      const data = JSON.parse(fs.readFileSync(WHITELIST_PATH, 'utf-8'));
      return data.indexed_pages || [];
    }
  } catch (e) {
    console.warn('⚠️  Could not load SEO whitelist, using empty list');
  }
  return [];
}

// Convert file path to route
function fileToRoute(filePath: string): string {
  let route = filePath
    .replace(APP_DIR, '')
    .replace(/\/page\.tsx?$/, '')
    .replace(/\/page\.jsx?$/, '')
    .replace(/\(.*?\)\//g, '') // Remove route groups like (marketing)/
    .replace(/\[.*?\]/g, ':param'); // Convert [id] to :param

  return route || '/';
}

// Check if route matches any blocked pattern
function isBlockedRoute(route: string): boolean {
  return BLOCKED_PATTERNS.some(
    (pattern) => route.startsWith(pattern) || route === pattern.replace(/\/$/, ''),
  );
}

// Extract metadata from page file
function extractMetadata(filePath: string): PageMetadata | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const route = fileToRoute(filePath);

    const metadata: PageMetadata = {
      file: filePath,
      route,
    };

    // Extract title
    const titleMatch = content.match(/title:\s*['"`]([^'"`]+)['"`]/);
    if (titleMatch) metadata.title = titleMatch[1];

    // Extract description
    const descMatch = content.match(/description:\s*['"`]([^'"`]+)['"`]/);
    if (descMatch) metadata.description = descMatch[1];

    // Extract robots directive
    const robotsMatch = content.match(/robots:\s*\{[^}]*index:\s*(true|false)/);
    if (robotsMatch) {
      metadata.robots = robotsMatch[1] === 'true' ? 'index, follow' : 'noindex, follow';
    }

    // Check for explicit meta robots in content
    if (content.includes('content="index, follow"') || content.includes("'index, follow'")) {
      metadata.robots = 'index, follow';
    } else if (content.includes('content="noindex') || content.includes("'noindex")) {
      metadata.robots = 'noindex, follow';
    }

    // Extract canonical
    const canonicalMatch = content.match(/canonical:\s*['"`]([^'"`]+)['"`]/);
    if (canonicalMatch) metadata.canonical = canonicalMatch[1];

    return metadata;
  } catch (e) {
    return null;
  }
}

// RULE 1: Default noindex for new pages
function validateDefaultNoindex(pages: PageMetadata[], whitelist: string[]) {
  console.log('\n📋 Rule 1: Checking default noindex...');

  for (const page of pages) {
    if (!page.robots && !whitelist.includes(page.route)) {
      // Page has no explicit robots directive and is not whitelisted
      // This is actually OK if we default to noindex
      warnings.push(`${page.route} has no explicit robots directive (will default to noindex)`);
    }
  }
}

// RULE 2: Index whitelist validation
function validateIndexWhitelist(pages: PageMetadata[], whitelist: string[]) {
  console.log('\n📋 Rule 2: Validating index whitelist...');

  for (const page of pages) {
    if (page.robots === 'index, follow' && !whitelist.includes(page.route)) {
      errors.push({
        file: page.file,
        route: page.route,
        rule: 'INDEX_WHITELIST',
        message: `Page uses "index, follow" but is not in whitelist`,
        fix: `Add "${page.route}" to config/seo-index-whitelist.json or change to "noindex, follow"`,
      });
    }
  }
}

// RULE 3: Blocked routes never indexed
function validateBlockedRoutes(pages: PageMetadata[]) {
  console.log('\n📋 Rule 3: Checking blocked routes...');

  for (const page of pages) {
    if (isBlockedRoute(page.route) && page.robots === 'index, follow') {
      errors.push({
        file: page.file,
        route: page.route,
        rule: 'BLOCKED_ROUTE',
        message: `Blocked route "${page.route}" cannot be indexed`,
        fix: `Change robots directive to "noindex, follow" or remove index directive`,
      });
    }
  }
}

// RULE 4: Canonical validation
function validateCanonicals(pages: PageMetadata[], whitelist: string[]) {
  console.log('\n📋 Rule 4: Validating canonicals...');

  for (const page of pages) {
    if (whitelist.includes(page.route)) {
      // Indexed pages must have canonical
      if (!page.canonical) {
        errors.push({
          file: page.file,
          route: page.route,
          rule: 'MISSING_CANONICAL',
          message: `Indexed page missing canonical URL`,
          fix: `Add canonical: "${PRODUCTION_DOMAIN}${page.route}" to metadata`,
        });
      } else if (!page.canonical.startsWith(PRODUCTION_DOMAIN)) {
        errors.push({
          file: page.file,
          route: page.route,
          rule: 'INVALID_CANONICAL',
          message: `Canonical URL must point to production domain`,
          fix: `Change canonical to "${PRODUCTION_DOMAIN}${page.route}"`,
        });
      }
    }
  }
}

// RULE 5: Metadata uniqueness
function validateMetadataUniqueness(pages: PageMetadata[], whitelist: string[]) {
  console.log('\n📋 Rule 5: Checking metadata uniqueness...');

  const indexedPages = pages.filter((p) => whitelist.includes(p.route));

  // Check for duplicate titles
  const titles = new Map<string, string[]>();
  for (const page of indexedPages) {
    if (page.title) {
      const existing = titles.get(page.title) || [];
      existing.push(page.route);
      titles.set(page.title, existing);
    } else {
      errors.push({
        file: page.file,
        route: page.route,
        rule: 'MISSING_TITLE',
        message: `Indexed page missing title`,
        fix: `Add unique title to page metadata`,
      });
    }
  }

  for (const [title, routes] of titles) {
    if (routes.length > 1) {
      errors.push({
        file: 'multiple',
        route: routes.join(', '),
        rule: 'DUPLICATE_TITLE',
        message: `Duplicate title "${title}" found on multiple pages`,
        fix: `Ensure each indexed page has a unique title`,
      });
    }
  }

  // Check for duplicate descriptions
  const descriptions = new Map<string, string[]>();
  for (const page of indexedPages) {
    if (page.description) {
      const existing = descriptions.get(page.description) || [];
      existing.push(page.route);
      descriptions.set(page.description, existing);
    } else {
      errors.push({
        file: page.file,
        route: page.route,
        rule: 'MISSING_DESCRIPTION',
        message: `Indexed page missing meta description`,
        fix: `Add unique description (140-160 chars) to page metadata`,
      });
    }
  }

  for (const [desc, routes] of descriptions) {
    if (routes.length > 1) {
      errors.push({
        file: 'multiple',
        route: routes.join(', '),
        rule: 'DUPLICATE_DESCRIPTION',
        message: `Duplicate description found on multiple pages`,
        fix: `Ensure each indexed page has a unique description`,
      });
    }
  }
}

// RULE 6: Sitemap safety
function validateSitemap(whitelist: string[]) {
  console.log('\n📋 Rule 6: Validating sitemap...');

  const sitemapPath = path.join(APP_DIR, 'sitemap.ts');

  if (!fs.existsSync(sitemapPath)) {
    warnings.push('No sitemap.ts found');
    return;
  }

  const content = fs.readFileSync(sitemapPath, 'utf-8');

  // Check for blocked routes in sitemap
  for (const pattern of BLOCKED_PATTERNS) {
    if (content.includes(`'${pattern}'') || content.includes(`"${pattern}"`)) {
      // Check if it's in the excluded list (which is OK)
      if (!content.includes('EXCLUDED') && !content.includes('excluded')) {
        errors.push({
          file: sitemapPath,
          route: pattern,
          rule: 'SITEMAP_BLOCKED_ROUTE',
          message: `Sitemap may include blocked route: ${pattern}`,
          fix: `Ensure ${pattern} is excluded from sitemap generation`,
        });
      }
    }
  }

  // Check for query strings
  if (content.match(/url:.*\?/)) {
    errors.push({
      file: sitemapPath,
      route: 'N/A',
      rule: 'SITEMAP_QUERY_STRING',
      message: `Sitemap contains URLs with query strings`,
      fix: `Remove query strings from sitemap URLs`,
    });
  }
}

// Main validation function
async function runValidation() {
  console.log('🔍 SEO Validation Starting...\n');
  console.log('='.repeat(60));

  // Load whitelist
  const whitelist = loadWhitelist();
  console.log(`📄 Loaded ${whitelist.length} whitelisted pages`);

  // Find all page files
  const pageFiles = glob.sync(`${APP_DIR}/**/page.{tsx,ts,jsx,js}`, {
    ignore: ['**/node_modules/**', '**/_*/**'],
  });

  console.log(`📁 Found ${pageFiles.length} page files`);

  // Extract metadata from all pages
  const pages: PageMetadata[] = [];
  for (const file of pageFiles) {
    const metadata = extractMetadata(file);
    if (metadata) pages.push(metadata);
  }

  // Run all validations
  validateDefaultNoindex(pages, whitelist);
  validateIndexWhitelist(pages, whitelist);
  validateBlockedRoutes(pages);
  validateCanonicals(pages, whitelist);
  validateMetadataUniqueness(pages, whitelist);
  validateSitemap(whitelist);

  // Output results
  console.log('\n' + '='.repeat(60));

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach((w) => console.log(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    console.log('-'.repeat(60));

    for (const error of errors) {
      console.log(`\n🚫 ${error.rule}`);
      console.log(`   File: ${error.file}`);
      console.log(`   Route: ${error.route}`);
      console.log(`   Issue: ${error.message}`);
      console.log(`   Fix: ${error.fix}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n❌ SEO VALIDATION FAILED: ${errors.length} error(s) found`);
    console.log('\nDeploy blocked. Fix errors and re-run validation.\n');
    process.exit(1);
  }

  console.log('\n✅ SEO VALIDATION PASSED');
  console.log(`   - ${pages.length} pages checked`);
  console.log(`   - ${whitelist.length} pages whitelisted for indexing`);
  console.log(`   - ${warnings.length} warnings`);
  console.log(`   - 0 errors`);
  console.log('\nDeploy approved.\n');
  process.exit(0);
}

// Run
runValidation().catch((err) => {
  console.error('❌ Validation script error:', err);
  process.exit(1);
});
