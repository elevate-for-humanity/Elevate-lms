import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const services = {
  marketing: {
    appDir: 'apps/marketing',
    worker: 'sw-marketing.js',
    cachePrefix: 'elevate-marketing-',
    files: ['sw-marketing.js', 'manifest-marketing.json', 'offline.html'],
  },
  lms: {
    appDir: 'apps/lms',
    worker: 'sw-lms.js',
    cachePrefix: 'elevate-lms-',
    files: [
      'sw-lms.js',
      'manifest-lms.json',
      'manifest-student.json',
      'manifest-apprentice.json',
      'manifest-shop-owner.json',
      'manifest-program-holder.json',
      'manifest-employer.json',
      'offline.html',
    ],
  },
  admin: {
    appDir: 'apps/admin',
    worker: 'sw-admin.js',
    cachePrefix: 'elevate-admin-',
    files: ['sw-admin.js', 'manifest-admin.json', 'offline.html'],
  },
};

const forbiddenRouteFragments = [
  '/employer-portal',
  '/programs/catalog',
  '/enroll/course',
];

const failures = [];
const fail = (message) => failures.push(message);

function readRequired(path, label) {
  if (!existsSync(path)) {
    fail(`${label} is missing: ${path.replace(`${ROOT}/`, '')}`);
    return null;
  }
  return readFileSync(path, 'utf8');
}

function assertRoute(value, label) {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    fail(`${label} must be an absolute app-relative route beginning with /`);
    return;
  }
  for (const fragment of forbiddenRouteFragments) {
    if (value.includes(fragment)) {
      fail(`${label} references retired route fragment ${fragment}: ${value}`);
    }
  }
}

function verifyManifest(filename, sourceText) {
  let manifest;
  try {
    manifest = JSON.parse(sourceText);
  } catch (error) {
    fail(`public/${filename} is not valid JSON: ${error.message}`);
    return;
  }

  if (!manifest.name || !manifest.short_name) {
    fail(`public/${filename} must define name and short_name`);
  }

  assertRoute(manifest.start_url, `public/${filename} start_url`);
  assertRoute(manifest.scope, `public/${filename} scope`);

  if (Array.isArray(manifest.shortcuts)) {
    manifest.shortcuts.forEach((shortcut, index) => {
      assertRoute(shortcut?.url, `public/${filename} shortcuts[${index}].url`);
    });
  }

  if (Array.isArray(manifest.icons)) {
    manifest.icons.forEach((icon, index) => {
      if (!icon?.src || typeof icon.src !== 'string') {
        fail(`public/${filename} icons[${index}].src is missing`);
        return;
      }
      if (/^(?:https?:|data:)/i.test(icon.src)) return;
      const iconPath = join(ROOT, 'public', icon.src.replace(/^\//, ''));
      if (!existsSync(iconPath)) {
        fail(`public/${filename} icons[${index}] points to missing asset: ${icon.src}`);
      }
    });
  }
}

function normalizeStampedWorker(source, cachePrefix) {
  const escapedPrefix = cachePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stampedCache = new RegExp(`${escapedPrefix}[a-f0-9]{7,12}`, 'gi');
  return source.replace(stampedCache, '__CACHE_VERSION__');
}

for (const [service, config] of Object.entries(services)) {
  for (const filename of config.files) {
    const canonicalPath = join(ROOT, 'public', filename);
    const runtimePath = join(ROOT, config.appDir, 'public', filename);
    const canonical = readRequired(canonicalPath, `${service} canonical PWA asset`);
    const runtime = readRequired(runtimePath, `${service} runtime PWA asset`);

    if (canonical === null || runtime === null) continue;

    if (filename === config.worker) {
      const normalizedRuntime = normalizeStampedWorker(runtime, config.cachePrefix);
      if (canonical !== normalizedRuntime) {
        fail(`${service} runtime worker differs from canonical public/${filename} beyond the expected cache-version stamp`);
      }
      if (runtime.includes('__CACHE_VERSION__')) {
        fail(`${service} runtime worker still contains the unstamped __CACHE_VERSION__ placeholder`);
      }
    } else if (canonical !== runtime) {
      fail(`${service} runtime asset differs from canonical public/${filename}`);
    }

    if (/manifest.*\.json$/i.test(filename)) {
      verifyManifest(filename, canonical);
    }
  }
}

if (failures.length) {
  console.error(`[verify-pwa-packaging-contract] ${failures.length} failure(s)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

const checked = Object.values(services).reduce((total, service) => total + service.files.length, 0);
console.log(`[verify-pwa-packaging-contract] PASS: ${checked} canonical/runtime assets verified across marketing, lms, and admin`);
