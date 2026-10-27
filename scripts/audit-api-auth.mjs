#!/usr/bin/env node
/**
 * audit-api-auth.mjs
 *
 * Scans all application API route files and flags any that:
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
const API_DIRS = [
  join(ROOT, 'apps/admin/app/api'),
  join(ROOT, 'apps/lms/app/api'),
  join(ROOT, 'apps/marketing/app/api'),
  join(ROOT, 'app/api'), // Backward-compatible with the former single-app layout.
].filter(existsSync);
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
  /apiRequireDevStudio/,
  /capabilityHealthResponse/,
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
  /from ['"]@\/lib\/admin\/media-(?:assets|asset-item)-route['"]/,
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

const MODULE_EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs'];

function resolveLocalModule(fromFile, specifier) {
  const base = specifier.startsWith('@/')
    ? join(ROOT, specifier.slice(2))
    : specifier.startsWith('.')
      ? join(new URL('.', `file://${fromFile}`).pathname, specifier)
      : null;
  if (!base) return null;
  for (const suffix of MODULE_EXTENSIONS) {
    const candidate = `${base}${suffix}`;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  for (const suffix of MODULE_EXTENSIONS.slice(1)) {
    const candidate = join(base, `index${suffix}`);
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function moduleClosure(file, seen = new Set(), depth = 0) {
  if (seen.has(file) || depth > 5) return '';
  seen.add(file);
  const content = readFileSync(file, 'utf8');
  const dependencies = [];
  const importPattern = /(?:from\s*|import\s*)['"]([^'"]+)['"]/g;
  for (const match of content.matchAll(importPattern)) {
    const dependency = resolveLocalModule(file, match[1]);
    if (dependency) dependencies.push(moduleClosure(dependency, seen, depth + 1));
  }
  return [content, ...dependencies].join('\n');
}

if (API_DIRS.length === 0) {
  console.error('[auth-audit] FAIL — no application API directories were found.');
  process.exit(1);
}

const routes = API_DIRS.flatMap(walk);
const unguarded = [];

for (const route of routes) {
  const content = readFileSync(route, 'utf8');
  const authContext = moduleClosure(route);
  const rel = relative(ROOT, route);

  // Skip if explicitly exempt
  if (EXEMPT_PATTERNS.some((p) => p.test(content))) continue;

  // Skip if has auth
  if (AUTH_PATTERNS.some((p) => p.test(authContext))) continue;

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

function baselineKey(route) {
  return route.replace(/^apps\/(?:admin|lms|marketing)\//, '');
}

const newUnguarded = unguarded.filter((r) => !KNOWN_BASELINE.has(baselineKey(r)));
const baselineUnguarded = unguarded.filter((r) => KNOWN_BASELINE.has(baselineKey(r)));

console.log('\n=== API Auth Audit ===\n');
console.log(`Total routes scanned: ${routes.length}`);
console.log(`Application roots:    ${API_DIRS.length}`);
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
