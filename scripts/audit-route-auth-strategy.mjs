#!/usr/bin/env node
/**
 * scripts/audit-route-auth-strategy.mjs
 *
 * Enforces that every API route declares an explicit auth strategy.
 * Exits non-zero if any route fails classification — use in CI.
 *
 * Auth classes (in priority order):
 *   ADMIN       — requireAdmin / apiRequireAdmin / requireRole
 *   AUTH        — getUser / getSession / requireAuth / apiAuthGuard / requireApiRole / requireApiAuth / getCurrentUser / withAuth / getTenantContext / providerApiGuard / AUTH: Enforced
 *   WEBHOOK     — verifyWebhookSignature / stripe-signature / svix / x-webhook-secret / webhook_secret
 *   CRON        — CRON_SECRET / x-cron-secret / x-internal-token / CRON ROUTE comment
 *   PUBLIC      — explicit "// PUBLIC ROUTE" comment
 *   UNCLASSIFIED — none of the above → FAIL
 *
 * Usage:
 *   node scripts/audit-route-auth-strategy.mjs           # report only
 *   node scripts/audit-route-auth-strategy.mjs --strict  # exit 1 on any UNCLASSIFIED
 *   node scripts/audit-route-auth-strategy.mjs --fix     # print files needing attention
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const STRICT = process.argv.includes('--strict');
const FIX    = process.argv.includes('--fix');

// ─── Classification patterns ──────────────────────────────────────────────────

const PATTERNS = {
  ADMIN: [
    /requireAdmin\b/,
    /apiRequireAdmin\b/,
    /requireRole\b/,
    /requireInstructor\b/,
    /apiRequireInstructor\b/,
    /roles?.*admin/i,
  ],
  AUTH: [
    /\.auth\.getUser\(\)/,
    /\.auth\.getSession\(\)/,
    /requireAuth\b/,
    /apiAuthGuard\b/,
    /getTenantContext\b/,
    /providerApiGuard\b/,
    /getMyPartnerContext\b/,
    /\/\/\s*AUTH:\s*Enforced/i,
    /requireApiRole\b/,
    /requireApiAuth\b/,
    /getCurrentUser\b/,
    /withAuth\b/,
    /getAuthUser\b/,
    /authSession\b/,
  ],
  WEBHOOK: [
    /stripe-signature/i,
    /verifyWebhookSignature\b/,
    /svix/i,
    /x-webhook-secret/i,
    /webhook[_-]secret/i,
    /constructEvent\b/,
    /validateWebhook\b/,
  ],
  CRON: [
    /CRON_SECRET/,
    /x-cron-secret/i,
    /cron[_-]secret/i,
    /x-internal-token/i,
    /\/\/\s*CRON ROUTE/,
  ],
  PUBLIC: [
    /\/\/\s*PUBLIC ROUTE/i,
    /\/\/\s*INTENTIONALLY PUBLIC/i,
    /\/\/\s*public route/i,
  ],
};

// ─── File walker ──────────────────────────────────────────────────────────────

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (['node_modules', '.next', '.git', 'dist'].includes(entry)) continue;
      walk(full, files);
    } else if (entry === 'route.ts' || entry === 'route.js') {
      files.push(full);
    }
  }
  return files;
}

// ─── Classify a single file ───────────────────────────────────────────────────

function classify(src) {
  for (const [cls, patterns] of Object.entries(PATTERNS)) {
    if (patterns.some(p => p.test(src))) return cls;
  }
  return 'UNCLASSIFIED';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const routes = walk(join(ROOT, 'app/api'));
const results = { ADMIN: [], AUTH: [], WEBHOOK: [], CRON: [], PUBLIC: [], UNCLASSIFIED: [] };

for (const file of routes) {
  const src = readFileSync(file, 'utf8');
  const cls = classify(src);
  results[cls].push(relative(ROOT, file));
}

// ─── Report ───────────────────────────────────────────────────────────────────

const total = routes.length;
const unclassified = results.UNCLASSIFIED.length;

console.log('\n=== Route Auth Strategy Audit ===\n');
for (const [cls, files] of Object.entries(results)) {
  if (cls === 'UNCLASSIFIED') continue;
  console.log(`${cls.padEnd(12)} ${files.length} routes`);
}
console.log(`${'UNCLASSIFIED'.padEnd(12)} ${unclassified} routes${unclassified > 0 ? ' ← NEEDS ATTENTION' : ' ✓'}`);
console.log(`\nTotal: ${total} routes`);

if (unclassified > 0) {
  console.log('\n─── UNCLASSIFIED routes ───');
  for (const f of results.UNCLASSIFIED) {
    console.log('  ' + f);
  }
  console.log('\nFor each unclassified route, add one of:');
  console.log('  // PUBLIC ROUTE: <reason>   (if intentionally public)');
  console.log('  getUser() / requireAuth()   (if requires authentication)');
  console.log('  CRON_SECRET check           (if cron job)');
  console.log('  verifyWebhookSignature()    (if webhook receiver)');
}

if (FIX) {
  console.log('\n─── Files to fix ───');
  for (const f of results.UNCLASSIFIED) {
    console.log(f);
  }
}

if (STRICT && unclassified > 0) {
  console.error(`\n✗ ${unclassified} unclassified routes. Fix before merging.`);
  process.exit(1);
}

if (unclassified === 0) {
  console.log('\n✓ All routes classified.');
}
