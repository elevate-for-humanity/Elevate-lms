#!/usr/bin/env node
/**
 * CI guardrail: enforce single-source GA4 analytics wiring.
 * Fails with exit code 1 for duplicate injectors, hardcoded IDs,
 * noncanonical config calls, or audit-command execution errors.
 */

import { spawnSync } from 'child_process';

const CANONICAL_LOADER = 'components/analytics/google-analytics.tsx';
let failures = 0;

function grep(pattern, extensions, excludeDirs = []) {
  const args = ['-rn', pattern];
  for (const e of extensions) args.push(`--include=*.${e}`);
  for (const d of excludeDirs) args.push(`--exclude-dir=${d}`);
  args.push('.');

  const result = spawnSync('grep', args, {
    encoding: 'utf-8',
    cwd: process.cwd(),
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`grep failed to execute: ${result.error.message}`);
  }
  // grep: 0 = matches, 1 = no matches, >1 = execution/read error.
  if (result.status === 1) return [];
  if (result.status !== 0) {
    throw new Error(`grep failed with exit ${result.status}: ${(result.stderr || '').trim()}`);
  }
  return (result.stdout || '').trim().split('\n').filter(Boolean);
}

function fail(rule, message, matches = []) {
  failures++;
  console.error(`\n❌ FAIL: ${rule}`);
  console.error(`   ${message}`);
  for (const m of matches) console.error(`   ${m}`);
}

function pass(rule) {
  console.log(`✅ PASS: ${rule}`);
}

try {
  const injectors = grep(
    'googletagmanager\\.com/gtag',
    ['tsx', 'ts', 'jsx'],
    ['node_modules', '.next', '.git'],
  ).filter((line) => !line.includes('public/'));

  if (injectors.length === 0) {
    fail('Rule 1', 'No gtag.js injector found. The canonical loader may have been deleted.');
  } else if (injectors.length === 1 && injectors[0].includes(CANONICAL_LOADER)) {
    pass('Rule 1 — Single gtag.js injector (canonical loader)');
  } else {
    const nonCanonical = injectors.filter((l) => !l.includes(CANONICAL_LOADER));
    if (nonCanonical.length > 0) {
      fail('Rule 1', 'Found gtag.js injection outside canonical loader:', nonCanonical);
    } else {
      pass('Rule 1 — Single gtag.js injector (canonical loader)');
    }
  }

  const hardcodedIds = grep(
    'G-[A-Z0-9]\\{8,\\}',
    ['tsx', 'ts', 'jsx'],
    ['node_modules', '.next', '.git'],
  )
    .filter((line) => !line.includes('G-XXXXXXXXXX'))
    .filter((line) => !line.includes('.env.example'))
    .filter((line) => !line.includes('partnerCode'))
    .filter((line) => !line.includes('public/'));

  if (hardcodedIds.length === 0) pass('Rule 2 — No hardcoded GA4 measurement IDs in source');
  else fail('Rule 2', 'Hardcoded GA4 measurement IDs found:', hardcodedIds);

  const configCalls = grep(
    'gtag(\'config\'\\|gtag("config"',
    ['tsx', 'ts'],
    ['node_modules', '.next', '.git'],
  )
    .filter((line) => !line.includes(CANONICAL_LOADER))
    .filter((line) => !line.includes('public/'));

  if (configCalls.length === 0) pass('Rule 3 — No gtag("config") calls outside canonical loader');
  else fail('Rule 3', 'gtag("config") calls found outside canonical loader:', configCalls);
} catch (error) {
  fail('Audit execution', error instanceof Error ? error.message : String(error));
}

console.log(`\n${'='.repeat(50)}`);
if (failures > 0) {
  console.error(`\n${failures} analytics integrity check(s) FAILED.`);
  console.error(`Canonical loader: ${CANONICAL_LOADER}`);
  process.exit(1);
}

console.log('\nAll analytics integrity checks passed.');
console.log(`Canonical loader: ${CANONICAL_LOADER}`);
