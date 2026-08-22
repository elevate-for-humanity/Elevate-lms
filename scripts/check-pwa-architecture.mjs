#!/usr/bin/env node
import fs from 'node:fs';

const failures = [];
const read = (path) => fs.readFileSync(path, 'utf8');
const required = [
  'lib/pwa/registry.ts',
  'components/pwa/CanonicalPwaRegistration.tsx',
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

  if (worker === 'public/sw-lms.js') {
    if (content.includes('CACHE_COURSE') || content.includes('COURSE_CACHE')) {
      failures.push(`${worker} may persist authenticated course responses`);
    }
    if (!content.includes('lms\\/courses')) {
      failures.push(`${worker} does not explicitly exclude LMS course routes from protected caching`);
    }
    if (!content.includes("name.endsWith('-courses')")) {
      failures.push(`${worker} does not retire legacy course caches during activation`);
    }
  }
}

for (const manifest of required.filter((file) => file.includes('/manifest-'))) {
  const data = JSON.parse(read(manifest));
  if (!data.name || !data.start_url || !data.scope || data.display !== 'standalone') failures.push(`${manifest} is not installable`);
}

if (failures.length) {
  console.error(failures.map((failure) => `PWA ARCHITECTURE ERROR: ${failure}`).join('\n'));
  process.exit(1);
}
console.log('PWA architecture verified: one registration engine, three origin workers, role manifests, protected LMS content is not cached, and Marketing navigation/API caching remains disabled.');
