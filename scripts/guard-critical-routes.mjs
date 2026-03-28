#!/usr/bin/env node
/**
 * Critical route guard: enforces hard rules on the highest-risk API routes.
 *
 * Run: node scripts/guard-critical-routes.mjs
 * Exits 1 on any violation.
 */
import fs from 'fs';

// Routes that must never contain fake-success patterns
const PERSISTENCE_REQUIRED_ROUTES = [
  'app/api/booking/enrollment/route.ts',
  'app/api/advising-request/route.ts',
  'app/api/enrollment/submit-documents/route.ts',
  'app/api/enroll/cna/route.ts',
  'app/api/tax/book-appointment/route.ts',
  'app/api/booking/schedule/route.ts',
];

// Routes that must redirect (not return JSON) on all error paths
const REDIRECT_REQUIRED_ROUTES = [
  'app/api/auth/signout/route.ts',
  'app/api/stripe/checkout/route.ts',
  'app/api/store/cart-checkout/route.ts',
];

const BANNED_IN_PERSISTENCE_ROUTES = [
  // success:true inside a catch or error-if block — not in the normal success return
  { pattern: /(?:catch\s*[\(\{][^}]{0,600}?|if\s*\([^)]*error[^)]*\)\s*\{[^}]{0,600}?)success\s*:\s*true/gs, label: 'success:true inside catch/error block' },
  { pattern: /don'?t block flow|continue even if database insert fails|still return success/gi, label: 'banned comment' },
  { pattern: /[`'"][A-Z]+-\$\{Date\.now\(\)\}[`'"]/g, label: 'timestamp fake ID' },
];

const findings = [];

for (const file of PERSISTENCE_REQUIRED_ROUTES) {
  if (!fs.existsSync(file)) {
    findings.push(`MISSING: ${file} — required critical route does not exist`);
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');

  for (const { pattern, label } of BANNED_IN_PERSISTENCE_ROUTES) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      findings.push(`${file}: contains banned pattern [${label}]`);
    }
  }

  // Must use requireDbWrite, throw, or explicit failure() — no silent fallthrough.
  // booking/schedule is exempt: it intentionally degrades (DB non-fatal, email primary)
  // and returns dbSaved:false so the client can show a soft confirmation.
  const isIntentionalDegradation = file.includes('booking/schedule');
  if (!isIntentionalDegradation) {
    const hasHardFailure = /requireDbWrite\(|throw new Error|return failure\(/.test(content);
    if (!hasHardFailure) {
      findings.push(`${file}: no hard-failure pattern found (requireDbWrite / throw / failure()). DB errors must not fall through.`);
    }
  }
}

for (const file of REDIRECT_REQUIRED_ROUTES) {
  if (!fs.existsSync(file)) {
    findings.push(`MISSING: ${file} — required critical route does not exist`);
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');

  if (!/NextResponse\.redirect\(/.test(content)) {
    findings.push(`${file}: must use NextResponse.redirect() on error paths — raw JSON responses strand users on native form POST flows`);
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
