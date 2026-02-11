#!/usr/bin/env node
/**
 * CI guardrail: enforce self-service funnel policy.
 * Flags phone-gate patterns that should be replaced with self-service CTAs.
 *
 * Usage: node scripts/check-self-service-policy.mjs
 *
 * Rules:
 *   1. No tel: links in store/, pricing/, or platform/ pages (sales funnel)
 *   2. No "Schedule a Demo" or "Schedule Demo" as CTA text in store/ pages
 *   3. No "Request Access" as primary CTA in store/ or pricing/ pages
 *
 * Allowed exceptions:
 *   - tel: links in accessibility, donate, contact, help, legal pages
 *   - "Schedule" in API routes (email templates, backend logic)
 *   - "Request Access" in policy/legal/security context
 */

import { execSync } from 'child_process';

let warnings = 0;

function grep(patterns, paths, extensions) {
  // patterns can be a string or array of strings
  const patternList = Array.isArray(patterns) ? patterns : [patterns];
  const includes = extensions.map(e => `--include='*.${e}'`).join(' ');
  const patternFlags = patternList.map(p => `-e '${p}'`).join(' ');
  const cmd = `grep -rni ${patternFlags} ${includes} ${paths}`;
  try {
    const result = execSync(cmd, { encoding: 'utf-8', cwd: process.cwd() });
    return result.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function warn(rule, message, matches) {
  warnings++;
  console.warn(`\n⚠️  WARNING: ${rule}`);
  console.warn(`   ${message}`);
  for (const m of matches.slice(0, 5)) {
    console.warn(`   ${m}`);
  }
  if (matches.length > 5) {
    console.warn(`   ... and ${matches.length - 5} more`);
  }
}

function pass(rule) {
  console.log(`✅ PASS: ${rule}`);
}

// --- Rule 1: No tel: links in sales funnel pages ---
const salesFunnelPaths = 'app/store app/pricing app/platform';
const telInFunnel = grep('tel:', salesFunnelPaths, ['tsx', 'ts']);

if (telInFunnel.length === 0) {
  pass('Rule 1 — No tel: links in store/pricing/platform pages');
} else {
  warn('Rule 1', 'tel: links found in sales funnel pages (should use self-service CTAs):', telInFunnel);
}

// --- Rule 2: No "Schedule Demo" CTAs in store pages ---
const scheduleDemoInStore = grep(['Schedule.*Demo', 'Schedule.*demo'], 'app/store', ['tsx'])
  .filter(line => !line.includes('route.ts')); // Exclude API routes

if (scheduleDemoInStore.length === 0) {
  pass('Rule 2 — No "Schedule Demo" CTAs in store pages');
} else {
  warn('Rule 2', '"Schedule Demo" CTAs found in store pages (should use trial/checkout CTAs):', scheduleDemoInStore);
}

// --- Rule 3: No "Request Access" as CTA in sales funnel ---
const requestAccessInFunnel = grep('Request Access', salesFunnelPaths, ['tsx'])
  .filter(line => !line.includes('policy'))
  .filter(line => !line.includes('security'))
  .filter(line => !line.includes('legal'))
  .filter(line => !line.includes('// '));

if (requestAccessInFunnel.length === 0) {
  pass('Rule 3 — No "Request Access" CTAs in sales funnel pages');
} else {
  warn('Rule 3', '"Request Access" CTAs found in sales funnel (should use self-service CTAs):', requestAccessInFunnel);
}

// --- Summary ---
console.log(`\n${'='.repeat(50)}`);
if (warnings > 0) {
  console.warn(`\n${warnings} self-service policy warning(s).`);
  console.warn('These are warnings, not failures. Review and fix phone-gate patterns.');
  // Exit 0 (warnings only) — change to exit 1 to enforce strictly
  process.exit(0);
} else {
  console.log('\nAll self-service policy checks passed.');
}
