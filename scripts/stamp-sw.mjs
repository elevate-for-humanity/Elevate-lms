/**
 * Stamps canonical service workers with the real Git SHA so every deployment
 * gets a unique cache version.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const sha = process.env.GIT_SHA ?? process.env.GITHUB_SHA ?? process.env.NEXT_PUBLIC_GIT_SHA;
if (!sha || !/^[a-f0-9]{7,40}$/i.test(sha)) {
  throw new Error(`[stamp-sw] Valid Git SHA required. Received: ${sha ?? 'missing'}`);
}

const shortSha = sha.slice(0, 12);
const workers = [
  { path: 'public/sw-marketing.js', cache: `elevate-marketing-${shortSha}` },
  { path: 'apps/marketing/public/sw-marketing.js', cache: `elevate-marketing-${shortSha}` },
  { path: 'public/sw-admin.js', cache: `elevate-admin-${shortSha}` },
  { path: 'apps/admin/public/sw-admin.js', cache: `elevate-admin-${shortSha}` },
  { path: 'public/sw-lms.js', cache: `elevate-lms-${shortSha}` },
  { path: 'apps/lms/public/sw-lms.js', cache: `elevate-lms-${shortSha}` },
];

let stampedCount = 0;
let skippedCount = 0;
for (const worker of workers) {
  const swPath = join(ROOT, worker.path);
  try {
    const original = readFileSync(swPath, 'utf8');
    if (!original.includes('__CACHE_VERSION__')) {
      // App-specific workers may already be source-stamped or intentionally not
      // use the shared cache placeholder. A build for one service must not fail
      // merely because another service owns a different worker implementation.
      console.warn(`[stamp-sw] ${worker.path} has no __CACHE_VERSION__ placeholder — skipped`);
      skippedCount++;
      continue;
    }
    const stamped = original.replaceAll('__CACHE_VERSION__', worker.cache);
    if (stamped.includes('__CACHE_VERSION__')) {
      throw new Error(`__CACHE_VERSION__ placeholder remains in ${worker.path}`);
    }
    writeFileSync(swPath, stamped, 'utf8');
    console.log(`[stamp-sw] ${worker.path} → ${worker.cache}`);
    stampedCount++;
  } catch (err) {
    if (err?.code === 'ENOENT') {
      console.warn(`[stamp-sw] ${worker.path} not found — skipped`);
      skippedCount++;
    } else {
      throw err;
    }
  }
}

console.log(`[stamp-sw] ${stampedCount} service worker(s) stamped with SHA ${shortSha}; ${skippedCount} skipped`);
