/**
 * Updates .jpg/.jpeg/.png src references in code files to use .webp equivalents.
 * Run AFTER optimize-images.ts has generated the manifest.
 * Run: pnpm tsx scripts/update-image-refs.ts
 *
 * Only updates references where a .webp version actually exists.
 * Skips binary files, node_modules, .next, _archived.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';

const MANIFEST_PATH = join(process.cwd(), 'scripts/.image-conversion-manifest.json');
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '_archived', '.git']);
const SKIP_FILES = new Set(['scripts/.image-conversion-manifest.json']); // never update the manifest itself
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mdx', '.md', '.json', '.css', '.html']);

if (!existsSync(MANIFEST_PATH)) {
  console.error('No manifest found. Run pnpm tsx scripts/optimize-images.ts first.');
  process.exit(1);
}

const manifest: Array<{ origRel: string; webpRel: string }> = JSON.parse(
  readFileSync(MANIFEST_PATH, 'utf8')
);

// Build lookup: /images/foo.jpg → /images/foo.webp
const replacements = new Map<string, string>();
for (const { origRel, webpRel } of manifest) {
  // origRel is like /images/pages/hero.jpg
  replacements.set(origRel, webpRel);
  // Also handle without leading slash in case some refs use relative paths
  replacements.set(origRel.replace(/^\//, ''), webpRel.replace(/^\//, ''));
}

function walkDir(dir: string, files: string[] = []): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, files);
    else if (CODE_EXTS.has(extname(entry.name))) files.push(full);
  }
  return files;
}

let filesUpdated = 0;
let refsUpdated = 0;

const codeFiles = walkDir(process.cwd());

for (const filePath of codeFiles) {
  const relPath = filePath.replace(process.cwd() + '/', '');
  if (SKIP_FILES.has(relPath)) continue; // protect manifest from self-corruption
  let content = readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [orig, webp] of replacements) {
    // Match the path in various contexts: src="...", href="...", url('...'), template literals
    const escaped = orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'g');
    const matches = content.match(re);
    if (matches) {
      content = content.replace(re, webp);
      refsUpdated += matches.length;
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(filePath, content);
    const rel = filePath.replace(process.cwd() + '/', '');
    console.log(`  updated: ${rel}`);
    filesUpdated++;
  }
}

console.log(`\n── Done ──────────────────────────────────`);
console.log(`  Files updated : ${filesUpdated}`);
console.log(`  References    : ${refsUpdated}`);
console.log(`\nNow you can safely delete the original JPG/PNG files:`);
console.log(`  pnpm tsx scripts/delete-original-images.ts`);
