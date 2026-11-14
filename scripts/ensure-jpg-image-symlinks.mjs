#!/usr/bin/env node
/**
 * Create .jpg symlinks → .webp for migrated marketing images so next/image
 * can read files when legacy paths still reference .jpg in code or DB.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dir, '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dir, '.image-conversion-manifest.json'), 'utf8'),
);

const EXTRA = [
  ['public/hero-images/how-it-works-hero.jpg', 'how-it-works-hero.webp'],
  ['public/images/alberta-davis.jpg', 'alberta-davis.webp'],
  ['public/images/facilities-new/facility-2.jpg', 'facility-2.webp'],
];

let created = 0;
let skipped = 0;

function ensureSymlink(absJpg, webpBasename) {
  const dir = path.dirname(absJpg);
  const webp = path.join(dir, webpBasename);
  if (!fs.existsSync(webp)) {
    console.warn(`skip (no webp): ${path.relative(root, absJpg)}`);
    skipped++;
    return;
  }
  if (fs.existsSync(absJpg)) {
    skipped++;
    return;
  }
  fs.symlinkSync(path.basename(webp), absJpg);
  created++;
  console.log(`link ${path.relative(root, absJpg)} -> ${path.basename(webp)}`);
}

for (const row of manifest) {
  ensureSymlink(path.join(root, row.orig), path.basename(row.webp));
}

for (const [jpgRel, webpBase] of EXTRA) {
  ensureSymlink(path.join(root, jpgRel), webpBase);
}

/** Any .webp under public/images/pages without a .jpg sibling gets a symlink. */
const pagesDir = path.join(root, 'public/images/pages');
for (const name of fs.readdirSync(pagesDir)) {
  if (!name.endsWith('.webp')) continue;
  const jpgName = name.replace(/\.webp$/, '.jpg');
  ensureSymlink(path.join(pagesDir, jpgName), name);
}

console.log(`\nDone: ${created} symlinks created, ${skipped} skipped.`);
