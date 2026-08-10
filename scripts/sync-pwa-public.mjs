import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
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

let copied = 0;
for (const filename of config[service].files) {
  const source = join(root, 'public', filename);
  if (!existsSync(source)) {
    throw new Error(`[sync-pwa-public] Required PWA asset is missing: public/${filename}`);
  }
  copyFileSync(source, join(targetDir, filename));
  copied += 1;
}

console.log(`[sync-pwa-public] ${service}: copied ${copied} PWA asset(s) into ${config[service].appDir}/public`);
