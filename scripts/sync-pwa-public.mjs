import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const service = process.argv[2];

const config = {
  marketing: {
    appDir: 'apps/marketing',
    worker: 'sw-marketing.js',
    cachePrefix: 'elevate-marketing-',
    files: [
      'sw-marketing.js',
      'manifest-marketing.json',
      'offline.html',
    ],
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
    // sw-phone.js + manifest-phone.json belong to the Elevate Phone app,
    // which the Admin service hosts under /phone/. They ride the admin sync
    // so the build's PWA cleanup cannot delete them; the phone worker is
    // never stamped (see stamp-sw.mjs), so Admin releases do not churn it.
    files: ['sw-admin.js', 'manifest-admin.json', 'sw-mail.js', 'manifest-mail.json', 'offline.html', 'sw-phone.js', 'manifest-phone.json'],
    extraWorkers: [{ file: 'sw-mail.js', cachePrefix: 'elevate-mail-' }],
  },
};

if (!service || !config[service]) {
  throw new Error(`[sync-pwa-public] Expected one of: ${Object.keys(config).join(', ')}`);
}

const targetDir = join(root, config[service].appDir, 'public');
mkdirSync(targetDir, { recursive: true });

// App-local PWA files are generated build artifacts, never independent sources
// of truth. Clean by filename pattern rather than carrying a list of retired
// manifest/worker names forever. Only the service's canonical files are copied
// back from root public/ below.
const isGeneratedPwaArtifact = (filename) =>
  /^sw(?:-[a-z0-9-]+)?\.js$/i.test(filename) ||
  /manifest.*\.(?:json|webmanifest)$/i.test(filename) ||
  filename === 'offline.html';

let removed = 0;
for (const filename of readdirSync(targetDir)) {
  if (!isGeneratedPwaArtifact(filename)) continue;
  rmSync(join(targetDir, filename), { force: true });
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

// Production containers build each app from its app-local public directory.
// Stamp the copied worker here as well as in the root source so Northflank
// cannot ship the literal __CACHE_VERSION__ placeholder and retain stale
// Admin/LMS/Marketing caches across releases.
function resolveBuildSha() {
  const configured = process.env.GIT_SHA ?? process.env.GITHUB_SHA ?? process.env.NEXT_PUBLIC_GIT_SHA;
  if (configured) return configured;

  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

const sha = resolveBuildSha();
if (sha && /^[a-f0-9]{7,40}$/i.test(sha)) {
  // A service can host a sibling application worker (Elevate Mail's
  // sw-mail.js ships inside the Admin build); every copied worker gets
  // stamped with its own cache prefix.
  const stampTargets = [
    { file: config[service].worker, cachePrefix: config[service].cachePrefix },
    ...(config[service].extraWorkers ?? []),
  ];
  for (const target of stampTargets) {
    const workerPath = join(targetDir, target.file);
    const workerSource = readFileSync(workerPath, 'utf8');
    const cacheVersion = `${target.cachePrefix}${sha.slice(0, 12)}`;
    const stamped = workerSource.replaceAll('__CACHE_VERSION__', cacheVersion);
    if (stamped.includes('__CACHE_VERSION__')) {
      throw new Error(`[sync-pwa-public] Failed to stamp ${workerPath}`);
    }
    writeFileSync(workerPath, stamped, 'utf8');
    console.log(`[sync-pwa-public] ${service}: stamped ${target.file} → ${cacheVersion}`);
  }
}

console.log(
  `[sync-pwa-public] ${service}: removed ${removed} generated/stale PWA asset(s); copied ${copied} canonical asset(s) into ${config[service].appDir}/public`,
);
