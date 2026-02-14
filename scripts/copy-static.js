#!/usr/bin/env node
// Copy static HTML and front-end assets into the Vite dist folder for Netlify
// This ensures our many standalone HTML pages and shared assets are deployed.

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

const includeGlobs = [
  // HTML pages across the repo (exclude node_modules, dist)
  '**/*.html',
  // Key asset directories
  'images/**',
  'public/**',
  'shared/**',
  'ui/**',
  'app/**',
  // Styles
  '**/*.css',
];

const excludeDirs = new Set([
  'node_modules',
  '.git',
  '.github',
  'dist',
  'client/dist',
]);

function isExcluded(filePath) {
  const rel = path.relative(ROOT, filePath);
  const segments = rel.split(path.sep);
  return segments.some((seg) => excludeDirs.has(seg));
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fsp.copyFile(src, dest);
}

function match(globs, relPath) {
  // very small glob matcher for our patterns
  // supports **/*suffix and dir/** and exact file extensions
  return globs.some((g) => {
    if (g === '**/*.html') return relPath.endsWith('.html');
    if (g === '**/*.css') return relPath.endsWith('.css');
    if (g.endsWith('/**')) return relPath.startsWith(g.slice(0, -3));
    return relPath === g;
  });
}

async function walkAndCopy() {
  let copied = 0;
  async function walk(dir) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const abs = path.join(dir, ent.name);
      if (isExcluded(abs)) continue;
      const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
      if (ent.isDirectory()) {
        await walk(abs);
      } else if (match(includeGlobs, rel)) {
        // Don't overwrite the Vite-processed SPA entrypoint
        if (rel === 'index.html') continue;
        const dest = path.join(DIST, rel);
        await copyFile(abs, dest);
        copied++;
      }
    }
  }
  await ensureDir(DIST);
  await walk(ROOT);
}

walkAndCopy().catch((err) => {
  process.exit(1);
});
