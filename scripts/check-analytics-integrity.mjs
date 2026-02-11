#!/usr/bin/env node
/**
 * CI guardrail: enforce single-source GA4 analytics wiring.
 * Fails with exit code 1 if someone reintroduces duplicate injectors
 * or hardcoded measurement IDs.
 *
 * Usage: node scripts/check-analytics-integrity.mjs
 *
 * Rules:
 *   1. Only one file in components/ or lib/ may inject gtag.js
 *   2. No hardcoded GA4 measurement IDs (G-XXXXXXXXXX pattern) in .tsx/.ts/.jsx
 *   3. No gtag('config') calls outside the canonical loader
 *
 * Canonical loader: components/analytics/google-analytics.tsx
 */

import { execSync } from 'child_process';

const CANONICAL_LOADER = 'components/analytics/google-analytics.tsx';
let failures = 0;

function grep(pattern, extensions, excludeDirs = []) {
  const includes = extensions.map(e => `--include="*.${e}"`).join(' ');
  const excludes = excludeDirs.map(d => `--exclude-dir="${d}"`).join(' ');
  try {
    const result = execSync(
      `grep -rn "${pattern}" ${includes} ${excludes} .`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch {
    return []; // grep returns exit 1 when no matches
  }
}

function fail(rule, message, matches) {
  failures++;
  console.error(`\n❌ FAIL: ${rule}`);
  console.error(`   ${message}`);
  for (const m of matches) {
    console.error(`   ${m}`);
  }
}

function pass(rule) {
  console.log(`✅ PASS: ${rule}`);
}

// --- Rule 1: Only one gtag.js injector in source code ---
const injectors = grep('googletagmanager\\.com/gtag', ['tsx', 'ts', 'jsx'], ['node_modules', '.next'])
  .filter(line => !line.includes('public/')); // Exclude static HTML (separate concern)

if (injectors.length === 0) {
  fail('Rule 1', 'No gtag.js injector found. The canonical loader may have been deleted.', []);
} else if (injectors.length === 1 && injectors[0].includes(CANONICAL_LOADER)) {
  pass('Rule 1 — Single gtag.js injector (canonical loader)');
} else {
  const nonCanonical = injectors.filter(l => !l.includes(CANONICAL_LOADER));
  if (nonCanonical.length > 0) {
    fail('Rule 1', `Found gtag.js injection outside canonical loader:`, nonCanonical);
  } else {
    pass('Rule 1 — Single gtag.js injector (canonical loader)');
  }
}

// --- Rule 2: No hardcoded GA4 measurement IDs ---
// Match G- followed by 8+ alphanumeric chars, exclude placeholders and docs
const hardcodedIds = grep('G-[A-Z0-9]\\{8,\\}', ['tsx', 'ts', 'jsx'], ['node_modules', '.next'])
  .filter(line => !line.includes('G-XXXXXXXXXX'))  // placeholder
  .filter(line => !line.includes('.env.example'))   // documentation
  .filter(line => !line.includes('partnerCode'))    // false positive
  .filter(line => !line.includes('public/'));        // static HTML (separate concern)

if (hardcodedIds.length === 0) {
  pass('Rule 2 — No hardcoded GA4 measurement IDs in source');
} else {
  fail('Rule 2', 'Hardcoded GA4 measurement IDs found:', hardcodedIds);
}

// --- Rule 3: No gtag('config') outside canonical loader ---
const configCalls = grep("gtag('config'\\|gtag(\"config\"", ['tsx', 'ts'], ['node_modules', '.next'])
  .filter(line => !line.includes(CANONICAL_LOADER))
  .filter(line => !line.includes('public/'));

if (configCalls.length === 0) {
  pass('Rule 3 — No gtag("config") calls outside canonical loader');
} else {
  fail('Rule 3', 'gtag("config") calls found outside canonical loader:', configCalls);
}

// --- Summary ---
console.log(`\n${'='.repeat(50)}`);
if (failures > 0) {
  console.error(`\n${failures} analytics integrity check(s) FAILED.`);
  console.error(`Canonical loader: ${CANONICAL_LOADER}`);
  console.error(`All GA4 loading must go through this single file.`);
  process.exit(1);
} else {
  console.log('\nAll analytics integrity checks passed.');
  console.log(`Canonical loader: ${CANONICAL_LOADER}`);
}
