#!/usr/bin/env node
/**
 * guard-public-routes.mjs
 *
 * Pre-build guard. Fails with a non-zero exit code if any public-facing
 * page.tsx violates one of these rules:
 *
 * RULE 1 — Demo surface noindex
 *   Any page.tsx under a demo prefix must have robots noindex, either in
 *   the file itself or in a layout.tsx ancestor within the same subtree.
 *   Demo prefixes: /demo, /demos, /store/demo, /store/demos
 *
 * RULE 2 — Redirect stubs must have noindex
 *   Any page.tsx that is a pure redirect stub (only calls redirect(), ≤12 lines)
 *   must export noindex metadata. These pages should never be indexed — the
 *   canonical URL is the redirect target.
 *
 * RULE 3 — Store routes noindex
 *   Any page.tsx under /store must have robots noindex. The store is B2B
 *   infrastructure, not public program content.
 *
 * RULE 4 — Portal-like pages outside protected prefixes must have noindex
 *   Any page.tsx outside /admin, /lms, etc. that imports portal/dashboard
 *   components or uses auth guards (requireAdmin, withAuth) must have
 *   robots noindex. These are authenticated surfaces exposed at public URLs —
 *   they should redirect unauthenticated users, not be indexed.
 *
 * Usage:
 *   node scripts/guard-public-routes.mjs          # exits 1 on violations
 *   node scripts/guard-public-routes.mjs --report # prints report, exits 0
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';

const REPORT_ONLY = process.argv.includes('--report');
const ROOT = process.cwd();
const APP_DIR = join(ROOT, 'app');

// ── Helpers ──────────────────────────────────────────────────────────────────

function readFile(path) {
  try { return readFileSync(path, 'utf8'); } catch { return ''; }
}

function hasNoindex(content) {
  // Only match explicit metadata exports — not JSX meta tags or comments.
  // Matches: robots: { index: false, ... } inside a metadata/Metadata export.
  // Does NOT match: <meta name="robots" content="noindex"> (JSX, may be conditional)
  return /robots\s*:\s*\{[^}]*index\s*:\s*false/.test(content);
}

/** Walk a directory, yielding all file paths matching a predicate. */
function* walk(dir, predicate) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full, predicate);
    } else if (predicate(entry.name)) {
      yield full;
    }
  }
}

/**
 * Check if a page.tsx is covered by noindex — either in the file itself
 * or in a layout.tsx ancestor within the app/ subtree.
 */
function isCoveredByNoindex(pageFile) {
  if (hasNoindex(readFile(pageFile))) return true;

  // Walk up the directory tree looking for a layout.tsx with noindex
  let dir = dirname(pageFile);
  while (dir.startsWith(APP_DIR)) {
    const layout = join(dir, 'layout.tsx');
    if (existsSync(layout) && hasNoindex(readFile(layout))) return true;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return false;
}

/** Returns true if the file is a pure redirect stub (no real content). */
function isPureRedirectStub(content) {
  const lines = content.split('\n').filter(l => l.trim());
  // Must call redirect() and have ≤12 non-empty lines
  return lines.length <= 12 && /redirect\(/.test(content);
}

// ── Route prefix definitions ─────────────────────────────────────────────────

const DEMO_PREFIXES = [
  join(APP_DIR, 'demo'),
  join(APP_DIR, 'demos'),
  join(APP_DIR, 'store', 'demo'),
  join(APP_DIR, 'store', 'demos'),
];

const STORE_PREFIX = join(APP_DIR, 'store');

// Routes that are intentionally public and don't need noindex even if they
// look like redirect stubs (e.g., they redirect to authenticated areas which
// is the correct UX — the page itself is a valid public entry point).
const REDIRECT_STUB_ALLOWLIST = new Set([
  'app/partner/page.tsx',           // /partner → /partner-portal (auth gate)
  'app/programs/admin/page.tsx',    // /programs/admin → /login (security)
]);

// ── Violations collector ──────────────────────────────────────────────────────

const violations = [];

function report(rule, file, detail) {
  violations.push({ rule, file: relative(ROOT, file), detail });
}

// ── RULE 1 & 3: Demo + Store surface noindex ─────────────────────────────────

for (const prefix of DEMO_PREFIXES) {
  if (!existsSync(prefix)) continue;
  for (const pageFile of walk(prefix, n => n === 'page.tsx')) {
    if (!isCoveredByNoindex(pageFile)) {
      report('RULE1', pageFile, 'Demo route missing robots noindex (file or layout ancestor)');
    }
  }
}

// Store routes (excluding store/demo which is already covered by DEMO_PREFIXES)
if (existsSync(STORE_PREFIX)) {
  for (const pageFile of walk(STORE_PREFIX, n => n === 'page.tsx')) {
    // Skip store/demo — already checked above
    if (DEMO_PREFIXES.some(p => pageFile.startsWith(p))) continue;
    if (!isCoveredByNoindex(pageFile)) {
      report('RULE3', pageFile, 'Store route missing robots noindex (store is B2B, not public content)');
    }
  }
}

// ── RULE 2 & 4: Redirect stubs + portal-like pages ───────────────────────────

// Only check public routes — skip protected prefixes
const PROTECTED_PREFIXES = [
  join(APP_DIR, 'admin'),
  join(APP_DIR, 'lms'),
  join(APP_DIR, 'api'),
  join(APP_DIR, '(dashboard)'),
  join(APP_DIR, 'student-portal'),
  join(APP_DIR, 'staff-portal'),
  join(APP_DIR, 'employer-portal'),
  join(APP_DIR, 'partner-portal'),
  join(APP_DIR, 'workforce-board'),
  join(APP_DIR, 'instructor'),
  join(APP_DIR, 'program-holder'),
  join(APP_DIR, 'testing'),
  join(APP_DIR, 'store'),   // store has its own rule
];

// Patterns that indicate a page is an authenticated/portal surface.
// NOTE: requireAdminClient alone is NOT a portal signal — it's used for DB reads
// on public pages. A page is portal-like only if it ALSO has an auth redirect.
//
// PORTAL_AUTH_REDIRECT: page redirects unauthenticated users to /login
// PORTAL_COMPONENT: page imports a known portal shell component by path
const PORTAL_AUTH_REDIRECT = /redirect\([`'"][^`'"]*\/login[^`'"]*[`'"]\)/;

const PORTAL_COMPONENT_IMPORT = [
  /from ['"].*\/(portal|dashboard)[-/](shell|layout|nav|sidebar)/i,
  /import.*DashboardShell|PortalShell|PortalLayout|DashboardLayout/,
  /import.*AdminSidebar|PortalSidebar|DashboardSidebar/,
];

// A page is portal-like if it has an auth redirect AND uses admin/session guards
// (not just requireAdminClient for DB reads)
const PORTAL_AUTH_GUARD = /\b(requireAdmin|apiRequireAdmin|withAdmin|getServerSession|requireSession|withAuth\()/;

const PORTAL_PATTERNS = PORTAL_COMPONENT_IMPORT; // component imports are always portal signals

for (const pageFile of walk(APP_DIR, n => n === 'page.tsx')) {
  // Skip protected routes
  if (PROTECTED_PREFIXES.some(p => pageFile.startsWith(p))) continue;
  // Skip demo prefixes (already checked)
  if (DEMO_PREFIXES.some(p => pageFile.startsWith(p))) continue;

  const rel = relative(ROOT, pageFile);
  if (REDIRECT_STUB_ALLOWLIST.has(rel)) continue;

  const content = readFile(pageFile);

  // RULE 2: redirect stubs
  if (isPureRedirectStub(content) && !isCoveredByNoindex(pageFile)) {
    const dest = (content.match(/redirect\(['"]([^'"]+)['"]\)/) || [])[1] ?? '?';
    report('RULE2', pageFile, `Redirect stub → ${dest} missing robots noindex`);
  }

  // RULE 4: portal-like pages at public URLs
  // Triggers on EITHER:
  //   a) imports a known portal shell component (always a portal signal), OR
  //   b) has an auth redirect to /login AND uses an auth guard (not just DB reads)
  const importsPortalComponent = PORTAL_COMPONENT_IMPORT.some(p => p.test(content));
  const hasAuthRedirect = PORTAL_AUTH_REDIRECT.test(content);
  const hasAuthGuard = PORTAL_AUTH_GUARD.test(content);
  const isPortalLike = importsPortalComponent || (hasAuthRedirect && hasAuthGuard);

  if (isPortalLike && !isCoveredByNoindex(pageFile)) {
    const hint = importsPortalComponent ? 'imports portal shell component'
      : `auth redirect + guard (${(content.match(PORTAL_AUTH_GUARD) || [''])[0].slice(0,40)})`;
    report('RULE4', pageFile, `Portal/auth-gated page at public URL missing robots noindex — ${hint}`);
  }
}

// ── Output ────────────────────────────────────────────────────────────────────

if (violations.length === 0) {
  console.log('✅ guard-public-routes: no violations');
  process.exit(0);
}

console.error(`\n❌ guard-public-routes: ${violations.length} violation(s)\n`);

const byRule = {};
for (const v of violations) {
  (byRule[v.rule] ??= []).push(v);
}

for (const [rule, items] of Object.entries(byRule)) {
  const labels = {
    RULE1: 'RULE 1 — Demo surface missing noindex',
    RULE2: 'RULE 2 — Redirect stub missing noindex',
    RULE3: 'RULE 3 — Store route missing noindex',
    RULE4: 'RULE 4 — Portal/auth-gated page at public URL missing noindex',
  };
  console.error(`  ${labels[rule] ?? rule} (${items.length})`);
  for (const v of items) {
    console.error(`    ${v.file}`);
    console.error(`      ${v.detail}`);
  }
  console.error('');
}

console.error('Fix: add  robots: { index: false, follow: false }  to the metadata export,');
console.error('     or add it to the nearest layout.tsx ancestor.\n');

if (REPORT_ONLY) {
  process.exit(0);
} else {
  process.exit(1);
}
