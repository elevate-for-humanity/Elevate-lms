#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

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

function protectProductionWorkflow(file) {
  requireText(file, 'environment: production', 'Production workflow must use the protected production environment.');
  requireText(file, 'pnpm install --frozen-lockfile', 'Production workflow must use the frozen lockfile.');
  requireText(file, 'git merge-base --is-ancestor', 'Production workflow must prove the deployed SHA belongs to main.');
  forbidText(file, 'pnpm install --no-frozen-lockfile', 'Production workflow must not resolve dependencies nondeterministically.');
}

function protectDeterministicGate(file) {
  requireText(file, 'pnpm install --frozen-lockfile', 'Gate must use the frozen lockfile.');
  forbidText(file, 'pnpm install --no-frozen-lockfile', 'Gate must not resolve dependencies nondeterministically.');
}

function scanForHardcodedPrivilegedJwts() {
  const roots = ['app', 'apps', 'components', 'lib', 'packages', 'hooks', 'scripts'];
  const skipDirs = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.turbo', 'coverage']);
  const skipExt = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.mp3', '.pdf', '.ico', '.svg', '.zip']);
  // Detect legacy Supabase/Northflank JWT literals. Publishable/anon values should
  // also be environment-sourced in production scripts, but privileged service-role
  // and platform tokens are the critical regression this guard must stop.
  const jwt = /(?:nf-)?eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g;
  const hits = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && skipDirs.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (!skipExt.has(path.extname(entry.name).toLowerCase())) {
        try {
          const text = fs.readFileSync(full, 'utf8');
          if (jwt.test(text)) hits.push(full);
          jwt.lastIndex = 0;
        } catch {}
      }
    }
  };
  for (const root of roots) walk(root);
  if (hits.length) failures.push(`Hardcoded JWT credential(s) remain in: ${hits.slice(0, 10).join(', ')}`);
}

requireText('.github/workflows/autopilot.yml', 'pnpm install --frozen-lockfile', 'Autopilot must use the frozen lockfile.');
requireText('.github/workflows/autopilot.yml', 'AUTOPILOT_STRICT_TYPECHECK', 'Recovery Autopilot strict typecheck protection is missing.');

forbidText('.github/workflows/repair-integrity-gate.yml', 'git push', 'Autonomous repair workflow must not push competing repair branches.');
forbidText('.github/workflows/repair-integrity-gate.yml', 'git checkout -B fix/', 'Autonomous repair workflow must not create competing fix branches.');

forbidText('.github/workflows/branch-protection.yml', 'git push origin --delete', 'Automated branch deletion must remain disabled during supervised recovery.');
requireText('.github/workflows/branch-protection.yml', 'release/production-recovery-', 'Canonical recovery branches must be protected from cleanup.');

for (const file of [
  '.github/workflows/ci-cd.yml',
  '.github/workflows/ci.yml',
  '.github/workflows/build.yml',
  '.github/workflows/compliance-gate.yml',
  '.github/workflows/lint.yml',
  '.github/workflows/survival-guard.yml',
  '.github/workflows/predeploy-check.yml',
  '.github/workflows/design-policy-enforcement.yml',
  '.github/workflows/lockfile-check.yml',
  '.github/workflows/health-check.yml',
  '.github/workflows/supabase-auto-migrate-seed.yml',
]) protectDeterministicGate(file);

forbidText('.github/workflows/ci-cd.yml', 'package-lock.json', 'CI/CD cache must not use package-lock.json in this pnpm repository.');
forbidText('.github/workflows/ci-cd.yml', 'Auto-rollback on health failure', 'CI/CD must not automatically rewrite main on health-check failure.');
forbidText('.github/workflows/ci-cd.yml', 'git push origin --delete', 'CI/CD must not autonomously delete branches.');

requireText('.github/workflows/predeploy-check.yml', 'run: node scripts/run-platform-doctor-strict.mjs', 'Pre-deploy must use strict Platform Doctor enforcement.');
forbidText('.github/workflows/predeploy-check.yml', 'run: pnpm platform:doctor:strict\n        continue-on-error: true', 'Main strict Platform Doctor must not be warning-only.');

requireText('.github/workflows/design-policy-enforcement.yml', 'Block newly introduced STRICT design regressions', 'Design policy must compare current design findings against the base.');
requireText('.github/workflows/design-policy-enforcement.yml', 'design-enforcer-base.json', 'Design policy base evidence must be generated.');
requireText('.github/workflows/design-policy-enforcement.yml', 'Block newly introduced STRICT image regressions', 'Image policy must compare current image findings against the base.');
requireText('.github/workflows/design-policy-enforcement.yml', 'image-contract-base.json', 'Image policy base evidence must be generated.');
forbidText('.github/workflows/design-policy-enforcement.yml', 'Image contract strict audit\n        run: node scripts/image-contract.mjs --strict', 'Historical image STRICT findings must not block without a base comparison.');
forbidText('.github/workflows/design-policy-enforcement.yml', 'WARNING: Heavy overlays detected (non-blocking)', 'Design policy must not regress to warning-only legacy checks.');

requireText('.github/workflows/recovery-hardening-gate.yml', 'Stripe implementation integrity\n        if: ${{ always() }}', 'Stripe hardening must run even after an earlier domain fails.');
requireText('.github/workflows/recovery-hardening-gate.yml', 'Platform Doctor strict enforcement\n        if: ${{ always() }}', 'Platform Doctor hardening must run even after an earlier domain fails.');
requireText('.github/workflows/recovery-hardening-gate.yml', 'group: recovery-hardening-${{ github.sha }}', 'Hardening validation must be keyed to exact SHA so later commits cannot cancel it.');

requireText('.github/workflows/compliance-gate.yml', 'pnpm audit --audit-level high', 'High-severity dependency vulnerabilities must remain blocking.');
forbidText('.github/workflows/compliance-gate.yml', 'Security vulnerabilities found - review SECURITY_NOTES.md', 'Compliance security audit must not convert high vulnerabilities to success.');

requireText('.github/workflows/consolidation-docker-northflank.yml', "'release/production-recovery-*'", 'Docker/Northflank gate must follow the canonical recovery branch.');
requireText('.github/workflows/consolidation-gate.yml', 'push:', 'Consolidation gate must run for mainline pushes.');
requireText('.github/workflows/consolidation-gate.yml', 'group: consolidation-gate-${{ github.event.pull_request.number || github.ref }}', 'Consolidation gate must serialize by PR or branch ref.');
forbidText('.github/workflows/consolidation-gate.yml', "startsWith(github.head_ref, 'release/production-recovery-')", 'Mainline consolidation validation must not be restricted to temporary recovery branches.');
forbidText('.github/workflows/consolidation-gate.yml', 'consolidation/unified-platform', 'Stale consolidation branch must not remain an approved integration branch.');

requireText('.github/workflows/integrity-gate.yml', 'Platform media duplicate advisory', 'Visual duplicate checking must remain advisory.');
requireText('.github/workflows/integrity-gate.yml', 'LMS course integrity check', 'LMS integrity must remain independently evaluated.');
requireText('.github/workflows/integrity-gate.yml', 'Store product integrity check', 'Store integrity must remain independently evaluated.');
requireText('.github/workflows/integrity-gate.yml', 'Stripe route and webhook integrity check', 'Stripe integrity must remain independently evaluated.');

requireText('.github/workflows/apply-platform-media-dedupe.yml', 'contents: read', 'Media dedupe workflow must remain read-only during recovery.');
forbidText('.github/workflows/apply-platform-media-dedupe.yml', 'git push', 'Media dedupe workflow must not push a competing repair branch.');
forbidText('.github/workflows/apply-platform-media-dedupe.yml', 'fix/platform-media-duplicate-gate', 'Recovery must not revive the obsolete media repair branch.');

requireText('.github/workflows/promote-to-production.yml', 'Direct auto-merge is disabled', 'Production promotion must remain supervised through a PR.');
forbidText('.github/workflows/promote-to-production.yml', 'git push origin main', 'Promotion workflow must not directly push main.');
forbidText('.github/workflows/promote-to-production.yml', 'skipping LMS health check', 'Missing staging health configuration must not be treated as success.');
forbidText('.github/workflows/promote-to-production.yml', 'skipping Admin health check', 'Missing Admin staging health configuration must not be treated as success.');

requireText('.github/workflows/northflank-trigger-dispatch.yml', 'git merge-base --is-ancestor', 'Production dispatcher must prove requested SHA belongs to main.');
requireText('.github/workflows/northflank-trigger-dispatch.yml', 'RESOLVED_SHA', 'Production dispatcher must resolve the exact requested commit.');

for (const file of [
  '.github/workflows/deploy-marketing.yml',
  '.github/workflows/deploy-admin.yml',
  '.github/workflows/deploy-lms.yml',
  '.github/workflows/recover-marketing.yml',
  '.github/workflows/elevate-production-deploy.yml',
]) protectProductionWorkflow(file);

requireText('.github/workflows/elevate-production-deploy.yml', "inputs.environment }}' == 'production'", 'Canonical production deploy must explicitly enforce production SHA provenance.');
requireText('.github/workflows/elevate-production-deploy.yml', 'Recovery hardening regression check', 'Canonical deployment must run recovery hardening before publish/deploy.');

requireText('.github/workflows/health-check.yml', 'Require Northflank health credentials', 'Health checks must fail when required credentials are unavailable.');
forbidText('.github/workflows/health-check.yml', 'Skipping health check for now', 'Missing health credentials must not produce a green check.');

forbidText('.github/workflows/supabase-auto-migrate-seed.yml', 'node scripts/db/runMigrations.js', 'Supabase workflow must not automatically apply production migrations.');
forbidText('.github/workflows/supabase-auto-migrate-seed.yml', 'pnpm db:seed', 'Supabase workflow must not automatically seed production data.');
requireText('.github/workflows/supabase-auto-migrate-seed.yml', 'This workflow does NOT apply migrations or seed production data.', 'Supabase workflow must remain audit-only during recovery.');

forbidText('.github/workflows/fix-northflank-services.yml', '--all --execute', 'Legacy all-service mutator must remain disabled.');
forbidText('.github/workflows/fix-northflank-services.yml', 'restart-service.ts', 'Legacy workflow must not restart all production services.');
requireText('.github/workflows/fix-northflank-services.yml', 'does not mutate or restart production services', 'Northflank legacy fixer must remain audit-only.');

requireText('scripts/check-stripe-integrity.mjs', 'process.exit(1)', 'Stripe violations must remain blocking.');
forbidText('scripts/check-stripe-integrity.mjs', 'Warn only for now', 'Stripe gate must not regress to warning-only behavior.');

requireText('scripts/audit-auth-gaps.sh', '--strict', 'Auth audit strict mode must remain available.');
requireText('scripts/audit-auth-gaps.sh', 'is_production_file', 'Auth strict mode must distinguish deployed roots from detached legacy roots.');
requireText('scripts/production-readiness-gate.sh', 'audit-auth-gaps.sh --strict', 'Production readiness must enforce strict auth auditing.');
requireText('scripts/production-readiness-gate.sh', 'Stripe Secret Key is required for production readiness', 'Missing Stripe production configuration must remain blocking.');
requireText('scripts/production-readiness-gate.sh', 'Stripe Webhook Secret is required for production readiness', 'Missing Stripe webhook configuration must remain blocking.');

requireText('scripts/check-analytics-integrity.mjs', 'result.status === 1', 'Analytics audit must distinguish no-match from execution failure.');
requireText('scripts/audit-migration-discipline.mjs', 'scripts/lint-migrations.cjs', 'Migration discipline command must remain wired to blocking migration lint.');

requireText('scripts/platform-doctor.mjs', 'const strictBlocks = STRICT_MODE || ENFORCE_STRICT', 'Platform Doctor --strict must directly enforce STRICT findings.');
requireText('scripts/platform-doctor.mjs', "addCheck(name, 'fail', summary)", 'Platform Doctor timeouts must fail rather than pass.');
requireText('scripts/platform-doctor.mjs', 'pnpm typecheck:all', 'Strict Platform Doctor must run the full production typecheck.');

requireText('scripts/run-platform-doctor-strict.mjs', "PLATFORM_DOCTOR_ENFORCE_STRICT: 'true'", 'Platform Doctor strict enforcement wrapper is missing.');
requireText('scripts/run-platform-doctor-strict.mjs', "summary.includes('timed out')", 'Platform Doctor timeout regression detection is missing.');

requireText('scripts/integrity/links.mjs', "Expected 3 deployed app trees", 'Link integrity must remain scoped to the three deployed apps.');
requireText('scripts/integrity/links.mjs', "type: isApi ? 'api' : 'page'", 'Link integrity must discover API routes rather than misclassifying them as broken links.');
forbidText('scripts/integrity/links.mjs', "path.join(rootDir,'app-legacy')", 'Legacy app tree must not be treated as a production link source.');

scanForHardcodedPrivilegedJwts();

if (failures.length > 0) {
  console.error('Recovery gate hardening regression detected:\n');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('Recovery gate hardening verified.');
