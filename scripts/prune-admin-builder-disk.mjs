/**
 * Free builder disk before admin runtime COPY layers.
 * Admin does not need the full LMS marketing asset tree or node_modules
 * after standalone + /export copies are prepared.
 */
import { rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const paths = [
  'node_modules',
  'apps/admin/.next/cache',
  '.next/cache',
  'public/audio',
  'public/images/hvac-diagrams',
  'public/images/artlist',
  'public/images/hp',
  'public/images/demos',
  'public/images/barber-clipper-options',
];

for (const rel of paths) {
  const abs = join(root, rel);
  try {
    rmSync(abs, { recursive: true, force: true });
    console.log(`[prune-admin-builder] removed ${rel}`);
  } catch (err) {
    console.warn(`[prune-admin-builder] skip ${rel}:`, err instanceof Error ? err.message : err);
  }
}

console.log('[prune-admin-builder] done');
