/**
 * Image optimizer — converts large JPEGs/PNGs to WebP using ImageMagick (convert).
 * Run: pnpm tsx scripts/optimize-images.ts
 *
 * - Converts all public/ images >100KB to .webp alongside the original
 * - Resizes down to max 1920px wide
 * - After conversion, run the companion script to update code references
 */

import { readdirSync, statSync, existsSync, writeFileSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { execSync } from 'child_process';

const IMAGE_ROOT = join(process.cwd(), 'public');
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 82;
const MIN_SIZE_KB = 100;
const SKIP_DIRS = new Set(['node_modules', '.next', '.git']);

let processed = 0;
let skipped = 0;
let failed = 0;
let totalOrigBytes = 0;
let totalNewBytes = 0;
const converted: Array<{ orig: string; webp: string }> = [];

function processFile(filePath: string) {
  const ext = extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;

  const stat = statSync(filePath);
  if (stat.size < MIN_SIZE_KB * 1024) { skipped++; return; }

  const dir = dirname(filePath);
  const base = basename(filePath, ext);
  const webpPath = join(dir, base + '.webp');

  if (existsSync(webpPath)) {
    const webpStat = statSync(webpPath);
    if (webpStat.mtimeMs >= stat.mtimeMs) { skipped++; return; }
  }

  try {
    execSync(
      `convert "${filePath}" -resize ${MAX_WIDTH}x${MAX_WIDTH}\\> -quality ${WEBP_QUALITY} "${webpPath}"`,
      { stdio: 'pipe' }
    );
    const newStat = statSync(webpPath);
    totalOrigBytes += stat.size;
    totalNewBytes += newStat.size;
    processed++;
    converted.push({ orig: filePath, webp: webpPath });

    const origKB = (stat.size / 1024).toFixed(0);
    const newKB = (newStat.size / 1024).toFixed(0);
    const pct = (((stat.size - newStat.size) / stat.size) * 100).toFixed(0);
    console.log(`  ✓ ${basename(filePath)} ${origKB}KB → ${newKB}KB (−${pct}%)`);
  } catch (err: any) {
    console.warn(`  ✗ FAILED: ${filePath}: ${err.message?.slice(0, 80)}`);
    failed++;
  }
}

function walkDir(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, files);
    else files.push(full);
  }
  return files;
}

function main() {
  console.log(`\nScanning public/ for images over ${MIN_SIZE_KB}KB...\n`);
  const files = walkDir(IMAGE_ROOT);
  const imageFiles = files.filter(f =>
    ['.jpg', '.jpeg', '.png'].includes(extname(f).toLowerCase())
  );
  console.log(`Found ${imageFiles.length} candidate files.\n`);

  imageFiles.forEach(processFile);

  const savedMB = ((totalOrigBytes - totalNewBytes) / 1024 / 1024).toFixed(1);
  const origMB = (totalOrigBytes / 1024 / 1024).toFixed(1);
  const newMB = (totalNewBytes / 1024 / 1024).toFixed(1);

  console.log(`\n── Results ────────────────────────────────`);
  console.log(`  Converted : ${processed}`);
  console.log(`  Skipped   : ${skipped} (small or already current)`);
  console.log(`  Failed    : ${failed}`);
  console.log(`  Before    : ${origMB} MB`);
  console.log(`  After     : ${newMB} MB`);
  console.log(`  Saved     : ${savedMB} MB`);

  // Write a manifest so the reference-update script knows what changed
  writeFileSync(
    join(process.cwd(), 'scripts/.image-conversion-manifest.json'),
    JSON.stringify(converted.map(({ orig, webp }) => ({
      orig: orig.replace(process.cwd() + '/', ''),
      webp: webp.replace(process.cwd() + '/', ''),
      origRel: orig.replace(process.cwd() + '/public', ''),
      webpRel: webp.replace(process.cwd() + '/public', ''),
    })), null, 2)
  );
  console.log(`\nManifest written to scripts/.image-conversion-manifest.json`);
  console.log(`Run 'pnpm tsx scripts/update-image-refs.ts' to update code references.`);
}

main();
