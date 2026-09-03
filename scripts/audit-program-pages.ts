#!/usr/bin/env npx ts-node

/**
 * Program Page Contract Enforcement Script
 *
 * Validates all /programs/* pages against the program page contract.
 * Run in CI to prevent regressions.
 *
 * Usage:
 *   npx ts-node scripts/audit-program-pages.ts
 *   npm run audit:programs
 *   npm run audit:programs -- --json > audit.json
 *   AUDIT_PROGRAMS_STRICT=false npm run audit:programs  # warn mode
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const STRICT_MODE = process.env.AUDIT_PROGRAMS_STRICT !== 'false';
const JSON_OUTPUT = process.argv.includes('--json');

interface AuditResult {
  page: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
}

interface AuditSummary {
  total: number;
  passed: number;
  failed: number;
  results: AuditResult[];
}

// Forbidden strings that indicate incomplete pages
const FORBIDDEN_STRINGS = [
  'coming soon',
  'placeholder',
  'lorem ipsum',
  'todo:',
  'fixme:',
  'xxx',
  'tbd',
  '[insert',
  'example.com',
];

// Required patterns for program pages
const REQUIRED_PATTERNS = {
  h1: /<h1[^>]*>/i,
  metadata: /export const metadata|export async function generateMetadata/,
  primaryCTA: /href=["'][^"']*\/(apply|enroll|eligibility|inquiry|wioa-eligibility|contact)/i,
  image: /<Image|<img|<video|heroImage|heroVideo|HTMLVideoElement|bg-\[url\(/i,
};

// Recommended patterns (warnings if missing)
const RECOMMENDED_PATTERNS = {
  breadcrumbs: /Breadcrumbs|breadcrumb/i,
  canonical: /canonical|alternates/i,
  outcomes: /outcomes|learn|skills/i,
  funding: /funding|payment|cost|tuition|wioa|wrg|price|fee/i,
};

function auditProgramPage(filePath: string): AuditResult {
  const relativePath = path.relative(process.cwd(), filePath);
  let content = fs.readFileSync(filePath, 'utf-8');
  const errors: string[] = [];
  const warnings: string[] = [];

  // Also check layout.tsx if it exists (metadata may be there for client components)
  const layoutPath = path.join(path.dirname(filePath), 'layout.tsx');
  if (fs.existsSync(layoutPath)) {
    content += '\n' + fs.readFileSync(layoutPath, 'utf-8');
  }

  // Redirect-only alias pages are intentionally exempt from full content contract.
  if (/redirect\(|permanentRedirect\(/.test(content)) {
    return {
      page: relativePath,
      passed: true,
      errors: [],
      warnings: ['Redirect-only alias page (content contract exempt)'],
    };
  }

  // Check for forbidden strings. Ignore legitimate Next/Image placeholder props
  // and image-contract comments; those are implementation details, not draft copy.
  const contentForForbiddenStrings = content
    .replace(/placeholder=["']empty["']/gi, '')
    .replace(/IMAGE-CONTRACT:[^\n]*/gi, '');
  for (const forbidden of FORBIDDEN_STRINGS) {
    if (contentForForbiddenStrings.toLowerCase().includes(forbidden)) {
      errors.push(`Contains forbidden string: "${forbidden}"`);
    }
  }

  const usesCanonicalTemplate =
    /ProgramDetailPage|ProgramMarketingPage|ProgramPageLayout|ProgramCategoryPage|ProgramPageTemplate|BarberApprenticeshipClient/.test(
      content,
    );

  // Check required patterns
  if (!usesCanonicalTemplate && !REQUIRED_PATTERNS.h1.test(content)) {
    errors.push('Missing H1 element');
  }

  if (!REQUIRED_PATTERNS.metadata.test(content)) {
    errors.push('Missing metadata export (title/description)');
  }

  if (!usesCanonicalTemplate && !REQUIRED_PATTERNS.primaryCTA.test(content)) {
    errors.push('Missing primary CTA link (apply/enroll/eligibility/inquiry)');
  }

  if (!usesCanonicalTemplate && !REQUIRED_PATTERNS.image.test(content)) {
    errors.push('Missing hero image or video');
  }

  // Check recommended patterns (warnings)
  if (!RECOMMENDED_PATTERNS.breadcrumbs.test(content)) {
    warnings.push('Missing breadcrumbs');
  }

  if (!RECOMMENDED_PATTERNS.canonical.test(content)) {
    warnings.push('Missing canonical URL in metadata');
  }

  if (!RECOMMENDED_PATTERNS.outcomes.test(content)) {
    warnings.push('Missing learning outcomes section');
  }

  if (!RECOMMENDED_PATTERNS.funding.test(content)) {
    warnings.push('Missing funding/payment information');
  }

  // Count H1 tags (should be exactly 1)
  const h1Matches = content.match(/<h1[^>]*>/gi);
  if (!usesCanonicalTemplate && h1Matches && h1Matches.length > 1) {
    errors.push(`Multiple H1 elements found (${h1Matches.length})`);
  }

  return {
    page: relativePath,
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

function findProgramPages(dir: string): string[] {
  const pages: string[] = [];
  const programsDir = path.join(dir, 'apps', 'marketing', 'app', 'programs');

  if (!fs.existsSync(programsDir)) {
    console.error('Programs directory not found:', programsDir);
    return pages;
  }

  function walkDir(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip special directories
        if ((entry.name.startsWith('[') && entry.name !== '[program]') || entry.name === 'admin') {
          continue;
        }
        walkDir(fullPath);
      } else if (entry.name === 'page.tsx') {
        // Only audit direct program pages, not nested routes
        const relativePath = path.relative(programsDir, currentDir);
        const depth = relativePath.split(path.sep).filter(Boolean).length;

        // Only audit top-level program pages (depth 1)
        if (depth === 1) {
          pages.push(fullPath);
        }
      }
    }
  }

  walkDir(programsDir);
  return pages;
}

function printResults(summary: AuditSummary): void {
  if (JSON_OUTPUT) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log('\n========================================');
  console.log('PROGRAM PAGE CONTRACT AUDIT');
  console.log(`Mode: ${STRICT_MODE ? 'STRICT (CI will fail)' : 'WARN (CI will pass)'}`);
  console.log('========================================\n');

  for (const result of summary.results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.page}`);

    if (result.errors.length > 0) {
      for (const error of result.errors) {
        console.log(`   ❌ ERROR: ${error}`);
      }
    }

    if (result.warnings.length > 0) {
      for (const warning of result.warnings) {
        console.log(`   ⚠️  WARN: ${warning}`);
      }
    }

    console.log('');
  }

  console.log('========================================');
  console.log(`SUMMARY: ${summary.passed}/${summary.total} pages passed`);
  console.log(`         ${summary.failed} pages failed`);
  console.log('========================================\n');
}

function main(): void {
  const projectRoot = process.cwd();
  const pages = findProgramPages(projectRoot);

  if (pages.length === 0) {
    console.log('No program pages found to audit.');
    process.exit(0);
  }

  console.log(`Found ${pages.length} program pages to audit...\n`);

  const results: AuditResult[] = [];

  for (const page of pages) {
    const result = auditProgramPage(page);
    results.push(result);
  }

  const summary: AuditSummary = {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
  };

  printResults(summary);

  // Exit with error code if any pages failed (only in strict mode)
  if (summary.failed > 0) {
    if (STRICT_MODE) {
      if (!JSON_OUTPUT) {
        console.log('❌ Audit failed. Fix the errors above before merging.\n');
      }
      process.exit(1);
    } else {
      if (!JSON_OUTPUT) {
        console.log('⚠️  Audit found failures but STRICT mode is disabled. CI will pass.\n');
      }
      process.exit(0);
    }
  }

  if (!JSON_OUTPUT) {
    console.log('✅ All program pages pass the contract.\n');
  }
  process.exit(0);
}

main();
