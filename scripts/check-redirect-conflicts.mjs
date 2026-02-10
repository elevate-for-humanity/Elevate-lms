#!/usr/bin/env node
/**
 * CI guardrail: detect duplicate redirect paths across Netlify and Next.js.
 * Fails with exit code 1 if the same source path appears in both layers.
 *
 * Usage: node scripts/check-redirect-conflicts.mjs
 *
 * Rules enforced:
 *   A. Public/SEO redirects → Netlify only
 *   B. Auth/app redirects → next.config.mjs only
 *   C. No same-source duplicates across layers
 */

import { readFileSync } from 'fs';

// --- Parse Netlify redirects ---
const netlifyContent = readFileSync('netlify.toml', 'utf8');
const netlifyPaths = new Map();

const netlifyBlocks = netlifyContent.split('[[redirects]]').slice(1);
for (const block of netlifyBlocks) {
  const fromMatch = block.match(/from\s*=\s*"([^"]+)"/);
  const toMatch = block.match(/to\s*=\s*"([^"]+)"/);
  const statusMatch = block.match(/status\s*=\s*(\d+)/);
  if (fromMatch && toMatch && statusMatch) {
    const status = parseInt(statusMatch[1]);
    // Only care about redirect statuses, not rewrites (200) or gone (410)
    if ([301, 302, 307, 308].includes(status)) {
      const from = fromMatch[1];
      // Skip host-level redirects (https://...)
      if (!from.startsWith('http')) {
        netlifyPaths.set(from, { to: toMatch[1], status });
      }
    }
  }
}

// --- Parse next.config.mjs redirects ---
const nextContent = readFileSync('next.config.mjs', 'utf8');
const nextPaths = new Map();

const redirectRegex = /\{\s*source:\s*'([^']+)',\s*destination:\s*'([^']+)',\s*permanent:\s*(true|false)/g;
let match;
while ((match = redirectRegex.exec(nextContent)) !== null) {
  const source = match[1];
  const dest = match[2];
  const permanent = match[3] === 'true';
  nextPaths.set(source, { to: dest, status: permanent ? 301 : 302 });
}

// --- Explicit allowlist (paths that are intentionally in both layers) ---
// Add paths here ONLY with a comment explaining why.
const ALLOWLIST = new Set([
  // None currently. Keep it that way.
]);

// --- Find conflicts (Netlify vs next.config) ---
let conflicts = 0;

for (const [path, netlifyRule] of netlifyPaths) {
  const normalized = path.replace(/\/?\*$/, '').replace(/\/:splat$/, '');

  for (const [nextPath, nextRule] of nextPaths) {
    const nextNormalized = nextPath.replace(/\/:path\*$/, '').replace(/\/?\*$/, '');

    if (normalized === nextNormalized && !ALLOWLIST.has(normalized)) {
      conflicts++;
      const sameDest = netlifyRule.to === nextRule.to;
      console.error(
        `CONFLICT: "${path}" exists in both Netlify (→ ${netlifyRule.to}, ${netlifyRule.status}) ` +
        `and next.config (→ ${nextRule.to}, ${nextRule.status})` +
        (sameDest ? ' [same destination — remove one]' : ' [DIFFERENT destinations — fix immediately]')
      );
    }
  }
}

// --- Check for middleware.ts (should not exist — proxy.ts is the authority) ---
try {
  readFileSync('middleware.ts', 'utf8');
  conflicts++;
  console.error('CONFLICT: middleware.ts exists alongside proxy.ts. Next.js 16 uses proxy.ts only. Delete middleware.ts.');
} catch {
  // Good — no middleware.ts
}

// --- Report in-page redirect counts by directory ---
console.log('\n--- In-page redirect() usage by top-level directory ---');
import { execSync } from 'child_process';
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

// --- Exit ---
if (conflicts > 0) {
  console.error(`\n❌ ${conflicts} redirect conflict(s) found. Fix before deploying.`);
  process.exit(1);
} else {
  console.log(`\n✅ No redirect conflicts between Netlify and next.config.mjs.`);
  process.exit(0);
}
