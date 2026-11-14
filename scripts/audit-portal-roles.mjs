#!/usr/bin/env node
/**
 * Backward-compatible entry point for portal role auditing.
 *
 * Portal ownership and role destinations are now distributed across the
 * canonical portal map, role route registry, app middleware, and scoped route
 * guards. The former source-regex audit only understood a root
 * `PROTECTED_ROUTES` literal and produced false failures after that obsolete
 * middleware contract was removed. Delegate to the canonical contract audit,
 * which verifies the current sources together.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const audit = spawnSync(
  process.execPath,
  [join(root, 'scripts/audit-portal-contracts.mjs')],
  { cwd: root, stdio: 'inherit' },
);

if (audit.error) {
  console.error(`Unable to run canonical portal contract audit: ${audit.error.message}`);
  process.exit(1);
}

process.exit(audit.status ?? 1);
