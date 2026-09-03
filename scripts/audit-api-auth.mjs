#!/usr/bin/env node
/**
 * audit-api-auth.mjs
 *
 * Scans all app/api route.ts files and flags any that:
 *   1. Are not explicitly marked PUBLIC ROUTE, CRON ROUTE, or WEBHOOK
 *   2. Have no recognizable auth pattern
 *
 * Run: node scripts/audit-api-auth.mjs
 * CI:  node scripts/audit-api-auth.mjs --fail-on-new
 *
 * --fail-on-new compares against the known baseline count and exits 1
 * if new unguarded routes are introduced.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const API_DIR = join(ROOT, 'app/api');
const FAIL_ON_NEW = process.argv.includes('--fail-on-new');

// Patterns that indicate intentional public/system access
const EXEMPT_PATTERNS = [
  /PUBLIC ROUTE/,
  /CRON ROUTE/,
  /WEBHOOK/,
  /INTERNAL/,
  /stripe.*webhook/i,
  /Webhook/,
  /webhook/,
];

// Patterns that indicate auth is present
const AUTH_PATTERNS = [
  /apiRequireAdmin/,
  /apiAuthGuard/,
  /apiRequireInstructor/,
  /withAuth/,
  /requireAdmin/,
  /getUser\(/,
  /auth\.getSession/,
  /CRON_SECRET/,
  /JOB_PROCESSOR_TOKEN/,
  /requireAuth/,
  /builderGuard/,
  /requireApiRole/,
  /requireApiAuth/,
  /verifyAuth/,
  /checkAuth/,
  /supabase\.auth\.getUser/,
  /getCurrentUser/,
  /getServerSession/,
  /applyRateLimit/,
  /requireOrgAdmin/,
  /getTenantContext/,
  /getMyPartnerContext/,
  /withRuntime\(\{\s*cron/,
  /cron:\s*['"]bearer['"]/,
];

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (entry.name === 'route.ts') results.push(full);
  }
  return results;
}

const routes = walk(API_DIR);
const unguarded = [];

for (const route of routes) {
  const content = readFileSync(route, 'utf8');
  const rel = relative(ROOT, route);

  // Skip if explicitly exempt
  if (EXEMPT_PATTERNS.some((p) => p.test(content))) continue;

  // Skip if has auth
  if (AUTH_PATTERNS.some((p) => p.test(content))) continue;

  unguarded.push(rel);
}

// Known baseline — routes that are legitimately unguarded but not yet annotated
// Add to this list ONLY with a comment explaining why it's public
const KNOWN_BASELINE = new Set([
  'app/api/achievements/route.ts',           // public leaderboard
  'app/api/activity/watch-tick/route.ts',    // analytics ingestion, no PII
  'app/api/ai-tutor/route.ts',               // public AI tutor
  'app/api/apply/student/route.ts',          // public application form
  'app/api/contact/route.ts',                // public contact form
  'app/api/demo/seed/route.ts',              // dev-only, no prod data
  'app/api/enrollment-counter/route.ts',     // public marketing counter
  'app/api/health/route.ts',                 // public health check
  'app/api/leaderboard/route.ts',            // public leaderboard
  'app/api/programs/pricing/route.ts',       // public calculator
  'app/api/programs/route.ts',               // public program listing
  'app/api/search/route.ts',                 // public search
  'app/api/sitemap/route.ts',                // public sitemap
  'app/api/store/products/route.ts',         // public product listing
  'app/api/subscribe/route.ts',              // public newsletter
  'app/api/verify/route.ts',                 // public certificate verification
  'app/api/web-vitals/route.ts',             // analytics ingestion
]);

const newUnguarded = unguarded.filter((r) => !KNOWN_BASELINE.has(r));
const baselineUnguarded = unguarded.filter((r) => KNOWN_BASELINE.has(r));

console.log('\n=== API Auth Audit ===\n');
console.log(`Total routes scanned: ${routes.length}`);
console.log(`Unguarded (total):    ${unguarded.length}`);
console.log(`Known baseline:       ${baselineUnguarded.length}`);
console.log(`NEW unguarded:        ${newUnguarded.length}`);

if (newUnguarded.length > 0) {
  console.log('\n❌ NEW unguarded routes (must add auth or PUBLIC ROUTE comment):');
  newUnguarded.forEach((r) => console.log(`  ${r}`));
} else {
  console.log('\n✅ No new unguarded routes.');
}

if (baselineUnguarded.length > 0) {
  console.log('\n⚠️  Known baseline (annotate or fix when touching these files):');
  baselineUnguarded.forEach((r) => console.log(`  ${r}`));
}

if (FAIL_ON_NEW && newUnguarded.length > 0) {
  console.log('\n[auth-audit] FAIL — new unguarded routes introduced. Add auth or PUBLIC ROUTE comment.');
  process.exit(1);
}

console.log('\n[auth-audit] Done.\n');
