#!/usr/bin/env node

/**
 * SEO Governance Check - CI Script
 *
 * Enforces SEO indexing rules at build time.
 * Designed for Next.js App Router with metadata.ts files.
 *
 * Usage: node scripts/ci/seo-check.mjs
 *
 * Exit codes:
 *   0 = All checks passed
 *   1 = Validation errors found (blocks deploy)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
const APP_DIR = path.join(ROOT_DIR, 'apps', 'marketing', 'app');
const WHITELIST_PATH = path.join(ROOT_DIR, 'config', 'seo-index-whitelist.json');
const PRODUCTION_DOMAIN = 'https://www.elevateforhumanity.org';

// Routes that must NEVER be indexed
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
  '/lms/dashboard',
  '/lms/courses/',
  '/lms/assignments',
  '/lms/grades',
  '/lms/messages',
  '/lms/profile',
  '/lms/settings',
  '/lms/notifications',
  '/lms/progress',
];

const DYNAMIC_INDEX_PATTERNS = ['/sites/:param/:path*', '/tenant-site/:path*'];

const errors = [];
const warnings = [];
const checked = { pages: 0, indexed: 0, noindex: 0 };

// Load whitelist
function loadWhitelist() {
  try {
    const data = JSON.parse(fs.readFileSync(WHITELIST_PATH, 'utf-8'));
    return data.indexed_pages || [];
  } catch (e) {
    console.warn('⚠️  Could not load whitelist, using empty list');
    return [];
  }
}

// Recursively find all page files
function findPageFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Marketing App Router directory not found: ${dir}`);
  }
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      // Skip node_modules and hidden directories
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;
      findPageFiles(fullPath, files);
    } else if (item.name === 'page.tsx' || item.name === 'page.ts') {
      files.push(fullPath);
    }
  }

  return files;
}

// Convert file path to route
function fileToRoute(filePath) {
  let route = filePath
    .replace(APP_DIR, '')
    .replace(/\/page\.tsx?$/, '')
    .replace(/\(.*?\)\//g, '') // Remove route groups
    .replace(/\[\[\.\.\.[^\]]+\]\]/g, ':path*')
    .replace(/\[\.\.\.[^\]]+\]/g, ':path+')
    .replace(/\[[^\]]+\]/g, ':param');

  return route || '/';
}

function isApprovedDynamicRoute(route) {
  return DYNAMIC_INDEX_PATTERNS.includes(route);
}

// Check if route is blocked
function isBlockedRoute(route) {
  return BLOCKED_PATTERNS.some((pattern) => route.startsWith(pattern) || route === pattern);
}

// Extract metadata from page file
function extractMetadata(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const route = fileToRoute(filePath);
  const layoutPath = path.join(path.dirname(filePath), 'layout.tsx');
  const layoutPathTs = path.join(path.dirname(filePath), 'layout.ts');
  if (fs.existsSync(layoutPath)) {
    content += '\n' + fs.readFileSync(layoutPath, 'utf-8');
  } else if (fs.existsSync(layoutPathTs)) {
    content += '\n' + fs.readFileSync(layoutPathTs, 'utf-8');
  }

  const metadata = {
    file: filePath.replace(ROOT_DIR, ''),
    route,
    hasMetadata: false,
    index: null, // null = not specified, true = index, false = noindex
    title: null,
    description: null,
    canonical: null,
  };

  // Check for metadata export
  if (
    content.includes('export const metadata') ||
    content.includes('export function generateMetadata')
  ) {
    metadata.hasMetadata = true;
  }

  // Check robots directive
  if (content.match(/index:\s*true/)) {
    metadata.index = true;
  } else if (content.match(/index:\s*false/)) {
    metadata.index = false;
  } else if (content.includes('"noindex') || content.includes("'noindex")) {
    metadata.index = false;
  } else if (content.includes('"index, follow"') || content.includes("'index, follow'")) {
    metadata.index = true;
  }

  // Extract title
  const titleMatch = content.match(/title:\s*['"`]([^'"`\n]+)['"`]/);
  if (titleMatch) {
    metadata.title = titleMatch[1];
  } else if (/title\s*:/.test(content)) {
    metadata.title = `__dynamic_title__${route}`;
  }

  // Extract description
  const descMatch = content.match(/description:\s*['"`]([^'"`\n]+)['"`]/);
  if (descMatch) {
    metadata.description = descMatch[1];
  } else if (/description\s*:/.test(content)) {
    metadata.description = `__dynamic_description__${route}`;
  }

  // Extract canonical
  const canonicalMatch = content.match(/canonical:\s*['"`]([^'"`\n]+)['"`]/);
  if (canonicalMatch) {
    metadata.canonical = canonicalMatch[1];
  } else if (/canonical\s*:/.test(content)) {
    metadata.canonical = `${PRODUCTION_DOMAIN}${route}`;
  }

  return metadata;
}

// Main validation
function runValidation() {
  console.log('\n🔍 SEO Governance Check\n');
  console.log('='.repeat(60));

  const whitelist = loadWhitelist();
  console.log(`📋 Whitelist: ${whitelist.length} approved pages`);

  const pageFiles = findPageFiles(APP_DIR);
  console.log(`📁 Found: ${pageFiles.length} page files\n`);

  const titles = new Map();
  const descriptions = new Map();

  for (const file of pageFiles) {
    const meta = extractMetadata(file);
    checked.pages++;

    // RULE 1: Blocked routes must never be indexed
    if (isBlockedRoute(meta.route)) {
      if (meta.index === true) {
        errors.push({
          rule: 'BLOCKED_ROUTE',
          file: meta.file,
          route: meta.route,
          message: 'Blocked route cannot be indexed',
          fix: 'Set robots: { index: false, follow: false }',
        });
      }
      continue; // Skip further checks for blocked routes
    }

    // RULE 2: Index requires whitelist
    if (meta.index === true) {
      checked.indexed++;
      if (!whitelist.includes(meta.route) && !isApprovedDynamicRoute(meta.route)) {
        errors.push({
          rule: 'NOT_WHITELISTED',
          file: meta.file,
          route: meta.route,
          message: 'Page is indexed but not in whitelist',
          fix: `Add "${meta.route}" to config/seo-index-whitelist.json`,
        });
      }
    } else {
      checked.noindex++;
    }

    // RULE 3: Indexed pages need metadata
    if (whitelist.includes(meta.route)) {
      // Must have title
      if (!meta.title) {
        errors.push({
          rule: 'MISSING_TITLE',
          file: meta.file,
          route: meta.route,
          message: 'Indexed page missing title',
          fix: 'Add title to metadata export',
        });
      } else {
        // Check for duplicates
        if (titles.has(meta.title)) {
          errors.push({
            rule: 'DUPLICATE_TITLE',
            file: meta.file,
            route: meta.route,
            message: `Duplicate title with ${titles.get(meta.title)}`,
            fix: 'Ensure unique title for each indexed page',
          });
        }
        titles.set(meta.title, meta.route);
      }

      // Must have description
      if (!meta.description) {
        errors.push({
          rule: 'MISSING_DESCRIPTION',
          file: meta.file,
          route: meta.route,
          message: 'Indexed page missing meta description',
          fix: 'Add description (140-160 chars) to metadata',
        });
      } else {
        // Check for duplicates
        if (descriptions.has(meta.description)) {
          errors.push({
            rule: 'DUPLICATE_DESCRIPTION',
            file: meta.file,
            route: meta.route,
            message: `Duplicate description with ${descriptions.get(meta.description)}`,
            fix: 'Ensure unique description for each indexed page',
          });
        }
        descriptions.set(meta.description, meta.route);
      }

      // Should have canonical
      if (!meta.canonical) {
        warnings.push(`${meta.route}: Missing canonical URL`);
      } else if (!meta.canonical.startsWith(PRODUCTION_DOMAIN)) {
        errors.push({
          rule: 'INVALID_CANONICAL',
          file: meta.file,
          route: meta.route,
          message: 'Canonical must point to production domain',
          fix: `Use canonical: "${PRODUCTION_DOMAIN}${meta.route}"`,
        });
      }
    }
  }

  // Output results
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   Pages checked: ${checked.pages}`);
  console.log(`   Indexed: ${checked.indexed}`);
  console.log(`   Noindex: ${checked.noindex}`);
  console.log(`   Whitelisted: ${whitelist.length}`);

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach((w) => console.log(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.log('\n❌ ERRORS:\n');

    for (const err of errors) {
      console.log(`🚫 [${err.rule}]`);
      console.log(`   Route: ${err.route}`);
      console.log(`   File: ${err.file}`);
      console.log(`   Issue: ${err.message}`);
      console.log(`   Fix: ${err.fix}\n`);
    }

    console.log('='.repeat(60));
    console.log(`\n❌ SEO CHECK FAILED: ${errors.length} error(s)\n`);
    console.log('Deploy blocked. Fix errors and re-run.\n');
    process.exit(1);
  }

  console.log('\n✅ SEO GOVERNANCE CHECK PASSED\n');
  process.exit(0);
}

// Run
runValidation();
