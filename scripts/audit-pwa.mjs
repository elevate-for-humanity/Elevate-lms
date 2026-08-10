#!/usr/bin/env node
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
let failures = 0;
const pass = (message) => console.log(` ✅ ${message}`);
const fail = (message) => { console.error(` ❌ ${message}`); failures += 1; };
const warn = (message) => console.warn(` ⚠️ ${message}`);
const readFile = (rel) => { try { return readFileSync(join(ROOT, rel), 'utf8'); } catch { return null; } };
const readJson = (rel) => { try { return JSON.parse(readFileSync(join(ROOT, rel), 'utf8')); } catch { return null; } };
const exists = (rel) => { try { statSync(join(ROOT, rel)); return true; } catch { return false; } };

const APPS = [
  ['marketing', 'apps/marketing/app/layout.tsx', 'public/manifest-marketing.json', 'public/sw-marketing.js', 'MarketingPwaRegistration'],
  ['admin', 'apps/admin/app/layout.tsx', 'public/manifest-admin.json', 'public/sw-admin.js', 'AdminPwaRegister'],
  ['lms', 'apps/lms/app/layout.tsx', 'public/manifest-lms.json', 'public/sw-lms.js', 'LmsPwaRegistration'],
  ['app (portal)', 'apps/app/layout.tsx', 'public/manifest-portal.json', 'public/sw-portal.js', 'PortalPwaRegistration'],
];
const PWA_COMPONENTS = ['AdminPwaRegister', 'MarketingPwaRegistration', 'LmsPwaRegistration', 'PortalPwaRegistration', 'ServiceWorkerRegistration', 'PWAManager'];
const PERSONAS = [
  ['Learner', 'apps/lms/app/lms/layout.tsx', 'public/manifest-student.json', '/manifest-student.json', '/lms/dashboard', '/lms', 'lms'],
  ['Apprentice', 'apps/lms/app/apprentice/layout.tsx', 'public/manifest-apprentice.json', '/manifest-apprentice.json', '/apprentice', '/apprentice', 'lms'],
  ['Host Shop', 'apps/lms/app/host-shop/layout.tsx', 'public/manifest-shop-owner.json', '/manifest-shop-owner.json', '/host-shop/dashboard', '/host-shop/', 'lms'],
  ['Program Holder', 'apps/marketing/app/program-holder/layout.tsx', 'public/manifest-program-holder.json', '/manifest-program-holder.json', '/program-holder/dashboard', '/program-holder/', 'marketing'],
];

console.log('\n── Root PWA registrations ──');
for (const [name, layoutPath, manifestFile, swFile, expectedComponent] of APPS) {
  const source = readFile(layoutPath);
  if (!source) { fail(`${name}: root layout missing`); continue; }
  const total = PWA_COMPONENTS.reduce((count, component) => count + (source.match(new RegExp(`<${component}[\\s/>]`, 'g')) || []).length, 0);
  if (total !== 1) fail(`${name}: expected exactly one PWA registration, found ${total}`);
  else if (!(source.match(new RegExp(`<${expectedComponent}[\\s/>]`, 'g')) || []).length) fail(`${name}: wrong PWA registration component`);
  else pass(`${name}: exactly one ${expectedComponent}`);

  const linked = source.match(/manifest:\s*['"]([^'"]+)['"]/)?.[1];
  const expectedHref = `/${manifestFile.replace('public/', '')}`;
  if (linked !== expectedHref) fail(`${name}: expected ${expectedHref}, found ${linked || 'none'}`);
  else pass(`${name}: root manifest linked`);
  if (!exists(manifestFile)) fail(`${name}: ${manifestFile} missing`); else pass(`${name}: root manifest exists`);
  if (!exists(swFile)) fail(`${name}: ${swFile} missing`); else pass(`${name}: service worker exists`);
}

console.log('\n── Persona portal manifests ──');
const syncSource = readFile('scripts/sync-pwa-public.mjs') || '';
for (const [name, layoutPath, manifestFile, manifestHref, startUrl, scope, shippedBy] of PERSONAS) {
  const layout = readFile(layoutPath);
  if (!layout) { fail(`${name}: nested portal layout missing`); continue; }
  if (!layout.includes(`manifest: '${manifestHref}'`) && !layout.includes(`manifest: "${manifestHref}"`)) fail(`${name}: nested layout does not link ${manifestHref}`);
  else pass(`${name}: nested layout links role manifest`);

  const manifest = readJson(manifestFile);
  if (!manifest) { fail(`${name}: invalid or missing ${manifestFile}`); continue; }
  if (manifest.start_url !== startUrl) fail(`${name}: start_url must be ${startUrl}`); else pass(`${name}: canonical start_url`);
  if (manifest.scope !== scope) fail(`${name}: scope must be ${scope}`); else pass(`${name}: canonical scope`);
  if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) fail(`${name}: install icons incomplete`); else pass(`${name}: install icons declared`);

  const scopePrefix = scope.replace(/\/$/, '');
  for (const shortcut of manifest.shortcuts || []) {
    if (typeof shortcut.url !== 'string' || !shortcut.url.startsWith(scopePrefix)) fail(`${name}: shortcut ${shortcut.name || '(unnamed)'} escapes portal scope: ${shortcut.url}`);
  }

  const filename = manifestFile.replace('public/', '');
  if (!syncSource.includes(`'${filename}'`) && !syncSource.includes(`"${filename}"`)) fail(`${name}: ${filename} is not shipped with ${shippedBy}`);
  else pass(`${name}: role manifest ships with ${shippedBy} build`);
}

console.log('\n── Production PWA sync ──');
for (const [service, packagePath] of [['lms', 'apps/lms/package.json'], ['marketing', 'apps/marketing/package.json']]) {
  const pkg = readJson(packagePath);
  const scripts = `${pkg?.scripts?.prebuild || ''} ${pkg?.scripts?.prestart || ''}`;
  if (!scripts.includes(`sync-pwa-public.mjs ${service}`)) fail(`${service}: prebuild/prestart does not run PWA sync`);
  else pass(`${service}: PWA assets sync before build/start`);
}

console.log('\n── Service worker responsibility boundaries ──');
for (const sw of ['public/sw-marketing.js', 'public/sw-admin.js', 'public/sw-portal.js']) {
  const source = readFile(sw) || '';
  if (/COURSE_CACHE|COURSE_STRATEGY|sync-enrollment|sync-hours|openOfflineDB/i.test(source)) fail(`${sw}: contains LMS offline/course responsibilities`);
  else pass(`${sw}: domain responsibilities are isolated`);
}
const lmsWorker = readFile('public/sw-lms.js') || '';
for (const protectedPath of ['/lms/dashboard', '/apprentice', '/host-shop']) {
  if (!lmsWorker.includes(protectedPath)) warn(`public/sw-lms.js: protected route marker ${protectedPath} was not found; confirm authenticated navigation remains network-only`);
}

console.log('\n── Legacy PWA files ──');
for (const legacy of ['public/manifest-barber.json', 'public/manifest-partner.json', 'public/manifest-instructor.json', 'public/manifest-store.json', 'public/manifest-enrollment.json', 'public/store-manifest.json', 'public/manifest.json']) {
  if (exists(legacy)) warn(`${legacy}: legacy/unlinked manifest remains`);
}

if (failures) {
  console.error(`\n❌ PWA audit FAILED — ${failures} issue(s).\n`);
  process.exit(1);
}
console.log('\n✅ PWA audit PASSED.\n');
