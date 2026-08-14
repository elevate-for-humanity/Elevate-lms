import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const service = process.argv[2];

const config = {
  marketing: {
    appDir: 'apps/marketing',
    files: [
      'sw-marketing.js',
      'manifest-marketing.json',
      'manifest-program-holder.json',
      'offline.html',
    ],
  },
  lms: {
    appDir: 'apps/lms',
    files: [
      'sw-lms.js',
      'manifest-lms.json',
      'manifest-student.json',
      'manifest-apprentice.json',
      'manifest-shop-owner.json',
      'offline.html',
    ],
  },
  admin: {
    appDir: 'apps/admin',
    files: ['sw-admin.js', 'manifest-admin.json', 'offline.html'],
  },
};

if (!service || !config[service]) {
  throw new Error(`[sync-pwa-public] Expected one of: ${Object.keys(config).join(', ')}`);
}

const targetDir = join(root, config[service].appDir, 'public');
mkdirSync(targetDir, { recursive: true });

// App-local PWA files are generated build artifacts, never independent sources
// of truth. Remove every known current/legacy PWA artifact before copying the
// canonical files from root public/ so stale workers/manifests cannot survive
// from an older checkout, local build, cached image layer, or retired portal.
const generatedPwaFiles = new Set([
  ...Object.values(config).flatMap((entry) => entry.files),
  'sw.js',
  'sw-portal.js',
  'manifest-portal.json',
  'manifest.json',
  'manifest-barber.json',
  'manifest-partner.json',
  'manifest-instructor.json',
  'manifest-store.json',
  'manifest-enrollment.json',
  'store-manifest.json',
]);

let removed = 0;
for (const filename of generatedPwaFiles) {
  const target = join(targetDir, filename);
  if (!existsSync(target)) continue;
  rmSync(target, { force: true });
  removed += 1;
}

let copied = 0;
for (const filename of config[service].files) {
  const source = join(root, 'public', filename);
  if (!existsSync(source)) {
    throw new Error(`[sync-pwa-public] Required canonical PWA asset is missing: public/${filename}`);
  }
  copyFileSync(source, join(targetDir, filename));
  copied += 1;
}

console.log(
  `[sync-pwa-public] ${service}: removed ${removed} generated/stale PWA asset(s); copied ${copied} canonical asset(s) into ${config[service].appDir}/public`,
);
