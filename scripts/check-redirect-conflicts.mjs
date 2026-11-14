#!/usr/bin/env node
/**
 * check-redirect-conflicts.mjs
 *
 * Pre-build guard. Scans next.config.mjs for redirect conflicts:
 *
 * RULE 1 — Duplicate source paths
 *   The same source pattern appears more than once. The second (and any
 *   subsequent) entry can never be reached and should be removed.
 *
 * RULE 2 — Wildcard shadowing
 *   A wildcard redirect (e.g. /programs/:path*) appears BEFORE a more
 *   specific static redirect (e.g. /programs/specific-page), making the
 *   specific redirect unreachable. Reorder so specific routes come first.
 *
 * By default the script prints a summary and exits 0 so it never blocks
 * the build on its own — matching the `continue-on-error: true` semantics
 * used for redirect scanning in the diagnostics CI workflow.
 *
 * Pass --strict to exit 1 when conflicts are found (e.g. for enforcement
 * in a dedicated linting step).
 *
 * Usage:
 *   node scripts/check-redirect-conflicts.mjs           # always exits 0
 *   node scripts/check-redirect-conflicts.mjs --strict  # exits 1 on conflicts
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const STRICT = process.argv.includes('--strict');
const ROOT = process.cwd();

// ── Read next.config.mjs ──────────────────────────────────────────────────────

const configPath = join(ROOT, 'next.config.mjs');
let configContent;
try {
  configContent = readFileSync(configPath, 'utf8');
} catch {
  console.error('❌  check-redirect-conflicts: cannot read next.config.mjs');
  process.exit(STRICT ? 1 : 0);
}

// ── Extract redirect source patterns (static parse) ───────────────────────────
// We use a regex to pull every  source: '...'  or  source: "..."  value that
// appears inside the redirects() block. Dynamic values (alias.source) are
// intentionally skipped — they are validated at runtime by Next.js itself.

const sourcePattern = /\bsource:\s*['"`]([^'"`]+)['"`]/g;
const sources = [];
let m;
while ((m = sourcePattern.exec(configContent)) !== null) {
  sources.push(m[1]);
}

if (sources.length === 0) {
  console.log('ℹ️   check-redirect-conflicts: no static redirect sources found — skipping.');
  process.exit(0);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns true if the source pattern is a true wildcard (catches multiple paths).
 * Examples:  /programs/:path*   /foo/*
 * Excludes:  /users/:id         (single named param, not a catch-all)
 */
function isWildcardRoute(src) {
  return src.includes(':path*') || /\/\*$/.test(src);
}

/**
 * Returns true if the source is a purely static path with no params or wildcards.
 */
function isStaticRoute(src) {
  return !src.includes(':') && !src.includes('*');
}

/**
 * Returns the static path prefix that a wildcard covers.
 * /programs/:path*  →  /programs
 * /foo/*            →  /foo
 */
function wildcardPrefix(src) {
  return src
    .replace(/\/:path\*$/, '')   // /prefix/:path*  →  /prefix
    .replace(/\/\*$/, '');       // /prefix/*        →  /prefix
}

// ── Conflict detection ────────────────────────────────────────────────────────

const conflicts = [];

// RULE 1 — Duplicate source paths
const firstSeen = new Map(); // source → index of first occurrence
for (let i = 0; i < sources.length; i++) {
  const src = sources[i];
  if (firstSeen.has(src)) {
    conflicts.push({
      rule: 'RULE1',
      detail: `Duplicate source "${src}" — first at position ${firstSeen.get(src) + 1}, repeated at position ${i + 1}`,
    });
  } else {
    firstSeen.set(src, i);
  }
}

// RULE 2 — Wildcard shadowing
// Collect all true wildcards in declaration order, then check whether any
// static route that appears later would be matched by an earlier wildcard.
const wildcards = sources
  .map((src, idx) => ({ src, idx }))
  .filter(({ src }) => isWildcardRoute(src));

for (const { src: wildcard, idx: widx } of wildcards) {
  const prefix = wildcardPrefix(wildcard);
  if (!prefix || prefix === '/') continue;

  for (let j = widx + 1; j < sources.length; j++) {
    const candidate = sources[j];
    // Only flag static routes (no params, no wildcards) that fall under the
    // wildcard's prefix — the wildcard would swallow them before they're reached.
    if (isStaticRoute(candidate) && candidate.startsWith(prefix + '/')) {
      conflicts.push({
        rule: 'RULE2',
        detail: `Wildcard "${wildcard}" (pos ${widx + 1}) shadows "${candidate}" (pos ${j + 1}) — move specific route before the wildcard`,
      });
    }
  }
}

// ── Output ────────────────────────────────────────────────────────────────────

if (conflicts.length === 0) {
  console.log(`✅  check-redirect-conflicts: no conflicts detected (${sources.length} sources scanned)`);
  process.exit(0);
}

// Group by rule for a readable summary
const byRule = {};
for (const c of conflicts) {
  (byRule[c.rule] ??= []).push(c);
}

const labels = {
  RULE1: 'RULE 1 — Duplicate source paths (dead redirect entries)',
  RULE2: 'RULE 2 — Wildcard shadowing (specific route unreachable)',
};

const prefix = STRICT ? '❌' : '⚠️ ';
console.log(`\n${prefix}  check-redirect-conflicts: ${conflicts.length} conflict(s) found in next.config.mjs\n`);

for (const [rule, items] of Object.entries(byRule)) {
  console.log(`  ${labels[rule] ?? rule} (${items.length})`);
  for (const c of items) {
    console.log(`    ${c.detail}`);
  }
  console.log('');
}

console.log('  Fix: open next.config.mjs → redirects() and resolve the conflicts above.');
console.log('  Run with --strict to block CI on conflicts.\n');

// In strict mode, fail the build so conflicts cannot be silently ignored.
process.exit(STRICT ? 1 : 0);
