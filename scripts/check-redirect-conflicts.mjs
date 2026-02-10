#!/usr/bin/env node
/**
 * CI guardrail: detect redirect conflicts across Netlify and Next.js.
 * Fails with exit code 1 on any conflict.
 *
 * Usage: node scripts/check-redirect-conflicts.mjs
 *
 * Checks:
 *   1. Same source path in both Netlify and next.config (Rule D)
 *   2. Wildcard/base overlap within the same layer
 *   3. middleware.ts existence (proxy.ts is the authority in Next.js 16)
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// --- Helpers ---

/** Normalize a path for comparison: lowercase, strip trailing slash, strip wildcard suffixes */
function normalize(path) {
  let p = path.toLowerCase().trim();
  // Strip trailing slash (but keep "/" as-is)
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  // Strip wildcard/splat suffixes for base comparison
  p = p
    .replace(/\/\*$/, '')
    .replace(/\/:splat$/, '')
    .replace(/\/:path\*$/, '')
    .replace(/\/:slug$/, '')
    .replace(/\/:slug\/\*$/, '')
    .replace(/\/:slug\/:path\*$/, '');
  // Strip trailing slash again after suffix removal
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/** Check if a path pattern is a wildcard (matches sub-paths) */
function isWildcard(path) {
  return /(\/:path\*|\/:splat|\/\*|\/:slug\/:path\*|\/:slug\/\*)$/.test(path);
}

// --- Parse Netlify redirects ---
const netlifyContent = readFileSync('netlify.toml', 'utf8');
const netlifyRules = [];

const netlifyBlocks = netlifyContent.split('[[redirects]]').slice(1);
for (const block of netlifyBlocks) {
  const fromMatch = block.match(/from\s*=\s*"([^"]+)"/);
  const toMatch = block.match(/to\s*=\s*"([^"]+)"/);
  const statusMatch = block.match(/status\s*=\s*(\d+)/);
  if (fromMatch && toMatch && statusMatch) {
    const status = parseInt(statusMatch[1]);
    if ([301, 302, 307, 308].includes(status)) {
      const from = fromMatch[1];
      if (!from.startsWith('http')) {
        netlifyRules.push({ from, to: toMatch[1], status, layer: 'netlify' });
      }
    }
  }
}

// --- Parse next.config.mjs redirects ---
const nextContent = readFileSync('next.config.mjs', 'utf8');
const nextRules = [];

// Parse only uncommented redirect lines from next.config.mjs
const nextLines = nextContent.split('\n');
const redirectRegex = /\{\s*source:\s*'([^']+)',\s*destination:\s*'([^']+)',\s*permanent:\s*(true|false)/;
for (const line of nextLines) {
  const trimmed = line.trim();
  // Skip commented-out lines
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
  const match = redirectRegex.exec(trimmed);
  if (match) {
    nextRules.push({
      from: match[1],
      to: match[2],
      status: match[3] === 'true' ? 301 : 302,
      layer: 'next.config',
    });
  }
}

// --- Explicit allowlist ---
const ALLOWLIST = new Set([
  // None currently. Keep it that way.
]);

let conflicts = 0;

// --- Check 1: Cross-layer conflicts (Netlify vs next.config) ---
console.log('--- Cross-layer conflict check ---');
for (const nr of netlifyRules) {
  const nrNorm = normalize(nr.from);
  for (const xr of nextRules) {
    const xrNorm = normalize(xr.from);
    if (nrNorm === xrNorm && !ALLOWLIST.has(nrNorm)) {
      conflicts++;
      const sameDest = nr.to === xr.to;
      console.error(
        `CONFLICT: "${nr.from}" in Netlify (→ ${nr.to}, ${nr.status}) ` +
        `and "${xr.from}" in next.config (→ ${xr.to}, ${xr.status})` +
        (sameDest ? ' [same dest — remove one]' : ' [DIFFERENT dests — fix now]')
      );
    }
  }
}

// --- Check 2: Wildcard/base overlap within each layer ---
console.log('\n--- Wildcard/base overlap check ---');

function checkOverlaps(rules, layerName) {
  const wildcards = rules.filter(r => isWildcard(r.from));
  const bases = rules.filter(r => !isWildcard(r.from));

  for (const wc of wildcards) {
    const wcBase = normalize(wc.from);
    for (const base of bases) {
      const baseNorm = normalize(base.from);
      if (wcBase !== baseNorm) continue;

      // Check if the base rule appears BEFORE the wildcard (order matters in Netlify)
      const baseIdx = rules.indexOf(base);
      const wcIdx = rules.indexOf(wc);
      const baseFirst = baseIdx < wcIdx;

      const netlifyStyle = wc.from.endsWith('/*') || wc.from.endsWith('/:splat');
      if (netlifyStyle && !baseFirst) {
        // Wildcard appears before base rule — base will never match
        conflicts++;
        console.error(
          `OVERLAP [${layerName}]: wildcard "${wc.from}" (→ ${wc.to}) appears before ` +
          `base "${base.from}" (→ ${base.to}). Move base rule above wildcard.`
        );
      } else if (netlifyStyle && baseFirst) {
        // Base rule is first — Netlify matches it before the wildcard. Safe.
        console.log(
          `  OK [${layerName}]: "${base.from}" precedes "${wc.from}" (base matches first).`
        );
      } else {
        // Next.js :path* requires a segment, so /portal and /portal/:path* don't overlap.
        console.log(
          `  OK [${layerName}]: "${wc.from}" and "${base.from}" coexist (:path* requires a segment).`
        );
      }
    }
  }
}

checkOverlaps(netlifyRules, 'netlify');
checkOverlaps(nextRules, 'next.config');

// --- Check 3: middleware.ts should not exist ---
console.log('\n--- middleware.ts check ---');
try {
  readFileSync('middleware.ts', 'utf8');
  conflicts++;
  console.error('CONFLICT: middleware.ts exists alongside proxy.ts. Delete middleware.ts.');
} catch {
  console.log('  OK: No middleware.ts found.');
}

// --- Report in-page redirect() usage ---
console.log('\n--- In-page redirect() usage by top-level directory ---');
try {
  const grepOutput = execSync(
    `find app -name "page.tsx" -not -path "*/node_modules/*" -not -path "*/_archived/*" -exec grep -l "redirect(" {} \\;`,
    { encoding: 'utf8' }
  ).trim().split('\n').filter(Boolean);

  const dirCounts = {};
  for (const file of grepOutput) {
    const parts = file.replace('app/', '').split('/');
    const topDir = parts[0].replace(/^\(.*\)$/, '(group)');
    dirCounts[topDir] = (dirCounts[topDir] || 0) + 1;
  }

  const sorted = Object.entries(dirCounts).sort((a, b) => b[1] - a[1]);
  for (const [dir, count] of sorted) {
    console.log(`  ${String(count).padStart(4)}  app/${dir}/`);
  }
  console.log(`  ${String(grepOutput.length).padStart(4)}  TOTAL`);
} catch {
  console.log('  (no in-page redirects found)');
}

// --- Exit ---
if (conflicts > 0) {
  console.error(`\n❌ ${conflicts} redirect conflict(s) found. Fix before deploying.`);
  process.exit(1);
} else {
  console.log(`\n✅ No redirect conflicts detected.`);
  process.exit(0);
}
