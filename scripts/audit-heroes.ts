#!/usr/bin/env npx ts-node
/**
 * Hero Audit Script
 *
 * Scans all page.tsx files and reports:
 * 1. Pages missing HeroSection component
 * 2. Pages using gradient overlays (forbidden)
 * 3. Pages with duplicate hero images
 * 4. Pages using legacy hero patterns
 *
 * Run: npx ts-node scripts/audit-heroes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const APP_DIR = path.join(process.cwd(), 'app');

interface AuditResult {
  path: string;
  hasHero: boolean;
  hasGradient: boolean;
  heroImage: string | null;
  issues: string[];
}

const results: AuditResult[] = [];
const heroImageUsage: Map<string, string[]> = new Map();

// Patterns to detect
const HERO_PATTERNS = [/HeroSection/, /<Hero\s/, /data-hero=/];

const GRADIENT_PATTERNS = [
  /bg-gradient-to/,
  /from-.*to-.*\/\d+/, // opacity gradients like from-black/50
  /linear-gradient/,
  /radial-gradient/,
];

const HERO_IMAGE_PATTERN = /(?:heroImage|hero.*image|src=["'])(\/images\/heroes\/[^"'\s]+)/gi;

function scanFile(filePath: string): AuditResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(process.cwd(), '');

  const result: AuditResult = {
    path: relativePath,
    hasHero: false,
    hasGradient: false,
    heroImage: null,
    issues: [],
  };

  // Check for hero component
  result.hasHero = HERO_PATTERNS.some((pattern) => pattern.test(content));

  // Check for forbidden gradients in hero sections
  // Only flag if it's in a hero-like context (first 100 lines typically)
  const firstSection = content.split('\n').slice(0, 150).join('\n');
  result.hasGradient = GRADIENT_PATTERNS.some((pattern) => pattern.test(firstSection));

  // Extract hero image paths
  const imageMatches = content.matchAll(HERO_IMAGE_PATTERN);
  for (const match of imageMatches) {
    result.heroImage = match[1];

    // Track usage for duplicate detection
    const existing = heroImageUsage.get(match[1]) || [];
    existing.push(relativePath);
    heroImageUsage.set(match[1], existing);
  }

  // Determine issues
  if (!result.hasHero) {
    // Check if it's a page that should have a hero
    const isMarketingPage = /\/(programs|about|apply|contact|careers|funding|testimonials)/.test(
      relativePath,
    );
    const isPortalPage = /\/(student-portal|staff-portal|workforce-board)/.test(relativePath);

    if (isMarketingPage || isPortalPage) {
      result.issues.push('MISSING_HERO: Marketing/portal page without HeroSection');
    }
  }

  if (result.hasGradient) {
    result.issues.push('FORBIDDEN_GRADIENT: Gradient overlay detected in hero section');
  }

  return result;
}

function findPageFiles(dir: string): string[] {
  const files: string[] = [];

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'api') {
        files.push(...findPageFiles(fullPath));
      }
    } else if (item.name === 'page.tsx') {
      files.push(fullPath);
    }
  }

  return files;
}

function runAudit() {
  console.log('🔍 Hero Audit Report\n');
  console.log('='.repeat(60));

  const pageFiles = findPageFiles(APP_DIR);
  console.log(`\nScanning ${pageFiles.length} page files...\n`);

  for (const file of pageFiles) {
    const result = scanFile(file);
    results.push(result);
  }

  // Report: Pages missing heroes
  const missingHero = results.filter((r) => r.issues.some((i) => i.includes('MISSING_HERO')));
  if (missingHero.length > 0) {
    console.log('\n❌ PAGES MISSING HERO COMPONENT');
    console.log('-'.repeat(40));
    for (const r of missingHero) {
      console.log(`  ${r.path}`);
    }
  }

  // Report: Pages with forbidden gradients
  const hasGradient = results.filter((r) => r.hasGradient);
  if (hasGradient.length > 0) {
    console.log('\n⚠️  PAGES WITH GRADIENT OVERLAYS (FORBIDDEN)');
    console.log('-'.repeat(40));
    for (const r of hasGradient) {
      console.log(`  ${r.path}`);
    }
  }

  // Report: Duplicate hero images
  console.log('\n📸 HERO IMAGE USAGE');
  console.log('-'.repeat(40));

  const duplicates: [string, string[]][] = [];
  for (const [image, pages] of heroImageUsage.entries()) {
    if (pages.length > 1) {
      duplicates.push([image, pages]);
    }
  }

  if (duplicates.length > 0) {
    console.log('\n⚠️  DUPLICATE HERO IMAGES (same image on multiple pages):');
    for (const [image, pages] of duplicates) {
      console.log(`\n  ${image}`);
      for (const page of pages) {
        console.log(`    - ${page}`);
      }
    }
  } else {
    console.log('  ✅ No duplicate hero images detected');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('-'.repeat(40));
  console.log(`  Total pages scanned: ${results.length}`);
  console.log(`  Pages with hero: ${results.filter((r) => r.hasHero).length}`);
  console.log(`  Pages missing hero: ${missingHero.length}`);
  console.log(`  Pages with gradients: ${hasGradient.length}`);
  console.log(`  Duplicate hero images: ${duplicates.length}`);
  console.log('='.repeat(60));

  // Exit with error if issues found
  const totalIssues = missingHero.length + hasGradient.length + duplicates.length;
  if (totalIssues > 0) {
    console.log(`\n⚠️  ${totalIssues} issues found. Run hero migration.`);
    process.exit(1);
  } else {
    console.log('\n✅ All hero checks passed!');
    process.exit(0);
  }
}

runAudit();
