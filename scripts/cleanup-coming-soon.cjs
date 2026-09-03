#!/usr/bin/env node

// scripts/cleanup-coming-soon.js
//
// Run from repo root:
//   node scripts/cleanup-coming-soon.js
//
// It will:
//  - scan app/, components/, src/
//  - find files with "Coming Soon"
//  - remove common banner lines that contain "Coming Soon"
//  - log everything it changes
//
// You can undo with: git status / git diff / git restore

const fs = require('fs');
const path = require('path');

const ROOT_DIRS = ['app', 'components', 'src'];

const TEXT_PATTERNS = ['Coming Soon', 'COMING SOON'];

const EXTS = new Set(['.tsx', '.jsx', '.ts', '.js', '.mdx', '.md']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (EXTS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function hasComingSoon(content) {
  return TEXT_PATTERNS.some((p) => content.includes(p));
}

function cleanContent(content) {
  let updated = content;

  // remove simple one-line banners that contain "Coming Soon"
  updated = updated.replace(/^.*Coming Soon.*\r?\n?/gim, '');

  // remove JSX components like <ComingSoon /> on a line by itself
  updated = updated.replace(/^\s*<ComingSoon[^>]*\/>\s*\r?\n?/gim, '');

  // remove basic "coming soon" headings like ## Coming Soon
  updated = updated.replace(/^\s*#+\s*Coming Soon.*\r?\n?/gim, '');

  return updated;
}

function main() {
  console.log("🔍 Scanning for 'Coming Soon' placeholders...\n");
  const files = ROOT_DIRS.flatMap((d) => walk(path.join(process.cwd(), d)));

  let totalFound = 0;
  let totalChanged = 0;

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');

    if (!hasComingSoon(original)) continue;
    totalFound++;

    const cleaned = cleanContent(original);

    if (cleaned !== original) {
      fs.writeFileSync(file, cleaned, 'utf8');
      totalChanged++;
      console.log('✅ Cleaned:', path.relative(process.cwd(), file));
    } else {
      console.log(
        "ℹ️ Found 'Coming Soon' but did not auto-clean:",
        path.relative(process.cwd(), file),
      );
    }
  }

  console.log('\n------');
  console.log("Files containing 'Coming Soon':", totalFound);
  console.log('Files auto-cleaned:', totalChanged);
  console.log('Review with `git diff` to confirm everything looks good.');
}

main();
