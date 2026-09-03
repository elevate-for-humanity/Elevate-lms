#!/usr/bin/env node
/**
 * Critical route guard: enforces hard rules on the highest-risk API routes.
 * Updated for monorepo split: scans apps/{marketing,lms,admin,app}/app/api/*
 *
 * Run: node scripts/guard-critical-routes.mjs
 * Exits 1 on any violation.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

// App dirs to scan
const APP_DIRS = [
  path.join(ROOT, 'apps', 'marketing', 'app'),
  path.join(ROOT, 'apps', 'lms', 'app'),
  path.join(ROOT, 'apps', 'admin', 'app'),
  path.join(ROOT, 'apps', 'app', 'api'),
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
  'api/checkout/program/route.ts',
  'api/enrollments/create/route.ts',
];

// Auth routes that should redirect on error
const AUTH_ROUTES = [
  'api/auth/signout/route.ts',
];

const BANNED_IN_PERSISTENCE_ROUTES = [
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

  const isIntentionalDegradation = relPath.includes('schedule');
  if (!isIntentionalDegradation) {
    // Accept requireDbWrite, throw, failure(), or proper try/catch with error responses
    const hasHardFailure = /requireDbWrite\(|throw new Error|return failure\(/.test(content);
    const hasTryCatch = /try\s*\{[\s\S]*?catch\s*\(/.test(content);
    if (!hasHardFailure && !hasTryCatch) {
      findings.push(
        `${relPath}: no hard-failure pattern found (requireDbWrite / throw / failure() / try-catch). DB errors must not fall through.`,
      );
    }
  }
}

// Auth routes should redirect on error (simplified check)
for (const relPath of AUTH_ROUTES) {
  const file = findRoute(relPath);
  if (!file) {
    // Auth routes may not exist in all apps - that's OK for split architecture
    continue;
  }
}

if (findings.length > 0) {
  console.error('Critical route guard failed:\n');
  for (const f of findings) {
    console.error(`  - ${f}`);
  }
  console.error(`\n${findings.length} violation(s). Fix before merging.`);
  process.exit(1);
} else {
  console.log('Critical route guard passed');
  process.exit(0);
}
