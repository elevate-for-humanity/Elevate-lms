/**
 * Stamps public/sw.js with the real Git SHA so every deployment gets a unique
 * service-worker cache version. The build FAILS if:
 *   - No Git SHA is available (GIT_SHA / GITHUB_SHA / NEXT_PUBLIC_GIT_SHA)
 *   - The SHA is not a valid 7–40 hex string
 *   - No __CACHE_VERSION__ placeholder exists in sw.js
 *   - Replacement leaves any placeholder unreplaced
 *
 * Run BEFORE `next build` so the stamped file is picked up by the copy step.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const swPath = join(__dirname, '..', 'public', 'sw.js');

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
const cacheVersion = `elevate-marketing-${shortSha}`;

const original = readFileSync(swPath, 'utf8');

if (!original.includes('__CACHE_VERSION__')) {
  throw new Error(
    '[stamp-sw] No __CACHE_VERSION__ placeholder found in public/sw.js',
  );
}

const stamped = original.replaceAll('__CACHE_VERSION__', cacheVersion);

if (stamped.includes('__CACHE_VERSION__')) {
  throw new Error(
    '[stamp-sw] __CACHE_VERSION__ placeholder remains after stamping',
  );
}

writeFileSync(swPath, stamped, 'utf8');
console.log(`[stamp-sw] Cache version: ${cacheVersion}`);
console.log(`[stamp-sw] Source SHA:    ${sha}`);
