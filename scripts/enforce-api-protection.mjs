#!/usr/bin/env node
// enforce-api-protection.mjs
// Scans every app/api route.ts and fails the build if any route has no
// recognizable auth classification.
//
// PROTECTED: route enforces auth internally via any approved pattern.
// EXEMPT:    route carries an explicit classification comment with a reason.
// FAIL:      route matches neither -> build blocked.
//
// Approved auth patterns (substring match anywhere in file):
//   Canonical:   withApiProtection(
//   Legacy:      apiRequireAdmin, apiAuthGuard, apiRequireInstructor,
//                requireApiRole, requireApiAuth, requireAuth, requireAdmin(),
//                getAuthUser(), withAuth(
//   Inline:      supabase.auth.getUser, supabase.auth.getSession,
//                auth.getUser, auth.getSession
//   Tenant:      getTenantContext, getCurrentUser()
//   Partner:     getMyPartnerContext
//   System:      CRON_SECRET, JOB_PROCESSOR_TOKEN
//   Alt auth:    verifyDownloadToken, validateCheckoutAuthorization,
//                download_token, licenseKey, license_key, hashLicenseKey
//
// Exemption classification comments (must include reason after colon):
//   // PUBLIC ROUTE: <reason>
//   // WEBHOOK: <reason>
//   // CRON ROUTE: <reason>
//   // INTERNAL: <reason>
//   // AUTH: <level>
//   // DEPRECATED: <reason>
//   LEGACY_ROUTE_EXEMPT: <reason> -- migrating in PR #NNN

import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const API_DIR = join(ROOT, 'app/api');

const PROTECTED_PATTERNS = [
  // Canonical wrapper
  'withApiProtection(',
  // Approved legacy guards
  'apiRequireAdmin', 'apiAuthGuard', 'apiRequireInstructor',
  'requireApiRole', 'requireApiAuth', 'requireAuth',
  'requireAdmin()', 'getAuthUser()', 'withAuth(',
  // Inline Supabase session/user checks
  'supabase.auth.getUser', 'supabase.auth.getSession',
  'auth.getUser', 'auth.getSession',
  // Tenant-scoped admin checks
  'getTenantContext', 'getCurrentUser()',
  // Partner-scoped auth
  'getMyPartnerContext',
  // System/cron token validation
  'CRON_SECRET', 'JOB_PROCESSOR_TOKEN',
  // Alternative auth models (token/key-based, not session-based)
  'builderGuard', 'verifyDownloadToken', 'validateCheckoutAuthorization',
  'download_token', 'licenseKey', 'license_key', 'hashLicenseKey',
];

const EXEMPT_PATTERNS = [
  '// PUBLIC ROUTE',
  '// WEBHOOK',
  '// CRON ROUTE',
  '// INTERNAL',
  '// AUTH:',
  '// DEPRECATED',
  'LEGACY_ROUTE_EXEMPT',
];

const HIGH_RISK_KEYWORDS = [
  'wioa', 'iep', 'pii', 'ssn',
  'payment', 'checkout', 'stripe',
  'export', 'provision', 'certificate', 'audit',
];

const LEGACY_GUARD_PATTERNS = [
  'apiRequireAdmin', 'apiAuthGuard', 'apiRequireInstructor',
  'requireApiRole', 'requireApiAuth', 'requireAuth',
  'requireAdmin()', 'getAuthUser()', 'withAuth(',
];
const INLINE_SESSION_PATTERNS = [
  'supabase.auth.getUser', 'supabase.auth.getSession',
  'auth.getUser', 'auth.getSession',
];
const ALT_AUTH_PATTERNS = [
  'builderGuard', 'verifyDownloadToken', 'validateCheckoutAuthorization',
  'download_token', 'licenseKey', 'license_key', 'hashLicenseKey',
];

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (entry.name === 'route.ts') results.push(full);
  }
  return results;
}

const routes = walk(API_DIR);
const protected_routes = [];
const exempt_routes = [];
const failures = [];
const high_risk = [];

const guard_counts = {
  withApiProtection: 0,
  legacy_guard: 0,
  inline_session: 0,
  tenant_context: 0,
  partner_context: 0,
  system_token: 0,
  alt_auth: 0,
};

for (const route of routes) {
  const content = readFileSync(route, 'utf8');
  const rel = relative(ROOT, route);

  const isProtected = PROTECTED_PATTERNS.some((p) => content.includes(p));
  const isExempt = !isProtected && EXEMPT_PATTERNS.some((p) => content.includes(p));

  if (isProtected) {
    protected_routes.push(rel);
    if (content.includes('withApiProtection(')) guard_counts.withApiProtection++;
    else if (LEGACY_GUARD_PATTERNS.some((p) => content.includes(p))) guard_counts.legacy_guard++;
    else if (content.includes('getTenantContext')) guard_counts.tenant_context++;
    else if (content.includes('getMyPartnerContext')) guard_counts.partner_context++;
    else if (content.includes('CRON_SECRET') || content.includes('JOB_PROCESSOR_TOKEN')) guard_counts.system_token++;
    else if (ALT_AUTH_PATTERNS.some((p) => content.includes(p))) guard_counts.alt_auth++;
    else if (INLINE_SESSION_PATTERNS.some((p) => content.includes(p))) guard_counts.inline_session++;
  } else if (isExempt) {
    exempt_routes.push(rel);
  } else {
    failures.push(rel);
  }

  const relLower = rel.toLowerCase();
  const contentLower = content.toLowerCase();
  if (HIGH_RISK_KEYWORDS.some((k) => relLower.includes(k) || contentLower.includes(k))) {
    if (isProtected || isExempt) {
      high_risk.push({ rel, protected: isProtected, exempt: isExempt });
    }
  }
}

console.log('\n+------------------------------------------------------+');
console.log('|         API Protection Enforcement Report            |');
console.log('+------------------------------------------------------+\n');
console.log('Total routes scanned:        ' + routes.length);
console.log('Protected:                   ' + protected_routes.length);
console.log('  withApiProtection:         ' + guard_counts.withApiProtection);
console.log('  Legacy guard:              ' + guard_counts.legacy_guard);
console.log('  Inline session check:      ' + guard_counts.inline_session);
console.log('  Tenant context check:      ' + guard_counts.tenant_context);
console.log('  Partner context:           ' + guard_counts.partner_context);
console.log('  System/cron token:         ' + guard_counts.system_token);
console.log('  Alt auth (token/key):      ' + guard_counts.alt_auth);
console.log('Classified exempt:           ' + exempt_routes.length);
console.log('  (public / webhook / cron / internal / deprecated)');
console.log('UNPROTECTED:                 ' + failures.length);

if (failures.length > 0) {
  console.log('\n[FAIL] UNPROTECTED routes -- no auth pattern or classification comment:\n');
  failures.forEach((f) => console.log('  ' + f));
  console.log('\n  Fix: add withApiProtection(), a recognized auth guard, or one of:');
  console.log('    // PUBLIC ROUTE: <reason>');
  console.log('    // WEBHOOK: <reason>');
  console.log('    // CRON ROUTE: <reason>');
  console.log('    // INTERNAL: <reason>');
  console.log('    // DEPRECATED: <reason>');
  console.log('    LEGACY_ROUTE_EXEMPT: <reason> -- migrating in PR #NNN\n');
  console.log('[enforce-api-protection] FAIL -- build blocked.\n');
  process.exit(1);
}

if (exempt_routes.length > 0) {
  console.log('\n[WARN] Exempt routes (verify intent -- each must have a reason comment):');
  exempt_routes.forEach((f) => console.log('  ' + f));
}

if (high_risk.length > 0) {
  console.log('\n[WARN] High-risk surfaces (PII/payment/admin/export) -- ' + high_risk.length + ' routes:');
  high_risk.slice(0, 30).forEach(({ rel, protected: p, exempt: e }) => {
    const tag = p ? 'OK protected' : e ? 'WARN exempt' : 'FAIL UNPROTECTED';
    console.log('  [' + tag + '] ' + rel);
  });
  if (high_risk.length > 30) console.log('  ... and ' + (high_risk.length - 30) + ' more');
}

console.log('\n[OK] All routes protected or explicitly classified.\n');
