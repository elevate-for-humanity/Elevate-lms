#!/usr/bin/env node
/**
 * Single production gate: live DB + deploy SHA + portal auth + store/barber smokes.
 * Usage: pnpm tsx --env-file=.env.local scripts/smoke-live-production.mjs
 */
import { execSync } from 'node:child_process';

const steps = [
  ['Pending migrations (live DB)', 'node scripts/verify-pending-migrations.mjs'],
  ['Portal auth (live HTTP)', 'node scripts/audit-portal-auth-live.mjs'],
  ['Barber apprentice', 'pnpm tsx --env-file=.env.local scripts/smoke-barber-apprentice-flow.mjs'],
  ['Store trial', 'pnpm tsx --env-file=.env.local scripts/smoke-store-trial-flow.mjs'],
  ['Northflank SHA', 'pnpm tsx scripts/northflank/inspect-services.ts'],
];

let failed = 0;
for (const [name, cmd] of steps) {
  console.log(`\n── ${name} ──`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd(), env: process.env });
    console.log(`✅ ${name}`);
  } catch {
    console.error(`❌ ${name}`);
    failed++;
  }
}

process.exit(failed ? 1 : 0);
