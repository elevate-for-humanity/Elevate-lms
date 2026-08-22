#!/usr/bin/env node
import fs from 'node:fs';

const failures = [];
const read = (path) => fs.readFileSync(path, 'utf8');
const required = [
  'lib/pwa/registry.ts',
  'components/pwa/CanonicalPwaRegistration.tsx',
  'components/pwa/OfflineStatusBanner.tsx',
  'lib/timeclock/offline-queue.ts',
  'public/sw-admin.js',
  'public/sw-lms.js',
  'public/sw-marketing.js',
  'public/offline.html',
  'public/manifest-admin.json',
  'public/manifest-lms.json',
  'public/manifest-student.json',
  'public/manifest-apprentice.json',
  'public/manifest-employer.json',
  'public/manifest-program-holder.json',
  'public/manifest-shop-owner.json',
  'public/manifest-marketing.json',
  'Dockerfile.admin',
  'Dockerfile.lms',
];
for (const file of required) if (!fs.existsSync(file)) failures.push(`missing ${file}`);

for (const [wrapper, application] of [['AdminPwaRegister.tsx', 'admin'], ['LmsPwaRegistration.tsx', 'lms'], ['MarketingPwaRegistration.tsx', 'marketing']]) {
  const content = read(`components/pwa/${wrapper}`);
  if (!content.includes('CanonicalPwaRegistration') || !content.includes(`application="${application}"`)) failures.push(`${wrapper} bypasses canonical registration`);
  if (content.includes('serviceWorker.register')) failures.push(`${wrapper} contains a parallel registration path`);
}

for (const worker of ['public/sw-admin.js', 'public/sw-lms.js', 'public/sw-marketing.js']) {
  const content = read(worker);
  if (worker === 'public/sw-marketing.js') {
    const navigationHandler = content.match(/if \(request\.mode === ['"]navigate['"]\)\s*\{([\s\S]*?)\n\s*\}/)?.[1] || '';
    const navigationCode = navigationHandler.replace(/\/\/.*$/gm, '');
    if (/respondWith|networkFirst|caches\./.test(navigationCode)) failures.push(`${worker} caches public page navigations`);
  } else if (!content.includes("caches.match('/offline.html')")) {
    failures.push(`${worker} lacks offline navigation fallback`);
  }
  if (!content.includes("url.pathname.startsWith('/api/')")) failures.push(`${worker} may cache API data`);
}

const adminWorker = read('public/sw-admin.js');
if (!adminWorker.includes("fetch(request, { cache: 'no-store'")) failures.push('Admin navigation is not network-only');
if (/cache\.put\([^\n]*(?:\/api\/|dashboard)/i.test(adminWorker)) failures.push('Admin worker appears to persist protected data');

const lmsWorker = read('public/sw-lms.js');
for (const marker of ['sync-timeclock', 'SYNC_TIMECLOCK', 'offline-actions', 'TIMECLOCK_SYNC_REJECTED']) {
  if (!lmsWorker.includes(marker)) failures.push(`LMS worker missing offline attendance contract: ${marker}`);
}
if (!lmsWorker.includes("credentials: 'same-origin'")) failures.push('LMS offline replay does not preserve authenticated session credentials');
if (!lmsWorker.includes("caches.match('/offline.html')")) failures.push('LMS worker lacks dashboard offline shell');

const queue = read('lib/timeclock/offline-queue.ts');
for (const marker of ['offline_replay: true', 'client_shift_id', 'client_recorded_at', "sync.register('sync-timeclock')"]) {
  if (!queue.includes(marker)) failures.push(`Offline timeclock queue missing ${marker}`);
}

const actionRoute = read('apps/lms/app/api/timeclock/action/route.ts');
for (const marker of ['MAX_OFFLINE_EVENT_AGE_MS', 'MAX_CLIENT_CLOCK_SKEW_MS', 'offline_replay', 'client_recorded_at', 'Outside geofence']) {
  if (!actionRoute.includes(marker)) failures.push(`Timeclock replay validation missing ${marker}`);
}

for (const [dockerfile, worker] of [['Dockerfile.admin', 'sw-admin.js'], ['Dockerfile.lms', 'sw-lms.js']]) {
  const content = read(dockerfile);
  if (!content.includes('scripts/stamp-sw.mjs')) failures.push(`${dockerfile} does not stamp service workers`);
  if (!content.includes(worker) || !content.includes('__CACHE_VERSION__')) failures.push(`${dockerfile} does not verify ${worker} cache stamping`);
}

for (const manifest of required.filter((file) => file.includes('/manifest-'))) {
  const data = JSON.parse(read(manifest));
  if (!data.name || !data.start_url || !data.scope || data.display !== 'standalone') failures.push(`${manifest} is not installable`);
}

if (failures.length) {
  console.error(failures.map((failure) => `PWA ARCHITECTURE ERROR: ${failure}`).join('\n'));
  process.exit(1);
}
console.log('PWA architecture verified: canonical workers, installable role manifests, protected-data cache boundaries, offline shell, deployment cache stamping, and server-validated offline timeclock replay.');
