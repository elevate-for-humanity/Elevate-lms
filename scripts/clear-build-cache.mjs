/**
 * Clear stale Next.js build cache before each Netlify deploy.
 *
 * Problem: Netlify persists .next/cache between builds via [[build.cache]].
 * When a build OOMs or fails mid-way through static generation, the partial
 * cache is saved and reused on the next build — causing stale pages to be
 * served or the build to crash again from corrupted cache state.
 *
 * This script wipes .next/cache/webpack before every build so each deploy
 * starts from a clean webpack module graph. The Next.js fetch/ISR cache
 * (.next/cache/fetch-cache) is preserved — it only contains HTTP response
 * data and is safe to reuse across deploys.
 */

import { rm, access } from 'node:fs/promises';
import { join } from 'node:path';

const WEBPACK_CACHE = join(process.cwd(), '.next', 'cache', 'webpack');

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

if (await exists(WEBPACK_CACHE)) {
  await rm(WEBPACK_CACHE, { recursive: true, force: true });
  console.log('[clear-build-cache] Cleared .next/cache/webpack — stale cache removed.');
} else {
  console.log('[clear-build-cache] No webpack cache found — nothing to clear.');
}
