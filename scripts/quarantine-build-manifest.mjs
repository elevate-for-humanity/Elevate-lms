#!/usr/bin/env node
/**
 * quarantine-build-manifest.mjs
 *
 * Scans the app/ directory and produces quarantine-routes.json.
 * Run after any quarantine/restore operation to keep the manifest current.
 *
 *   pnpm quarantine:manifest
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { globSync } from 'glob';

const ROOT = process.cwd();
const MANIFEST_PATH = join(ROOT, 'quarantine-routes.json');

// ── High-risk prefixes: never quarantine without manual review ──────────────
const HIGH_RISK_PREFIXES = [
  '/apply',
  '/accept-invite',
  '/login',
  '/signup',
  '/reset-password',
  '/forgot-password',
  '/auth',
  '/api/auth',
  '/api/applications',
  '/api/enrollment',
  '/api/enroll',
  '/api/program-holder',
  '/program-holder',
  '/admin/dashboard',
  '/payment',
  '/checkout',
  '/api/stripe',
  '/api/checkout',
  '/api/payments',
  '/api/webhooks',
];

// ── Ref-detection patterns ──────────────────────────────────────────────────
// Covers: href, Link href, router.push/replace, redirect(), fetch(), axios,
//         template-string routes, middleware redirects
const REF_PATTERNS = [
  /href\s*=\s*[`'"](\/[^`'"]+)/g,
  /router\.(push|replace)\s*\(\s*[`'"](\/[^`'"]+)/g,
  /redirect\s*\(\s*[`'"](\/[^`'"]+)/g,
  /permanentRedirect\s*\(\s*[`'"](\/[^`'"]+)/g,
  /fetch\s*\(\s*[`'"](\/[^`'"]+)/g,
  /axios\.[a-z]+\s*\(\s*[`'"](\/[^`'"]+)/g,
  // template literals: fetch(`/api/${...}`) — capture the static prefix
  /fetch\s*\(\s*`(\/[^`$]+)/g,
  /axios\.[a-z]+\s*\(\s*`(\/[^`$]+)/g,
  /router\.(push|replace)\s*\(\s*`(\/[^`$]+)/g,
];

function extractRefs(content) {
  const refs = new Set();
  for (const pattern of REF_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m;
    while ((m = re.exec(content)) !== null) {
      // Last capture group is the path
      const path = m[m.length - 1];
      if (path && path.startsWith('/')) {
        // Normalize: strip query/hash, keep path only
        refs.add(path.split('?')[0].split('#')[0]);
      }
    }
  }
  return refs;
}

function appPathToRoute(filePath) {
  // Convert app/foo/bar/page.tsx → /foo/bar
  // Convert app/api/foo/route.ts → /api/foo
  let route = filePath
    .replace(/^app/, '')
    .replace(/\/page\.tsx$/, '')
    .replace(/\/route\.ts$/, '')
    .replace(/\/\(app\)/, '')
    .replace(/\/\(auth\)/, '')
    .replace(/\/\(dashboard\)/, '')
    .replace(/\/\(partner\)/, '')
    .replace(/\/\(public\)/, '')
    .replace(/\/layout\.tsx$/, '');
  return route || '/';
}

function isQuarantined(filePath) {
  return filePath.split('/').some((seg) => seg.startsWith('__'));
}

function quarantinedToLive(filePath) {
  return filePath.replace(/\/__([^/]+)/g, '/$1');
}

function liveToQuarantined(filePath) {
  // Prefix the last non-__ segment that is the quarantine target
  // We quarantine at the directory level, not the file
  return filePath; // handled by restore script
}

function isHighRisk(route) {
  return HIGH_RISK_PREFIXES.some((prefix) => route === prefix || route.startsWith(prefix + '/'));
}

// ── Collect all source files for ref scanning ───────────────────────────────
console.log('Scanning source files for refs...');
const sourceFiles = globSync('**/*.{tsx,ts}', {
  cwd: ROOT,
  // Exclude quarantined dirs and _archived — refs from dead code don't count
  ignore: [
    'node_modules/**',
    '.next/**',
    'scripts/**',
    '_archived/**',
    'app/**/__*/**',
    'app/__*/**',
  ],
  absolute: true,
});

// Build a map: route prefix → count of live refs
const refCounts = new Map(); // route → Set of files referencing it

for (const file of sourceFiles) {
  if (isQuarantined(relative(ROOT, file))) continue; // skip quarantined source
  const content = readFileSync(file, 'utf8');
  const refs = extractRefs(content);
  for (const ref of refs) {
    if (!refCounts.has(ref)) refCounts.set(ref, new Set());
    refCounts.get(ref).add(relative(ROOT, file));
  }
}

// ── Collect all routes (live + quarantined) ─────────────────────────────────
console.log('Collecting routes...');
const allFiles = globSync('app/**/+(page.tsx|route.ts)', {
  cwd: ROOT,
  ignore: ['node_modules/**', '.next/**'],
});

const entries = [];

for (const file of allFiles) {
  const quarantined = isQuarantined(file);
  const liveFile = quarantined ? quarantinedToLive(file) : file;
  const route = appPathToRoute(liveFile);
  const type = file.endsWith('page.tsx') ? 'page' : 'route';

  // Count refs: exact match + prefix matches (for dynamic routes)
  let refCount = 0;
  const refFiles = new Set();
  for (const [ref, files] of refCounts) {
    // Match exact or if route is a prefix of ref (dynamic segment)
    const routeBase = route.replace(/\/\[[^\]]+\]/g, ''); // strip dynamic segments
    if (ref === route || ref.startsWith(route + '/') || (routeBase && ref.startsWith(routeBase))) {
      refCount += files.size;
      for (const f of files) refFiles.add(f);
    }
  }

  const highRisk = isHighRisk(route);

  let classification;
  if (quarantined) {
    classification = 'quarantined';
  } else if (highRisk) {
    classification = 'core'; // high-risk = always core
  } else if (refCount > 0) {
    classification = 'core';
  } else {
    classification = 'candidate-quarantine';
  }

  // Build restore command
  const quarantinedPath = quarantined ? file : null;
  const livePath = quarantined ? liveFile : file;
  const restoreCmd = quarantined ? `pnpm quarantine:restore "${route}"` : null;

  // Risk level
  let risk;
  if (highRisk) risk = 'high';
  else if (refCount === 0) risk = 'low';
  else if (refCount <= 3) risk = 'medium';
  else risk = 'high';

  entries.push({
    route,
    type,
    classification,
    risk,
    quarantined,
    quarantinedPath: quarantinedPath,
    livePath,
    detectedRefs: refCount,
    refFiles: [...refFiles].slice(0, 10), // cap at 10 for readability
    highRisk,
    restoreCommand: restoreCmd,
  });
}

// Sort: quarantined first, then by route
entries.sort((a, b) => {
  if (a.quarantined !== b.quarantined) return a.quarantined ? -1 : 1;
  return a.route.localeCompare(b.route);
});

const manifest = {
  generatedAt: new Date().toISOString(),
  summary: {
    total: entries.length,
    live: entries.filter((e) => !e.quarantined).length,
    quarantined: entries.filter((e) => e.quarantined).length,
    candidateQuarantine: entries.filter((e) => e.classification === 'candidate-quarantine').length,
    core: entries.filter((e) => e.classification === 'core').length,
    highRisk: entries.filter((e) => e.highRisk).length,
  },
  highRiskPrefixes: HIGH_RISK_PREFIXES,
  routes: entries,
};

writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
console.log(`\nManifest written to quarantine-routes.json`);
console.log(`  Total routes:        ${manifest.summary.total}`);
console.log(`  Live:                ${manifest.summary.live}`);
console.log(`  Quarantined:         ${manifest.summary.quarantined}`);
console.log(`  Candidate quarantine:${manifest.summary.candidateQuarantine}`);
console.log(`  Core (has refs):     ${manifest.summary.core}`);
console.log(`  High-risk:           ${manifest.summary.highRisk}`);
