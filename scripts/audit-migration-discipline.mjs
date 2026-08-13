#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const checks = [
  ['migration lint', 'node', ['scripts/lint-migrations.cjs']],
];

let failed = false;
for (const [name, command, args] of checks) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) {
    console.error(`${name} failed to execute: ${result.error.message}`);
    failed = true;
    continue;
  }
  if ((result.status ?? 1) !== 0) failed = true;
}

if (failed) {
  console.error('\nMigration discipline audit failed.');
  process.exit(1);
}

console.log('\nMigration discipline audit passed.');
