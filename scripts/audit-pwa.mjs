#!/usr/bin/env node
/**
 * audit-pwa.mjs
 *
 * Fails if any of the following conditions are detected:
 *
 * 1. An app root layout has more than one PWA registration component.
 * 2. An app root layout has zero PWA registration components.
 * 3. An app root layout does not link to a domain-specific manifest.
 * 4. A domain-specific manifest referenced in a layout does not exist in public/.
 * 5. A domain-specific service worker does not exist in public/.
 * 6. A service worker has responsibilities it should not have (e.g. marketing SW
 *    handling LMS offline database sync).
 * 7. Multiple service-worker registration components are mounted in the same layout.
 * 8. Dead PWA components that are unused (optional warning).
 *
 * Usage:
 *   node scripts/audit-pwa.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

let failures = 0;

function pass(msg) {
  console.log(` \u2705 ${msg}`);
}

function fail(msg) {
  console.error(` \u274c ${msg}`);
  failures++;
}

function warn(msg) {
  console.warn(` \u26a0\ufe0f ${msg}`);
}

function readFile(relPath) {
  try {
    return readFileSync(join(ROOT, relPath), 'utf-8');
  } catch {
    return null;
  }
}

function exists(relPath) {
  try {
    statSync(join(ROOT, relPath));
    return true;
  } catch {
    return false;
  }
}

// ── Configuration ───────────────────────────────────────────────────────────

const APPS = [
  {
    name: 'marketing',
    layoutPath: 'apps/marketing/app/layout.tsx',
    manifestFile: 'public/manifest-marketing.json',
    swFile: 'public/sw-marketing.js',
    registrationComponent: 'MarketingPwaRegistration',
    allowedComponents: ['MarketingPwaRegistration'],
  },
  {
    name: 'admin',
    layoutPath: 'apps/admin/app/layout.tsx',
    manifestFile: 'public/manifest-admin.json',
    swFile: 'public/sw-admin.js',
    registrationComponent: 'AdminPwaRegister',
    allowedComponents: ['AdminPwaRegister'],
  },
  {
    name: 'lms',
    layoutPath: 'apps/lms/app/layout.tsx',
    manifestFile: 'public/manifest-lms.json',
    swFile: 'public/sw-lms.js',
    registrationComponent: 'LmsPwaRegistration',
    allowedComponents: ['LmsPwaRegistration'],
  },
  {
    name: 'app (portal)',
    layoutPath: 'apps/app/layout.tsx',
    manifestFile: 'public/manifest-portal.json',
    swFile: 'public/sw-portal.js',
    registrationComponent: 'PortalPwaRegistration',
    allowedComponents: ['PortalPwaRegistration'],
  },
];

// All known PWA registration component names
const PWA_REG_COMPONENTS = [
  'AdminPwaRegister',
  'MarketingPwaRegistration',
  'LmsPwaRegistration',
  'PortalPwaRegistration',
  'ServiceWorkerRegistration', // legacy — should not be in any layout
  'PWAManager', // legacy — should not be in any layout
];

// ── Check 1 & 2: PWA registration per app ──────────────────────────────────

console.log('\n\u2500\u2500\u2500 Check 1 & 2: PWA registration in root layouts \u2500\u2500\u2500');

for (const app of APPS) {
  const content = readFile(app.layoutPath);
  if (!content) {
    fail(`${app.name}: layout not found at ${app.layoutPath}`);
    continue;
  }

  // Count occurrences of each known registration component
  const counts = {};
  for (const comp of PWA_REG_COMPONENTS) {
    const re = new RegExp(`<${comp}[\\s/>]`, 'g');
    counts[comp] = (content.match(re) || []).length;
  }

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  if (totalCount === 0) {
    fail(`${app.name}: no PWA registration component in root layout`);
  } else if (totalCount > 1) {
    const found = Object.entries(counts).filter(([, n]) => n > 0).map(([c]) => c);
    fail(`${app.name}: multiple PWA registrations in root layout: ${found.join(', ')}`);
  } else if (counts[app.registrationComponent] === 1) {
    pass(`${app.name}: exactly one ${app.registrationComponent} in root layout`);
  } else {
    const found = Object.entries(counts).filter(([, n]) => n > 0).map(([c]) => c);
    fail(`${app.name}: unexpected PWA registration in root layout: ${found.join(', ')} (expected ${app.registrationComponent})`);
  }
}

// ── Check 3: Manifest linked in metadata ─────────────────────────────────────

console.log('\n\u2500\u2500\u2500 Check 3: Domain-specific manifest in layout metadata \u2500\u2500\u2500');

for (const app of APPS) {
  const content = readFile(app.layoutPath);
  if (!content) continue;

  // Look for manifest: '/manifest-*.json'
  const manifestMatch = content.match(/manifest:\s*['"]([^'"]+)['"]/);
  if (!manifestMatch) {
    fail(`${app.name}: no manifest linked in layout metadata`);
  } else if (manifestMatch[1] !== `/${app.manifestFile.replace('public/', '')}`) {
    warn(`${app.name}: layout links to ${manifestMatch[1]} (expected /${app.manifestFile.replace('public/', '')})`);
  } else {
    pass(`${app.name}: layout links to /${app.manifestFile.replace('public/', '')}`);
  }
}

// ── Check 4: Manifest files exist ─────────────────────────────────────────────

console.log('\n\u2500\u2500\u2500 Check 4: Domain-specific manifest files exist \u2500\u2500\u2500');

for (const app of APPS) {
  if (exists(app.manifestFile)) {
    pass(`${app.name}: ${app.manifestFile} exists`);
  } else {
    fail(`${app.name}: ${app.manifestFile} does not exist`);
  }
}

// ── Check 5: Service worker files exist ──────────────────────────────────────

console.log('\n\u2500\u2500\u2500 Check 5: Domain-specific service workers exist \u2500\u2500\u2500');

for (const app of APPS) {
  if (exists(app.swFile)) {
    pass(`${app.name}: ${app.swFile} exists`);
  } else {
    fail(`${app.name}: ${app.swFile} does not exist`);
  }
}

// ── Check 6: Service worker domain-specific responsibilities ────────────────────

console.log('\n\u2500\u2500\u2500 Check 6: Service worker domain responsibilities \u2500\u2500\u2500');

const SW_RESPONSIBILITY_CHECKS = [
  {
    sw: 'public/sw-marketing.js',
    mustNotContain: [
      { pattern: /COURSE_CACHE|COURSE_STRATEGY|sync-enrollment|sync-hours|openOfflineDB/i, reason: 'Marketing SW should not handle LMS offline DB or course sync' },
    ],
  },
  {
    sw: 'public/sw-admin.js',
    mustNotContain: [
      { pattern: /COURSE_CACHE|COURSE_STRATEGY|sync-enrollment|sync-hours|openOfflineDB/i, reason: 'Admin SW should not handle LMS offline DB or course sync' },
    ],
  },
  {
    sw: 'public/sw-portal.js',
    mustNotContain: [
      { pattern: /COURSE_CACHE|COURSE_STRATEGY|sync-enrollment|sync-hours|openOfflineDB/i, reason: 'Portal SW should not handle LMS offline DB or course sync' },
    ],
  },
];

for (const check of SW_RESPONSIBILITY_CHECKS) {
  const content = readFile(check.sw);
  if (!content) continue; // already flagged in Check 5

  for (const { pattern, reason } of check.mustNotContain) {
    if (pattern.test(content)) {
      fail(`${check.sw}: ${reason}`);
    } else {
      pass(`${check.sw}: domain responsibilities correct`);
    }
  }
}

// ── Check 7: Stale root sw.js should not be used ──────────────────────────────

console.log('\n\u2500\u2500\u2500 Check 7: Root sw.js is not registered in any layout \u2500\u2500\u2500');

const rootSwRegister = /register\s*\(\s*['"]\/sw\.js['"]/;
let foundRootSwUsage = false;
for (const app of APPS) {
  const content = readFile(app.layoutPath);
  if (content && rootSwRegister.test(content)) {
    fail(`${app.name}: root /sw.js is registered (should use /sw-${app.name}.js)`);
    foundRootSwUsage = true;
  }
}
if (!foundRootSwUsage) {
  pass('No layout registers the root /sw.js');
}

// ── Check 8: Unused persona manifests ───────────────────────────────────────

console.log('\n\u2500\u2500\u2500 Check 8: Unused persona manifests (warning only) \u2500\u2500\u2500');

const PERSONA_MANIFESTS = [
  'public/manifest-barber.json',
  'public/manifest-employer.json',
  'public/manifest-student.json',
  'public/manifest-instructor.json',
  'public/manifest-partner.json',
  'public/manifest-program-holder.json',
  'public/manifest-shop-owner.json',
  'public/manifest-store.json',
  'public/manifest-enrollment.json',
  'public/store-manifest.json',
  'public/manifest.json', // root — not used by any layout
];

for (const mf of PERSONA_MANIFESTS) {
  if (exists(mf)) {
    warn(`${mf}: persona manifest exists but is not referenced in any layout — consider removing`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
if (failures > 0) {
  console.error(`\n\u274c Audit FAILED \u2014 ${failures} issue(s) found.\n`);
  process.exit(1);
} else {
  console.log(`\n\u2705 Audit PASSED \u2014 all checks green.\n`);
  process.exit(0);
}
