#!/usr/bin/env node
import fs from 'node:fs';

const failures = [];

function read(file) {
  if (!fs.existsSync(file)) {
    failures.push(`Missing required hardening file: ${file}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

function requireText(file, text, reason) {
  const content = read(file);
  if (!content.includes(text)) failures.push(`${file}: ${reason}`);
}

function forbidText(file, text, reason) {
  const content = read(file);
  if (content.includes(text)) failures.push(`${file}: ${reason}`);
}

requireText('.github/workflows/autopilot.yml', 'pnpm install --frozen-lockfile', 'Autopilot must use the frozen lockfile.');
requireText('.github/workflows/autopilot.yml', 'AUTOPILOT_STRICT_TYPECHECK', 'Recovery Autopilot strict typecheck protection is missing.');

forbidText('.github/workflows/repair-integrity-gate.yml', 'git push', 'Autonomous repair workflow must not push competing repair branches.');
forbidText('.github/workflows/repair-integrity-gate.yml', 'git checkout -B fix/', 'Autonomous repair workflow must not create competing fix branches.');

forbidText('.github/workflows/branch-protection.yml', 'git push origin --delete', 'Automated branch deletion must remain disabled during supervised recovery.');
requireText('.github/workflows/branch-protection.yml', 'release/production-recovery-', 'Canonical recovery branches must be protected from cleanup.');

requireText('.github/workflows/ci-cd.yml', 'pnpm install --frozen-lockfile', 'CI/CD dependency installation must remain deterministic.');
forbidText('.github/workflows/ci-cd.yml', 'package-lock.json', 'CI/CD cache must not use package-lock.json in this pnpm repository.');
forbidText('.github/workflows/ci-cd.yml', 'Auto-rollback on health failure', 'CI/CD must not automatically rewrite main on health-check failure.');
forbidText('.github/workflows/ci-cd.yml', 'git push origin --delete', 'CI/CD must not autonomously delete branches.');

requireText('.github/workflows/integrity-gate.yml', 'Platform media duplicate advisory', 'Visual duplicate checking must remain advisory.');
requireText('.github/workflows/integrity-gate.yml', 'LMS course integrity check', 'LMS integrity must remain independently evaluated.');
requireText('.github/workflows/integrity-gate.yml', 'Store product integrity check', 'Store integrity must remain independently evaluated.');
requireText('.github/workflows/integrity-gate.yml', 'Stripe route and webhook integrity check', 'Stripe integrity must remain independently evaluated.');

requireText('scripts/check-stripe-integrity.mjs', 'process.exit(1)', 'Stripe violations must remain blocking.');
forbidText('scripts/check-stripe-integrity.mjs', 'Warn only for now', 'Stripe gate must not regress to warning-only behavior.');

requireText('scripts/audit-auth-gaps.sh', '--strict', 'Auth audit strict mode must remain available.');
requireText('scripts/production-readiness-gate.sh', 'audit-auth-gaps.sh --strict', 'Production readiness must enforce strict auth auditing.');

requireText('scripts/run-platform-doctor-strict.mjs', "PLATFORM_DOCTOR_ENFORCE_STRICT: 'true'", 'Platform Doctor strict enforcement wrapper is missing.');
requireText('scripts/run-platform-doctor-strict.mjs', "summary.includes('timed out')", 'Platform Doctor timeout-as-pass rejection is missing.');

if (failures.length > 0) {
  console.error('Recovery gate hardening regression detected:\n');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('Recovery gate hardening verified.');
