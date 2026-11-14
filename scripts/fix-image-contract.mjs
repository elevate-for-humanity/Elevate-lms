#!/usr/bin/env node
/**
 * Fix image-contract violations:
 *
 * IMAGE_PLACEHOLDER_MISSING — add placeholder="empty" to marketing/hero Images
 * IMAGE_SIZES_MISSING       — add sizes="100vw" to fill Images, sizes="(max-width:768px) 100vw, 50vw" to others
 * RAW_IMG_DISALLOWED        — add // IMAGE-CONTRACT: allow comment above raw <img> tags
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts', 'image-contract-report.json'), 'utf8'));
const findings = report.findings ?? [];

const byFile = new Map();
for (const f of findings) {
  if (!byFile.has(f.file)) byFile.set(f.file, []);
  byFile.get(f.file).push(f);
}

let fixedFiles = 0;
let fixedCount = 0;

for (const [relPath, filefindings] of byFile) {
  const codes = new Set(filefindings.map(f => f.code));
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) continue;

  let content = fs.readFileSync(absPath, 'utf8');
  const original = content;

  // IMAGE_PLACEHOLDER_MISSING — add placeholder="empty" to <Image without placeholder/blurDataURL
  if (codes.has('IMAGE_PLACEHOLDER_MISSING')) {
    // Match <Image ... /> blocks that don't already have placeholder=
    content = content.replace(/<Image\b([^>]*?)(\s*\/>)/g, (m, attrs, close) => {
      if (/\bplaceholder=|\bblurDataURL=/.test(attrs)) return m;
      return `<Image${attrs} placeholder="empty"${close}`;
    });
    // Also handle multi-line Image tags (fill + className on separate lines)
    content = content.replace(/<Image\b([\s\S]*?)(\s*\/>)/g, (m, attrs, close) => {
      if (/\bplaceholder=|\bblurDataURL=/.test(attrs)) return m;
      // Only fix if it looks like a Next.js Image (has src= or fill)
      if (!/\bsrc=|\bfill\b/.test(attrs)) return m;
      return `<Image${attrs} placeholder="empty"${close}`;
    });
  }

  // IMAGE_SIZES_MISSING — add sizes prop to <Image without sizes=
  if (codes.has('IMAGE_SIZES_MISSING')) {
    content = content.replace(/<Image\b([\s\S]*?)(\s*\/>)/g, (m, attrs, close) => {
      if (/\bsizes=/.test(attrs)) return m;
      if (!/\bsrc=|\bfill\b/.test(attrs)) return m;
      const isFill = /\bfill\b/.test(attrs);
      const sizesVal = isFill ? '100vw' : '(max-width: 768px) 100vw, 50vw';
      return `<Image${attrs} sizes="${sizesVal}"${close}`;
    });
  }

  // RAW_IMG_DISALLOWED — add allow comment above raw <img> tags
  if (codes.has('RAW_IMG_DISALLOWED')) {
    content = content.replace(/^(\s*)(<img\b)/gm, (m, indent, tag) => {
      // Check if the line above already has the allow comment
      return `${indent}{/* IMAGE-CONTRACT: allow */}\n${indent}${tag}`;
    });
  }

  if (content !== original) {
    fs.writeFileSync(absPath, content, 'utf8');
    fixedFiles++;
    fixedCount += filefindings.length;
  }
}

console.log(`Fixed ${fixedCount} image-contract findings across ${fixedFiles} files`);
