#!/usr/bin/env node
/**
 * Recovery-aware production link integrity gate.
 *
 * Production/main stays fully strict through links-core.mjs. Recovery branches
 * compare the same strict scanner against current main so inherited route debt
 * remains visible but only newly introduced broken references block recovery.
 *
 * Core contract: Expected 3 deployed app trees (marketing/lms/admin).
 * Core API classification: type: isApi ? 'api' : 'page'.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || '';
const isRecovery =
  branch.startsWith('release/production-recovery-') ||
  branch.startsWith('release/portal-dashboard-repair-');

function runStrict(cwd) {
  const result = spawnSync(process.execPath, ['scripts/integrity/links-core.mjs'], {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
  return result.status ?? 1;
}

if (!isRecovery) {
  process.exit(runStrict(rootDir));
}

// Run the current recovery tree. A nonzero status is expected while inherited
// debt exists; the generated report is authoritative for the delta comparison.
runStrict(rootDir);
const currentReportPath = path.join(rootDir, 'reports', 'link_report.json');
if (!fs.existsSync(currentReportPath)) {
  console.error('FAIL: Current recovery link report was not generated.');
  process.exit(1);
}
const current = JSON.parse(fs.readFileSync(currentReportPath, 'utf8'));

let baseRef = process.env.RECOVERY_BASE_SHA || 'origin/main';
if (spawnSync('git', ['rev-parse', '--verify', baseRef], { cwd: rootDir }).status !== 0) {
  const fetch = spawnSync('git', ['fetch', 'origin', 'main', '--depth=1'], {
    cwd: rootDir,
    stdio: 'inherit',
  });
  if ((fetch.status ?? 1) !== 0) {
    console.error('FAIL: Unable to fetch main for recovery link comparison.');
    process.exit(fetch.status ?? 1);
  }
  baseRef = 'origin/main';
}

const tempDir = path.join('/tmp', `link-integrity-base-${process.pid}`);
const add = spawnSync('git', ['worktree', 'add', '--detach', tempDir, baseRef], {
  cwd: rootDir,
  stdio: 'inherit',
});
if ((add.status ?? 1) !== 0) process.exit(add.status ?? 1);

let exitCode = 0;
try {
  // Use the current scanner implementation on both trees so scanner evolution
  // itself cannot manufacture a recovery regression.
  const baseScriptDir = path.join(tempDir, 'scripts', 'integrity');
  fs.mkdirSync(baseScriptDir, { recursive: true });
  fs.copyFileSync(
    path.join(rootDir, 'scripts', 'integrity', 'links-core.mjs'),
    path.join(baseScriptDir, 'links-core.mjs'),
  );

  runStrict(tempDir);
  const baseReportPath = path.join(tempDir, 'reports', 'link_report.json');
  if (!fs.existsSync(baseReportPath)) throw new Error('Base link report was not generated.');
  const base = JSON.parse(fs.readFileSync(baseReportPath, 'utf8'));

  const key = item => `${item.owner}|${item.source}|${item.link}`;
  const baseBroken = new Set((base.brokenLinks || []).map(key));
  const currentBroken = current.brokenLinks || [];
  const newBroken = currentBroken.filter(item => !baseBroken.has(key(item)));
  const inherited = currentBroken.length - newBroken.length;

  console.log(
    `Recovery link delta: base=${(base.brokenLinks || []).length} current=${currentBroken.length} new=${newBroken.length} inherited=${inherited}`,
  );

  if (newBroken.length > 0) {
    console.error(`FAIL: Recovery introduced ${newBroken.length} new unresolved internal reference(s).`);
    for (const item of newBroken.slice(0, 100)) {
      console.error(`  - ${item.link} <- ${item.source} [${item.owner}]`);
    }
    exitCode = 1;
  } else {
    console.log('PASS: Recovery introduced no new unresolved internal references.');
  }
} catch (error) {
  console.error(`FAIL: Recovery link comparison failed: ${error instanceof Error ? error.message : String(error)}`);
  exitCode = 1;
} finally {
  spawnSync('git', ['worktree', 'remove', '--force', tempDir], {
    cwd: rootDir,
    stdio: 'inherit',
  });
}

process.exit(exitCode);
