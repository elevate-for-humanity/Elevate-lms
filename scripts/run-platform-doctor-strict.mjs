#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const reportPath = path.join(root, 'artifacts', 'platform-doctor-report.json');
const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || '';
const isPullRequest = Boolean(process.env.GITHUB_HEAD_REF);
const isRecovery = branch.startsWith('release/production-recovery-');
// CI must prevent regressions without making every mainline deployment depend
// on eliminating the entire inherited repository backlog in one commit. A
// developer invoking this script locally still receives the zero-debt strict
// gate; CI compares critical findings with the commit being replaced.
const useRegressionDelta = process.env.CI === 'true' || isPullRequest || isRecovery;

function validateTimeouts(report) {
  const checks = Array.isArray(report?.checks) ? report.checks : [];
  const invalidPasses = checks.filter((check) => {
    const summary = String(check?.summary ?? '').toLowerCase();
    return summary.includes('timed out') || summary.includes('treated as pass');
  });
  if (invalidPasses.length > 0) {
    console.error('\nPlatform Doctor produced timeout-related failed checks:');
    for (const check of invalidPasses) console.error(` - ${check.name}: ${check.summary}`);
    return false;
  }
  return true;
}

function runStrictProduction() {
  const result = spawnSync('node', ['scripts/platform-doctor.mjs', '--strict'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      PLATFORM_DOCTOR_ENFORCE_STRICT: 'true',
    },
  });

  let failed = false;
  if (!fs.existsSync(reportPath)) {
    console.error('Platform Doctor did not produce artifacts/platform-doctor-report.json.');
    failed = true;
  } else {
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      if (!validateTimeouts(report)) failed = true;
      if (report?.mode?.strictBlocks !== true) {
        console.error('Platform Doctor strict findings were not configured as blocking.');
        failed = true;
      }
      if (report?.status !== 'DEPLOY ALLOWED') failed = true;
    } catch (error) {
      console.error('Unable to parse Platform Doctor report:', error instanceof Error ? error.message : String(error));
      failed = true;
    }
  }
  if (result.error) {
    console.error('Platform Doctor failed to execute:', result.error.message);
    failed = true;
  }
  if ((result.status ?? 1) !== 0) failed = true;
  return failed ? 1 : 0;
}

function runStatic(cwd, outPath) {
  const result = spawnSync('node', ['scripts/platform-doctor-static.mjs', '--out', outPath], {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
  return result.status ?? 1;
}

function runRegressionDelta() {
  // Keep the full current report for operator visibility. Pull-request and
  // recovery acceptance is based on whether this change introduces new
  // CRITICAL findings relative to the target mainline, not on inherited debt.
  const full = spawnSync('node', ['scripts/platform-doctor.mjs'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      PLATFORM_DOCTOR_ENFORCE_STRICT: 'false',
    },
  });
  if (full.error) {
    console.error('Platform Doctor failed to execute:', full.error.message);
    return 1;
  }
  if (!fs.existsSync(reportPath)) {
    console.error('Platform Doctor did not produce artifacts/platform-doctor-report.json.');
    return 1;
  }
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    if (!validateTimeouts(report)) return 1;
  } catch (error) {
    console.error('Unable to parse Platform Doctor report:', error instanceof Error ? error.message : String(error));
    return 1;
  }

  const currentStatic = path.join(root, 'artifacts', 'platform-doctor-regression-static.json');
  if (runStatic(root, currentStatic) !== 0 || !fs.existsSync(currentStatic)) {
    console.error('Current static Platform Doctor scan failed to produce evidence.');
    return 1;
  }

  let baseRef = process.env.PLATFORM_DOCTOR_BASE_SHA || process.env.RECOVERY_BASE_SHA || 'origin/main';
  if (spawnSync('git', ['rev-parse', '--verify', baseRef], { cwd: root }).status !== 0) {
    const fetch = spawnSync('git', ['fetch', 'origin', 'main', '--depth=1'], { cwd: root, stdio: 'inherit' });
    if ((fetch.status ?? 1) !== 0) return fetch.status ?? 1;
    baseRef = 'origin/main';
  }

  const tempDir = path.join('/tmp', `platform-doctor-base-${process.pid}`);
  const add = spawnSync('git', ['worktree', 'add', '--detach', tempDir, baseRef], { cwd: root, stdio: 'inherit' });
  if ((add.status ?? 1) !== 0) return add.status ?? 1;

  let exitCode = 0;
  try {
    const targetScript = path.join(tempDir, 'scripts', 'platform-doctor-static.mjs');
    fs.mkdirSync(path.dirname(targetScript), { recursive: true });
    fs.copyFileSync(path.join(root, 'scripts', 'platform-doctor-static.mjs'), targetScript);
    const baseOut = path.join(tempDir, 'artifacts', 'platform-doctor-base-static.json');
    if (runStatic(tempDir, baseOut) !== 0 || !fs.existsSync(baseOut)) {
      throw new Error('Base static Platform Doctor scan failed to produce evidence.');
    }

    const current = JSON.parse(fs.readFileSync(currentStatic, 'utf8'));
    const base = JSON.parse(fs.readFileSync(baseOut, 'utf8'));
    const stableKey = finding => [
      finding.severity || 'CRITICAL',
      finding.code || '',
      finding.file || '.',
      finding.message || '',
    ].join('|');

    const baseCritical = (base.findings || []).filter(f => f.severity === 'CRITICAL');
    const currentCritical = (current.findings || []).filter(f => f.severity === 'CRITICAL');
    const baseCounts = new Map();
    for (const finding of baseCritical) {
      const key = stableKey(finding);
      baseCounts.set(key, (baseCounts.get(key) || 0) + 1);
    }
    const currentCounts = new Map();
    for (const finding of currentCritical) {
      const key = stableKey(finding);
      currentCounts.set(key, (currentCounts.get(key) || 0) + 1);
    }

    const regressions = [];
    for (const [key, count] of currentCounts) {
      const delta = count - (baseCounts.get(key) || 0);
      if (delta > 0) regressions.push({ key, delta });
    }
    const resolved = [...baseCounts].reduce((total, [key, count]) => total + Math.max(0, count - (currentCounts.get(key) || 0)), 0);
    const newCount = regressions.reduce((total, item) => total + item.delta, 0);

    console.log(`Platform Doctor regression delta: base=${baseCritical.length} current=${currentCritical.length} new=${newCount} resolved=${resolved}`);
    if (regressions.length > 0) {
      console.error('FAIL: Change introduced new Platform Doctor CRITICAL findings:');
      for (const item of regressions.slice(0, 50)) console.error(` - ${item.delta}x ${item.key}`);
      exitCode = 1;
    } else {
      console.log('PASS: Change introduced no new Platform Doctor CRITICAL findings.');
    }
  } catch (error) {
    console.error(`Platform Doctor regression comparison failed: ${error instanceof Error ? error.message : String(error)}`);
    exitCode = 1;
  } finally {
    spawnSync('git', ['worktree', 'remove', '--force', tempDir], { cwd: root, stdio: 'inherit' });
  }
  return exitCode;
}

process.exit(useRegressionDelta ? runRegressionDelta() : runStrictProduction());
