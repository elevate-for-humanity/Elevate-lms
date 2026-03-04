#!/usr/bin/env npx tsx
/**
 * Image Link Checker
 *
 * Scans source files for /images/ references and verifies each
 * resolves to a file in public/. Run locally or in CI.
 *
 * Usage: npx tsx scripts/check-image-links.ts
 * Exit code: 0 = all links valid, 1 = broken links found
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const SCAN_DIRS = ['app', 'components', 'data'];
const EXTENSIONS = ['.tsx', '.jsx', '.ts'];

// Files that use external URLs intentionally
const EXCLUDE_FILES = [
  /preview\/\[previewId\]/,
  /api\/ai-studio\/stock-media/,
  /node_modules/,
  /\.test\./,
  /\.spec\./,
];

interface BrokenLink {
  file: string;
  line: number;
  imagePath: string;
}

// Match strings like '/images/pages/foo.jpg' or "/images/icons/bar.svg"
const IMAGE_REF_PATTERN = /['"`](\/(images\/[^'"`\s?#]+))['"` ]/g;

function scanFile(filePath: string): BrokenLink[] {
  const broken: BrokenLink[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Skip comments
    if (/^\s*\/\//.test(line) || /^\s*\/\*/.test(line) || /^\s*\*/.test(line)) return;

    let match;
    IMAGE_REF_PATTERN.lastIndex = 0;

    while ((match = IMAGE_REF_PATTERN.exec(line)) !== null) {
      const imgPath = match[1]; // e.g. /images/pages/foo.jpg
      const diskPath = path.join(PUBLIC_DIR, imgPath);

      if (!fs.existsSync(diskPath)) {
        broken.push({
          file: path.relative(ROOT, filePath),
          line: idx + 1,
          imagePath: imgPath,
        });
      }
    }
  });

  return broken;
}

function walk(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (EXCLUDE_FILES.some((p) => p.test(full))) continue;

    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (entry.isFile() && EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }

  return files;
}

function main() {
  console.log('Checking image links...\n');

  const allBroken: BrokenLink[] = [];

  for (const scanDir of SCAN_DIRS) {
    const files = walk(path.join(ROOT, scanDir));
    for (const file of files) {
      allBroken.push(...scanFile(file));
    }
  }

  if (allBroken.length === 0) {
    console.log(`✅ All image references resolve to files in public/.\n`);
    process.exit(0);
  }

  console.log(`❌ Found ${allBroken.length} broken image link(s):\n`);

  // Group by file
  const byFile: Record<string, BrokenLink[]> = {};
  allBroken.forEach((b) => {
    if (!byFile[b.file]) byFile[b.file] = [];
    byFile[b.file].push(b);
  });

  Object.entries(byFile).forEach(([file, links]) => {
    console.log(`  ${file}`);
    links.forEach((l) => {
      console.log(`    L${l.line}: ${l.imagePath}`);
    });
  });

  console.log(`\n${allBroken.length} image path(s) reference files that don't exist in public/.`);
  process.exit(1);
}

main();
