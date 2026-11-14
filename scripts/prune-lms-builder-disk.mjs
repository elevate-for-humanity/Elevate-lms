/**
 * Free builder disk before LMS runtime COPY layers.
 */
import { rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const paths = [
  'node_modules',
  '.next/cache',
  'apps/admin',
];

for (const rel of paths) {
  const abs = join(root, rel);
  try {
    rmSync(abs, { recursive: true, force: true });
    console.log(`[prune-lms-builder] removed ${rel}`);
  } catch (err) {
    console.warn(`[prune-lms-builder] skip ${rel}:`, err instanceof Error ? err.message : err);
  }
}

console.log('[prune-lms-builder] done');
