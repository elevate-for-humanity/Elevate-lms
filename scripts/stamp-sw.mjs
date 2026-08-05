/**
 * Stamps all domain-specific service workers (sw-*.js) with the real Git SHA
 * so every deployment gets a unique service-worker cache version.
 *
 * Each domain gets its own cache namespace:
 *   elevate-marketing-{sha} → sw-marketing.js
 *   elevate-admin-{sha}     → sw-admin.js
 *   elevate-lms-{sha}       → sw-lms.js
 *   elevate-portal-{sha}    → sw-portal.js
 *
 * The build FAILS if:
 *   - No Git SHA is available (GIT_SHA / GITHUB_SHA / NEXT_PUBLIC_GIT_SHA)
 *   - The SHA is not a valid 7–40 hex string
 *   - A __CACHE_VERSION__ placeholder remains after stamping
 *
 * Run BEFORE `next build` so the stamped files are picked up by the copy step.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const sha =
  process.env.GIT_SHA ??
  process.env.GITHUB_SHA ??
  process.env.NEXT_PUBLIC_GIT_SHA;

if (!sha || !/^[a-f0-9]{7,40}$/i.test(sha)) {
  throw new Error(
    `[stamp-sw] Valid Git SHA required. Received: ${sha ?? 'missing'}`,
  );
}

const shortSha = sha.slice(0, 12);

// Map domain name → cache prefix
const DOMAIN_CACHE_PREFIX = {
  'sw-marketing.js': `elevate-marketing-${shortSha}`,
  'sw-admin.js':     `elevate-admin-${shortSha}`,
  'sw-lms.js':       `elevate-lms-${shortSha}`,
  'sw-portal.js':    `elevate-portal-${shortSha}`,
};

let stampedCount = 0;

for (const [filename, cacheVersion] of Object.entries(DOMAIN_CACHE_PREFIX)) {
  const swPath = join(PUBLIC_DIR, filename);

  try {
    const original = readFileSync(swPath, 'utf8');

    if (!original.includes('__CACHE_VERSION__')) {
      throw new Error(`No __CACHE_VERSION__ placeholder in ${filename}`);
    }

    const stamped = original.replaceAll('__CACHE_VERSION__', cacheVersion);

    if (stamped.includes('__CACHE_VERSION__')) {
      throw new Error(`__CACHE_VERSION__ placeholder remains in ${filename}`);
    }

    writeFileSync(swPath, stamped, 'utf8');
    console.log(`[stamp-sw] ${filename} → ${cacheVersion}`);
    stampedCount++;
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`[stamp-sw] ${filename} not found — skipped`);
    } else {
      throw err;
    }
  }
}

if (stampedCount > 0) {
  console.log(`[stamp-sw] ${stampedCount} service worker(s) stamped with SHA ${shortSha}`);
} else {
  console.warn('[stamp-sw] No service workers stamped — check that sw-*.js files exist');
}
