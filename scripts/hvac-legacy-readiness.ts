#!/usr/bin/env tsx
/**
 * hvac-legacy-readiness
 *
 * Single canonical gate for HVAC legacy retirement readiness.
 * Aggregates all checks and returns one pass/fail answer.
 *
 * Run: pnpm verify:hvac-legacy-readiness
 *
 * Steps:
 *   1. repo-state enforcement  (no DB required — runs on every PR)
 *   2. reference audit         (no DB required — runs on every PR)
 *   3. db retirement verifier  (requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *
 * If SUPABASE_SERVICE_ROLE_KEY is absent, step 3 is skipped with a warning.
 * All three must pass before the retirement PR may be opened.
 */

import { execSync } from 'node:child_process';
import process from 'node:process';

const steps: Array<{ name: string; cmd: string; requiresDb: boolean }> = [
  {
    name: 'repo-state enforcement',
    cmd: 'node_modules/.bin/tsx scripts/enforce-hvac-legacy-removal-state.ts',
    requiresDb: false,
  },
  {
    name: 'reference audit',
    cmd: 'node_modules/.bin/tsx scripts/audit-hvac-legacy-references.ts',
    requiresDb: false,
  },
  {
    name: 'db retirement verifier',
    cmd: 'node_modules/.bin/tsx scripts/verify-hvac-legacy-retirement.ts',
    requiresDb: true,
  },
];

const hasDb =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

function run(name: string, cmd: string): void {
  process.stdout.write(`\n==> ${name}\n`);
  execSync(cmd, { stdio: 'inherit', shell: true });
}

let skipped = 0;

try {
  for (const step of steps) {
    if (step.requiresDb && !hasDb) {
      console.warn(
        `\n[hvac-legacy-readiness] SKIP: ${step.name} — ` +
          'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.\n' +
          'Set both env vars and re-run to complete full readiness check.'
      );
      skipped++;
      continue;
    }
    run(step.name, step.cmd);
  }
} catch {
  console.error('\n[hvac-legacy-readiness] FAIL\n');
  process.exit(1);
}

if (skipped > 0) {
  console.warn(
    `\n[hvac-legacy-readiness] INCOMPLETE — ${skipped} step(s) skipped (no DB credentials).\n` +
      'Repo-state and reference checks passed. DB prerequisites not verified.\n' +
      'Do not open the retirement PR until all three steps pass.'
  );
  process.exit(0);
}

console.log('\n[hvac-legacy-readiness] PASS — all prerequisites satisfied.\n');
