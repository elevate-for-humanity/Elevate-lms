/**
 * Deletes original JPG/PNG files that have been converted to WebP.
 * Run AFTER update-image-refs.ts confirms references are updated.
 * Run: pnpm tsx scripts/delete-original-images.ts
 *
 * Only deletes files listed in the conversion manifest where .webp exists.
 */

import { readFileSync, unlinkSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const MANIFEST_PATH = join(process.cwd(), 'scripts/.image-conversion-manifest.json');

if (!existsSync(MANIFEST_PATH)) {
  console.error('No manifest found. Run pnpm tsx scripts/optimize-images.ts first.');
  process.exit(1);
}

const manifest: Array<{ orig: string; webp: string }> = JSON.parse(
  readFileSync(MANIFEST_PATH, 'utf8')
);

let deleted = 0;
let savedBytes = 0;

for (const { orig, webp } of manifest) {
  if (!existsSync(webp)) { console.log(`  SKIP (no webp): ${webp}`); continue; }
  if (!existsSync(orig)) { continue; }
  const size = statSync(orig).size;
  unlinkSync(orig);
  savedBytes += size;
  deleted++;
  console.log(`  deleted: ${orig.replace(process.cwd() + '/', '')}`);
}

console.log(`\n── Done ──────────────────────────────────`);
console.log(`  Deleted : ${deleted} originals`);
console.log(`  Freed   : ${(savedBytes / 1024 / 1024).toFixed(1)} MB`);
