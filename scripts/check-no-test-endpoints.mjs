#!/usr/bin/env node

/**
 * CI gate: Detect test/debug/seed API endpoints that should not ship to production.
 * 
 * These endpoints expose internal state, allow data mutation, or bypass auth.
 * They must be removed or gated behind NODE_ENV checks before production deploy.
 */

import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const TEST_PATTERNS = [
  'test-',
  'debug/',
  'dev/',
  'simulate-',
  'quick-test',
  'run-all-tests',
  'sentry-test',
  'autopilot-test-users',
];

// Endpoints that are intentionally test-like but serve production purposes
const ALLOWLIST = [
  'supersonic-fast-cash/competency-test', // actual user-facing competency test
  'studio/generate-tests',                // studio feature
  'content/testimonials',                 // actual testimonials endpoint
  'testimonials',                         // actual testimonials endpoint
  'drug-testing/checkout',               // actual drug testing checkout
];

function walkDir(dir) {
  const results = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...walkDir(fullPath));
      } else if (entry === 'route.ts' || entry === 'route.tsx') {
        results.push(fullPath);
      }
    }
  } catch {
    // ignore
  }
  return results;
}

const apiDir = join(process.cwd(), 'app', 'api');
const routes = walkDir(apiDir);

const violations = [];

for (const route of routes) {
  const relative = route.replace(join(process.cwd(), 'app', 'api') + '/', '').replace('/route.ts', '').replace('/route.tsx', '');
  
  // Check allowlist
  if (ALLOWLIST.some(a => relative.includes(a))) continue;
  
  // Check patterns
  for (const pattern of TEST_PATTERNS) {
    if (relative.includes(pattern)) {
      violations.push(relative);
      break;
    }
  }
}

// Also check for seed endpoints
for (const route of routes) {
  const relative = route.replace(join(process.cwd(), 'app', 'api') + '/', '').replace('/route.ts', '').replace('/route.tsx', '');
  if (ALLOWLIST.some(a => relative.includes(a))) continue;
  if (relative.includes('/seed') && !violations.includes(relative)) {
    violations.push(relative);
  }
}

if (violations.length > 0) {
  console.warn(`\n⚠️  Found ${violations.length} test/debug/seed API endpoints:\n`);
  for (const v of violations) {
    console.warn(`  - /api/${v}`);
  }
  console.warn('\nThese should be removed or gated behind NODE_ENV !== "production".');
  console.warn('To suppress, add to ALLOWLIST in scripts/check-no-test-endpoints.mjs\n');
  // Warn only — don't block build yet. Change to process.exit(1) when ready to enforce.
  process.exit(0);
} else {
  console.log('✅ No test/debug/seed endpoints found.');
}
