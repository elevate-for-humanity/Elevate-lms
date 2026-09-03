#!/usr/bin/env node

/**
 * CI gate: enforce canonical Stripe client usage in deployed applications and
 * canonical shared libraries. Historical root app/ code is not deployed and
 * must not determine production readiness.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, sep } from 'path';

const ROOT = process.cwd();
const CANONICAL = 'lib/stripe/client.ts';
const SCAN_ROOTS = ['lib', 'apps/admin', 'apps/lms', 'apps/marketing'];

function walkDir(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    if (['node_modules', '.next', '.git', 'dist', 'coverage'].includes(entry)) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry)) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = SCAN_ROOTS.flatMap((root) => walkDir(join(ROOT, root)));
const violations = [];

for (const file of files) {
  const rel = relative(ROOT, file).split(sep).join('/');
  if (rel === CANONICAL) continue;
  const content = readFileSync(file, 'utf-8');

  const importsStripe = /from\s+['"]stripe['"]|require\(['"]stripe['"]\)/.test(content);
  const instantiatesStripe = /new\s+Stripe\s*\(/.test(content);

  if (importsStripe && instantiatesStripe) violations.push(rel);
}

console.log(`Stripe integrity: scanned ${files.length} deployed/shared source files.`);

if (violations.length > 0) {
  console.error(`FAIL: Found ${violations.length} non-canonical Stripe client initialization(s):`);
  for (const v of violations) console.error(`  - ${v}`);
  console.error(`Canonical Stripe client: ${CANONICAL}`);
  process.exit(1);
}

console.log('PASS: All deployed Stripe clients use the canonical implementation.');
process.exit(0);
