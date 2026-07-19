#!/usr/bin/env node
/**
 * Critical route guard: enforces hard rules on the highest-risk API routes.
 * Updated for monorepo split: scans apps/{marketing,lms,admin}/app/api/*
 *
 * Run: node scripts/guard-critical-routes.mjs
 * Exits 1 on any violation.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

// App dirs to scan (includes app-legacy for backward compatibility)
const APP_DIRS = [
  path.join(ROOT, 'app-legacy'),
  path.join(ROOT, 'apps', 'marketing', 'app'),
  path.join(ROOT, 'apps', 'lms', 'app'),
  path.join(ROOT, 'apps', 'admin', 'app'),
];

// Find a route file in any app directory
function findRoute(relativePath) {
  for (const dir of APP_DIRS) {
    const full = path.join(dir, relativePath);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

// Routes that must never contain fake-success patterns
const PERSISTENCE_REQUIRED_ROUTES = [
  'api/booking/enrollment/route.ts',
  'api/advising-request/route.ts',
  'api/enrollment/submit-documents/route.ts',
  'api/enroll/cna/route.ts',
  'api/booking/schedule/route.ts',
];

// Routes that must redirect (not return JSON) on all error paths
const REDIRECT_REQUIRED_ROUTES = [
  'api/auth/signout/route.ts',
  'api/stripe/checkout/route.ts',
  'api/store/cart-checkout/route.ts',
];

const BANNED_IN_PERSISTENCE_ROUTES = [
  // success:true inside a catch or error-if block — not in the normal success return
  {
    pattern:
      /(?:catch\s*[\(\{][^}]{0,600}?|if\s*\([^)]*error[^)]*\)\s*\{[^}]{0,600}?)success\s*:\s*true/gs,
    label: 'success:true inside catch/error block',
  },
  {
    pattern: /don'?t block flow|continue even if database insert fails|still return success/gi,
    label: 'banned comment',
  },
  { pattern: /[`'"][A-Z]+-\$\{Date\.now\(\)\}[`'"]/g, label: 'timestamp fake ID' },
];

const findings = [];

for (const relPath of PERSISTENCE_REQUIRED_ROUTES) {
  const file = findRoute(relPath);
  if (!file) {
    findings.push(`MISSING: ${relPath} — required critical route does not exist in any app`);
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');

  for (const { pattern, label } of BANNED_IN_PERSISTENCE_ROUTES) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      findings.push(`${relPath}: contains banned pattern [${label}]`);
    }
  }

  // Must use requireDbWrite, throw, or explicit failure() — no silent fallthrough.
  // booking/schedule is exempt: it intentionally degrades (DB non-fatal, email primary)
  // and returns dbSaved:false so the client can show a soft confirmation.
  const isIntentionalDegradation = relPath.includes('booking/schedule');
  if (!isIntentionalDegradation) {
    const hasHardFailure = /requireDbWrite\(|throw new Error|return failure\(/.test(content);
    if (!hasHardFailure) {
      findings.push(
        `${relPath}: no hard-failure pattern found (requireDbWrite / throw / failure()). DB errors must not fall through.`,
      );
    }
  }
}

for (const relPath of REDIRECT_REQUIRED_ROUTES) {
  const file = findRoute(relPath);
  if (!file) {
    findings.push(`MISSING: ${relPath} — required critical route does not exist in any app`);
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');

  if (!/NextResponse\.redirect\(/.test(content)) {
    findings.push(
      `${relPath}: must use NextResponse.redirect() on error paths — raw JSON responses strand users on native form POST flows`,
    );
  }
}

if (findings.length) {
  console.error('\n❌ Critical route guard failed:\n');
  for (const f of findings) {
    console.error(`  - ${f}`);
  }
  console.error(`\n${findings.length} violation(s). Fix before merging.\n`);
  process.exit(1);
}

console.log('✅ Critical route guard passed.');
