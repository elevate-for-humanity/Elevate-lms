#!/usr/bin/env node
/**
 * Production PWA integrity gate.
 * Validates one service-worker registration per app plus the role-specific
 * manifests used by Learner, Apprentice, Host Shop, and Program Holder portals.
 */

import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
let failures = 0;

function pass(message) { console.log(` ✅ ${message}`); }
function fail(message) { console.error(` ❌ ${message}`); failures += 1; }
function warn(message) { console.warn(` ⚠️ ${message}`); }
function readFile(relPath) {
  try { return readFileSync(join(ROOT, relPath), 'utf8'); } catch { return null; }
}
function exists(relPath) {
  try { statSync(join(ROOT, relPath)); return true; } catch { return false; }
}
function readJson(relPath) {
  try { return JSON.parse(readFileSync(join(ROOT, relPath), 'utf8')); } catch { return null; }
}

const APPS = [
  {
    name: 'marketing',
    layoutPath: 'apps/marketing/app/layout.tsx',
    manifestFile: 'public/manifest-marketing.json',
    swFile: 'public/sw-marketing.js',
    registrationComponent: 'MarketingPwaRegistration',
  },
  {
    name: 'admin',
    layoutPath: 'apps/admin/app/layout.tsx',
    manifestFile: 'public/manifest-admin.json',
    swFile: 'public/sw-admin.js',
    registrationComponent: 'AdminPwaRegister',
  },
  {
    name: 'lms',
    layoutPath: 'apps/lms/app/layout.tsx',
    manifestFile: 'public/manifest-lms.json',
    swFile: 'public/sw-lms.js',
    registrationComponent: 'LmsPwaRegistration',
  },
  {
    name: 'app (portal)',
    layoutPath: 'apps/app/layout.tsx',
    manifestFile: 'public/manifest-portal.json',
    swFile: 'public/sw-portal.js',
    registrationComponent: 'PortalPwaRegistration',
  },
];

const PWA_REG_COMPONENTS = [
  'AdminPwaRegister',
  'MarketingPwaRegistration',
  'LmsPwaRegistration',
  'PortalPwaRegistration',
  'ServiceWorkerRegistration',
  'PWAManager',
];

const PERSONA_PORTALS = [
  {
    name: 'Learner',
    layoutPath: 'apps/lms/app/lms/layout.tsx',
    manifestFile: 'public/manifest-student.json',
    manifestHref: '/manifest-student.json',
    startUrl: '/lms/dashboard',
    scope: '/lms',
  },
  {
    name: 'Apprentice',
    layoutPath: 'apps/lms/app/apprentice/layout.tsx',
    manifestFile: 'public/manifest-apprentice.json',
    manifestHref: '/manifest-apprentice.json',
    startUrl: '/apprentice',
    scope: '/apprentice/',
  },
  {
    name: 'Host Shop',
    layoutPath: 'apps/lms/app/host-shop/layout.tsx',
    manifestFile: 'public/manifest-shop-owner.json',
    manifestHref: '/manifest-shop-owner.json',
    startUrl: '/host-shop/dashboard',
    scope: '/host-shop/',
  },
  {
    name: 'Program Holder',
    layoutPath: 'apps/marketing/app/program-holder/layout.tsx',
    manifestFile: 'public/manifest-program-holder.json',
    manifestHref: '/manifest-program-holder.json',
    startUrl: '/program-holder/dashboard',
    scope: '/program-holder/',
  },
];

console.log('\n── Root PWA registrations ──');
for (const app of APPS) {
  const content = readFile(app.layoutPath);
  if (!content) {
    fail(`${app.name}: root layout missing`);
    continue;
  }

  const counts = Object.fromEntries(PWA_REG_COMPONENTS.map((component) => {
    const re = new RegExp(`<${component}[\\s/>]`, 'g');
    return [component, (content.match(re) || []).length];
  }));
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (total !== 1) {
    fail(`${app.name}: expected exactly one PWA registration, found ${total}`);
  } else if (counts[app.registrationComponent] !== 1) {
    fail(`${app.name}: wrong registration component`);
  } else {
    pass(`${app.name}: exactly one ${app.registrationComponent}`);
  }

  const manifest = content.match(/manifest:\s*['"]([^'"]+)['"]/)?.[1];
  const expectedManifest = `/${app.manifestFile.replace('public/', '')}`;
  if (manifest !== expectedManifest) fail(`${app.name}: expected ${expectedManifest}, found ${manifest || 'none'}`);
  else pass(`${app.name}: root manifest linked`);

  if (!exists(app.manifestFile)) fail(`${app.name}: ${app.manifestFile} missing`);
  else pass(`${app.name}: root manifest exists`);

  if (!exists(app.swFile)) fail(`${app.name}: ${app.swFile} missing`);
  else pass(`${app.name}: service worker exists`);
}

console.log('\n── Persona portal manifests ──');
for (const portal of PERSONA_PORTALS) {
  const layout = readFile(portal.layoutPath);
  if (!layout) {
    fail(`${portal.name}: nested layout missing at ${portal.layoutPath}`);
    continue;
  }
  if (!layout.includes(`manifest: '${portal.manifestHref}'`) && !layout.includes(`manifest: "${portal.manifestHref}"`)) {
    fail(`${portal.name}: nested layout does not link ${portal.manifestHref}`);
  } else {
    pass(`${portal.name}: nested layout links role manifest`);
  }

  const manifest = readJson(portal.manifestFile);
  if (!manifest) {
    fail(`${portal.name}: invalid or missing ${portal.manifestFile}`);
    continue;
  }
  if (manifest.start_url !== portal.startUrl) fail(`${portal.name}: start_url must be ${portal.startUrl}`);
  else pass(`${portal.name}: canonical start_url`);

  if (manifest.scope !== portal.scope) fail(`${portal.name}: scope must be ${portal.scope}`);
  else pass(`${portal.name}: canonical scope`);

  if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) fail(`${portal.name}: install icons incomplete`);
  else pass(`${portal.name}: install icons declared`);

  for (const shortcut of manifest.shortcuts || []) {
    if (typeof shortcut.url !== 'string' || !shortcut.url.startsWith(portal.scope.replace(/\/$/, ''))) {
      fail(`${portal.name}: shortcut ${shortcut.name || '(unnamed)'} escapes portal scope: ${shortcut.url}`);
    }
  }
}

console.log('\n── Service worker responsibility boundaries ──');
for (const sw of ['public/sw-marketing.js', 'public/sw-admin.js', 'public/sw-portal.js']) {
  const content = readFile(sw);
  if (!content) continue;
  if (/COURSE_CACHE|COURSE_STRATEGY|sync-enrollment|sync-hours|openOfflineDB/i.test(content)) {
    fail(`${sw}: non-LMS worker contains LMS offline/course responsibilities`);
  } else {
    pass(`${sw}: domain responsibilities are isolated`);
  }
}

const lmsWorker = readFile('public/sw-lms.js') || '';
for (const protectedPath of ['/lms/dashboard', '/apprentice', '/host-shop']) {
  if (!lmsWorker.includes(protectedPath)) {
    warn(`public/sw-lms.js: protected route marker ${protectedPath} was not found; confirm authenticated navigation stays network-only`);
  }
}

console.log('\n── Legacy PWA files ──');
for (const legacy of [
  'public/manifest-barber.json',
  'public/manifest-instructor.json',
  'public/manifest-partner.json',
  'public/manifest-store.json',
  'public/manifest-enrollment.json',
  'public/store-manifest.json',
  'public/manifest.json',
]) {
  if (exists(legacy)) warn(`${legacy}: legacy/unlinked manifest remains; do not link it to a production portal`);
}

console.log('\n────────────────────────────────────────');
if (failures) {
  console.error(`\n❌ PWA audit FAILED — ${failures} issue(s).\n`);
  process.exit(1);
}
console.log('\n✅ PWA audit PASSED.\n');
