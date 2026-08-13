#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const reportPath = path.join(root, 'artifacts', 'platform-doctor-report.json');

const result = spawnSync('node', ['scripts/platform-doctor.mjs', '--strict'], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    PLATFORM_DOCTOR_ENFORCE_STRICT: 'true',
  },
});

let wrapperFailure = false;

if (!fs.existsSync(reportPath)) {
  console.error('Platform Doctor did not produce artifacts/platform-doctor-report.json.');
  wrapperFailure = true;
} else {
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const checks = Array.isArray(report.checks) ? report.checks : [];
    const invalidPasses = checks.filter((check) => {
      const summary = String(check?.summary ?? '').toLowerCase();
      return summary.includes('timed out') || summary.includes('treated as pass');
    });

    if (invalidPasses.length > 0) {
      console.error('\nPlatform Doctor produced invalid timeout-as-pass results:');
      for (const check of invalidPasses) {
        console.error(` - ${check.name}: ${check.summary}`);
      }
      wrapperFailure = true;
    }

    if (report?.mode?.strictBlocks !== true) {
      console.error('Platform Doctor strict findings were not configured as blocking.');
      wrapperFailure = true;
    }

    if (report?.status !== 'DEPLOY ALLOWED') {
      wrapperFailure = true;
    }
  } catch (error) {
    console.error('Unable to parse Platform Doctor report:', error instanceof Error ? error.message : String(error));
    wrapperFailure = true;
  }
}

if (result.error) {
  console.error('Platform Doctor failed to execute:', result.error.message);
  wrapperFailure = true;
}

if ((result.status ?? 1) !== 0) {
  wrapperFailure = true;
}

process.exit(wrapperFailure ? 1 : 0);
