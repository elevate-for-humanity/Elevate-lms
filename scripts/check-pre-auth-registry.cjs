#!/usr/bin/env node
/**
 * Pre-auth registry CI guard.
 *
 * Scans all API route files for pre-auth insert patterns and verifies every
 * affected table is declared in lib/pre-auth-tables.ts.
 *
 * A route is treated as a pre-auth risk when ALL of the following are true:
 *   1. No inline auth guard is present (see AUTH_PATTERNS below)
 *   2. It contains a .from('table').insert( or .from('table').upsert( call
 *   3. The insert payload references a user-identity column
 *
 * For every such table, one of these must be true or CI fails:
 *   A. Table is in ALL_REGISTERED_TABLES (lib/pre-auth-tables.ts)
 *   B. Route file contains: // pre-auth-registry: exempt — <reason>
 *
 * FAIL POSTURE: ambiguous cases fail closed.
 *
 * EXIT CODES
 *   0 — all pre-auth inserts are registered or exempted
 *   1 — unregistered pre-auth insert found (blocks merge)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT          = path.resolve(__dirname, '..');
const API_DIR       = path.join(ROOT, 'app', 'api');
const REGISTRY_FILE = path.join(ROOT, 'lib', 'pre-auth-tables.ts');
const REPORT_DIR    = path.join(ROOT, 'reports');

// 1. Parse registered tables from lib/pre-auth-tables.ts
const registrySource = fs.readFileSync(REGISTRY_FILE, 'utf8');
const registeredTables = new Set();
for (const match of registrySource.matchAll(/table:\s*['"]([^'"]+)['"]/g)) {
  registeredTables.add(match[1]);
}
if (registeredTables.size === 0) {
  console.error('[pre-auth-check] FATAL: Could not parse any tables from', REGISTRY_FILE);
  process.exit(1);
}

// 2. Auth guard patterns — presence of ANY = route has auth
const AUTH_PATTERNS = [
  /\.getUser\s*\(/,
  /\.getSession\s*\(/,
  /getCurrentUser\s*\(/,
  /createServerSupabaseClient\s*\(/,
  /requireApiRole\s*\(/,
  /requireRoleAPI\s*\(/,
  /apiAuthGuard\s*\(/,
  /apiRequireAdmin\s*\(/,
  /requireAdmin\s*\(/,
  /requireRole\s*\(/,
  /requireApiAuth\s*\(/,
  /withAuth\s*\(/,
  /CRON_SECRET/,
  /x-cron-secret/i,
  /constructEvent\s*\(/,
  /webhookSecret/,
  /WEBHOOK_SECRET/,
  /Stripe-Signature/i,
  /stripe\.webhooks/,
  /x-webhook-secret/i,
  /supabaseServiceKey/,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /x-internal-secret/i,
  /INTERNAL_SECRET/,
  /auth\.admin\.createUser/,
  /auth\.admin\.getUserBy/,
  /auditPiiAccess/,
];

const EXEMPT_RE     = /\/\/\s*pre-auth-registry:\s*exempt/i;
const INSERT_RE     = /\.from\s*\(\s*['"]([^'"]+)['"]\s*\)[\s\S]{0,300}?\.(insert|upsert)\s*\(/g;
const IDENTITY_COLS = /user_id|student_id|customer_email|recipient_id/;

// 3. Walk app/api
function walkDir(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, results);
    else if (entry.name === 'route.ts' || entry.name === 'route.js') results.push(full);
  }
  return results;
}
const routeFiles = walkDir(API_DIR);

// 4. Scan
const issues   = [];
const coverage = [];

for (const file of routeFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const rel    = path.relative(ROOT, file);

  if (EXEMPT_RE.test(source)) { coverage.push({ file: rel, status: 'exempt', tables: [] }); continue; }
  if (AUTH_PATTERNS.some(p => p.test(source))) { coverage.push({ file: rel, status: 'authenticated', tables: [] }); continue; }
  if (!source.includes('.insert(') && !source.includes('.upsert(')) { continue; }

  const tableMatches = [...source.matchAll(INSERT_RE)];
  if (tableMatches.length === 0) continue;

  const fileTables = [];
  for (const match of tableMatches) {
    const table       = match[1];
    const insertBlock = source.slice(match.index, match.index + 800);
    if (!IDENTITY_COLS.test(insertBlock)) continue;
    const registered = registeredTables.has(table);
    fileTables.push({ table, registered });
    if (!registered) issues.push({ file: rel, table });
  }

  if (fileTables.length > 0) {
    coverage.push({
      file: rel,
      status: fileTables.every(t => t.registered) ? 'registered' : 'UNREGISTERED',
      tables: fileTables,
    });
  }
}

// 5. Write coverage report
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(REPORT_DIR, 'pre_auth_registry_report.json'),
  JSON.stringify({
    generated_at: new Date().toISOString(),
    registered_tables: [...registeredTables].sort(),
    total_routes: routeFiles.length,
    issues_count: issues.length,
    issues,
    coverage: coverage.filter(c => c.status !== 'authenticated'),
  }, null, 2),
);

// 6. Output
console.log(`[pre-auth-check] Registry: ${registeredTables.size} tables registered`);
console.log(`[pre-auth-check] Scanned:  ${routeFiles.length} route files`);
console.log('');

if (issues.length === 0) {
  console.log('[pre-auth-check] All pre-auth inserts are registered or exempted.');
  console.log('[pre-auth-check] Report: reports/pre_auth_registry_report.json');
  process.exit(0);
}

console.error('[pre-auth-check] Pre-auth registry check failed.\n');
for (const { file, table } of issues) {
  console.error(`  Detected pre-auth insert into "${table}"`);
  console.error(`  File: ${file}`);
  console.error('');
  console.error('  Fix — choose one:');
  console.error(`    A. Register: add { table: '${table}', mode: 'reconcile'|'anonymous', ... } to lib/pre-auth-tables.ts`);
  console.error(`    B. Exempt:   add // pre-auth-registry: exempt — <reason>  to the top of the route file`);
  console.error('');
}
console.error(`[pre-auth-check] ${issues.length} issue(s). Merge blocked.`);
process.exit(1);
