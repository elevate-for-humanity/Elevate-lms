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
  ['marketing', 'apps/marketing/app/layout.tsx', 'public/manifest-marketing.json', 'public/sw-marketing.js', 'MarketingPwaClient'],
  ['admin', 'apps/admin/app/layout.tsx', 'public/manifest-admin.json', 'public/sw-admin.js', 'AdminPwaRegister'],
  ['lms', 'apps/lms/app/layout.tsx', 'public/manifest-lms.json', 'public/sw-lms.js', 'LmsPwaRegistration'],
];
const PWA_COMPONENTS = ['AdminPwaRegister', 'MarketingPwaClient', 'MarketingPwaRegistration', 'LmsPwaRegistration'];
const PERSONAS = [
  ['Learner', 'apps/lms/app/lms/layout.tsx', 'public/manifest-student.json', '/manifest-student.json', '/lms/dashboard', '/lms', 'lms'],
  ['Apprentice', 'apps/lms/app/apprentice/layout.tsx', 'public/manifest-apprentice.json', '/manifest-apprentice.json', '/apprentice', '/apprentice', 'lms'],
  ['Host Shop', 'apps/lms/app/host-shop/layout.tsx', 'public/manifest-shop-owner.json', '/manifest-shop-owner.json', '/host-shop/dashboard', '/host-shop/', 'lms'],
  ['Program Holder', 'apps/lms/app/program-holder/layout.tsx', 'public/manifest-program-holder.json', '/manifest-program-holder.json', '/program-holder/dashboard', '/program-holder/', 'lms'],
];

const CANONICAL_MANIFEST_ROUTES = [
  ['LMS root start', 'public/manifest-lms.json', 'start_url', '/lms/dashboard', 'apps/lms/app/lms/(app)/dashboard/page.tsx'],
  ['LMS learner shortcut', 'public/manifest-lms.json', 'shortcut:Learner Dashboard', '/lms/dashboard', 'apps/lms/app/lms/(app)/dashboard/page.tsx'],
  ['LMS apprentice shortcut', 'public/manifest-lms.json', 'shortcut:Apprentice Dashboard', '/apprentice', 'apps/lms/app/apprentice/page.tsx'],
  ['LMS host shop shortcut', 'public/manifest-lms.json', 'shortcut:Host Shop Dashboard', '/host-shop/dashboard', 'apps/lms/app/host-shop/dashboard/page.tsx'],
  ['LMS employer shortcut', 'public/manifest-lms.json', 'shortcut:Employer Dashboard', '/employer/dashboard', 'apps/lms/app/employer/dashboard/page.tsx'],
  ['Admin root start', 'public/manifest-admin.json', 'start_url', '/dashboard', 'apps/admin/app/dashboard/page.tsx'],
  ['Admin students shortcut', 'public/manifest-admin.json', 'shortcut:Students', '/students', 'apps/admin/app/students/page.tsx'],
  ['Admin applications shortcut', 'public/manifest-admin.json', 'shortcut:Applications', '/applications', 'apps/admin/app/applications/page.tsx'],
  ['Admin reports shortcut', 'public/manifest-admin.json', 'shortcut:Reports', '/reports', 'apps/admin/app/reports/page.tsx'],
  ['Marketing root start', 'public/manifest-marketing.json', 'start_url', '/', 'apps/marketing/app/page.tsx'],
];

const pathOnly = (value) => typeof value === 'string' ? value.split('?')[0].split('#')[0] : '';
const manifestRouteValue = (manifest, selector) => {
  if (selector === 'start_url') return manifest?.start_url;
  if (selector.startsWith('shortcut:')) {
    const name = selector.slice('shortcut:'.length);
    return manifest?.shortcuts?.find((shortcut) => shortcut?.name === name)?.url;
  }
  return undefined;
};

console.log('\n── Canonical PWA registrations ──');
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

console.log('\n── Manifest launch and shortcut routes ──');
for (const [label, manifestFile, selector, expectedUrl, sourcePath] of CANONICAL_MANIFEST_ROUTES) {
  const manifest = readJson(manifestFile);
  if (!manifest) { fail(`${label}: invalid or missing ${manifestFile}`); continue; }
  const actual = manifestRouteValue(manifest, selector);
  if (!actual) {
    fail(`${label}: ${selector} missing`);
    continue;
  }
  if (pathOnly(actual) !== expectedUrl) fail(`${label}: expected ${expectedUrl}, found ${actual}`);
  else pass(`${label}: canonical URL ${expectedUrl}`);
  if (!exists(sourcePath)) fail(`${label}: source route missing at ${sourcePath}`);
  else pass(`${label}: source route exists`);
}

const adminManifest = readJson('public/manifest-admin.json');
for (const shortcut of adminManifest?.shortcuts || []) {
  if (typeof shortcut.url === 'string' && shortcut.url.startsWith('/admin/')) {
    fail(`Admin manifest contains retired /admin/* shortcut: ${shortcut.url}`);
  }
}
if (pathOnly(adminManifest?.start_url).startsWith('/admin/')) {
  fail(`Admin manifest contains retired /admin/* start_url: ${adminManifest.start_url}`);
}

console.log('\n── Authenticated role manifests ──');
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
for (const [service, packagePath] of [['lms', 'apps/lms/package.json'], ['marketing', 'apps/marketing/package.json'], ['admin', 'apps/admin/package.json']]) {
  const pkg = readJson(packagePath);
  const scripts = `${pkg?.scripts?.prebuild || ''} ${pkg?.scripts?.prestart || ''}`;
  if (!scripts.includes(`sync-pwa-public.mjs ${service}`)) fail(`${service}: prebuild/prestart does not run PWA sync`);
  else pass(`${service}: PWA assets sync before build/start`);
}

console.log('\n── Service worker responsibility boundaries ──');
for (const sw of ['public/sw-marketing.js', 'public/sw-admin.js']) {
  const source = readFile(sw) || '';
  if (/COURSE_CACHE|COURSE_STRATEGY|sync-enrollment|sync-hours|openOfflineDB/i.test(source)) fail(`${sw}: contains LMS offline/course responsibilities`);
  else pass(`${sw}: domain responsibilities are isolated`);
}
const lmsWorker = readFile('public/sw-lms.js') || '';
for (const protectedPath of ['/lms/dashboard', '/apprentice', '/host-shop', '/program-holder']) {
  if (!lmsWorker.includes(protectedPath)) warn(`public/sw-lms.js: protected route marker ${protectedPath} was not found; confirm authenticated navigation remains network-only`);
}

console.log('\n── Marketing homepage cache and canonical boundaries ──');
const marketingWorker = readFile('public/sw-marketing.js') || '';
const marketingPrecache = marketingWorker.match(/const PRECACHE_ASSETS\s*=\s*\[([^\]]*)\]/s)?.[1] || '';
if (/['"]\/['"]/.test(marketingPrecache)) fail('Marketing worker precaches the homepage HTML');
else pass('Marketing worker does not precache homepage HTML');
const navigationHandler = marketingWorker.match(/if \(request\.mode === ['"]navigate['"]\)\s*\{([\s\S]*?)\n\s*\}/)?.[1] || '';
const navigationCode = navigationHandler.replace(/\/\/.*$/gm, '');
if (/respondWith|networkFirst|caches\./.test(navigationCode)) fail('Marketing worker intercepts or caches browser navigations');
else pass('Marketing browser navigations bypass CacheStorage');

const legacyWorker = readFile('public/sw.js') || '';
if (!legacyWorker.includes('LEGACY_WORKER_RETIREMENT')) fail('Legacy /sw.js is not an explicit retirement shim');
else if (legacyWorker.includes("addEventListener('fetch'")) fail('Legacy /sw.js still intercepts network requests');
else pass('Legacy /sw.js only clears caches and unregisters itself');

const offlineManager = readFile('lib/offline/service-worker-manager.ts') || '';
if (offlineManager.includes("register('/sw.js'")) fail('Shared offline manager can re-register legacy /sw.js');
else if (!offlineManager.includes("'/sw-marketing.js'")) fail('Shared offline manager does not resolve the canonical Marketing worker');
else pass('Shared offline manager resolves app-specific canonical workers');

if (exists('public/manifest.json')) fail('Legacy root manifest public/manifest.json still exists');
else pass('Only the canonical Marketing root manifest is shipped');

for (const staleConfig of ['next.config.mjs.current', 'next.config.mjs.green']) {
  if (exists(staleConfig)) fail(`Tracked parallel configuration remains: ${staleConfig}`);
  else pass(`Parallel configuration removed: ${staleConfig}`);
}

const sitemapSource = readFile('apps/marketing/app/sitemap.ts') || '';
const routeRegistrySource = readFile('lib/navigation/public-route-registry.ts') || '';
const homepageEntries = routeRegistrySource.match(/path:\s*ROUTES\.home/g)?.length || 0;
if (!sitemapSource.includes('PUBLIC_ROUTE_REGISTRY.map')) fail('Sitemap source does not include the public route registry');
if (homepageEntries !== 1) fail(`Sitemap source must declare one homepage, found ${homepageEntries}`);
else pass('Sitemap source declares exactly one canonical homepage');

if (failures) {
  console.error(`\n❌ PWA audit FAILED — ${failures} issue(s).\n`);
  process.exit(1);
}
console.log('\n✅ PWA audit PASSED.\n');
