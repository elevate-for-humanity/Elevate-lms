#!/usr/bin/env node
/**
 * Replace console.log / console.warn / console.error with logger in runtime paths.
 * Skips tests, _archived, scripts, and files that already import logger.
 *
 * Usage: node scripts/replace-console-with-logger.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry-run');
const SKIP_DIRS = new Set(['node_modules', '.next', '_archived', 'tests', 'dist', '.git']);
const TARGET_ROOTS = ['app', 'lib', 'components'];

let changed = 0;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts') && !name.endsWith('.spec.ts')) {
      files.push(full);
    }
  }
  return files;
}

function transform(file) {
  let src = readFileSync(file, 'utf8');
  if (!/\bconsole\.(log|warn|error)\(/.test(src)) return false;
  if (src.includes('eslint-disable') && src.includes('no-console')) return false;

  const needsLogger =
    /\bconsole\.(log|warn|error)\(/.test(src) && !/from ['"]@\/lib\/logger['"]/.test(src);

  let next = src
    .replace(/\bconsole\.log\(/g, 'logger.info(')
    .replace(/\bconsole\.warn\(/g, 'logger.warn(')
    .replace(/\bconsole\.error\(/g, 'logger.error(');

  if (needsLogger) {
    const importLine = "import { logger } from '@/lib/logger';\n";
    if (next.startsWith("'use client'") || next.startsWith('"use client"')) {
      const nl = next.indexOf('\n');
      next = `${next.slice(0, nl + 1)}${importLine}${next.slice(nl + 1)}`;
    } else if (next.startsWith("import 'server-only'")) {
      const nl = next.indexOf('\n');
      next = `${next.slice(0, nl + 1)}${importLine}${next.slice(nl + 1)}`;
    } else {
      next = `${importLine}${next}`;
    }
  }

  if (next === src) return false;
  if (!DRY) writeFileSync(file, next);
  changed += 1;
  return true;
}

for (const root of TARGET_ROOTS) {
  const base = path.join(ROOT, root);
  try {
    for (const file of walk(base)) transform(file);
  } catch {
    // missing dir
  }
}

console.log(DRY ? `[dry-run] Would update ${changed} files` : `Updated ${changed} files`);
