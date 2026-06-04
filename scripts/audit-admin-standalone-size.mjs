#!/usr/bin/env node
/**
 * Report disk usage of heavy packages in admin standalone output.
 * Run after: cd apps/admin && pnpm exec next build && node ../../scripts/prune-admin-standalone.mjs
 */

import { readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

const STANDALONE = resolve('apps/admin/.next/standalone');
const NODE_MODULES = join(STANDALONE, 'node_modules');

const WATCH = [
  'playwright',
  'puppeteer',
  'puppeteer-core',
  '@remotion',
  'remotion',
  '@rspack',
  'tesseract.js',
  'pdf-parse',
  'sharp',
  'typescript',
  '@next',
  '.pnpm',
];

async function dirSize(dir) {
  let total = 0;
  if (!existsSync(dir)) return 0;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) total += await dirSize(p);
    else {
      const s = await stat(p);
      total += s.size;
    }
  }
  return total;
}

function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function main() {
  if (!existsSync(STANDALONE)) {
    console.error('Missing', STANDALONE, '— run apps/admin next build first');
    process.exit(1);
  }

  const total = await dirSize(STANDALONE);
  console.log(`Admin standalone total: ${mb(total)} (${STANDALONE})`);
  console.log('');

  if (!existsSync(NODE_MODULES)) {
    console.log('No node_modules in standalone');
    return;
  }

  const top = [];
  for (const name of await readdir(NODE_MODULES)) {
    if (name === '.pnpm') {
      top.push({ name: '.pnpm', bytes: await dirSize(join(NODE_MODULES, name)) });
      continue;
    }
    if (!WATCH.some((w) => name === w || name.startsWith(w.replace('@', '')))) continue;
    top.push({ name, bytes: await dirSize(join(NODE_MODULES, name)) });
  }

  top.sort((a, b) => b.bytes - a.bytes);
  for (const { name, bytes } of top) {
    console.log(`  ${name.padEnd(24)} ${mb(bytes)}`);
  }

  const dupes = ['playwright', 'puppeteer', 'puppeteer-core'];
  const found = dupes.filter((d) => existsSync(join(NODE_MODULES, d)));
  if (found.length) {
    console.log('');
    console.warn('⚠️  Browser automation in admin standalone (should be 0):', found.join(', '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
