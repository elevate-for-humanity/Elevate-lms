#!/usr/bin/env node
/**
 * Convert broken single-quoted strings like '${PLATFORM_DEFAULTS.siteUrl}/path'
 * to template literals `${PLATFORM_DEFAULTS.siteUrl}/path`.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_DIRS = ['app', 'apps', 'components', 'lib'].map((d) => join(ROOT, d));

const LEAK = /'[^'\\]*\$\{PLATFORM_DEFAULTS\.[a-zA-Z0-9_]+\}[^'\\]*'/g;

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      walk(p, out);
    } else if (/\.(ts|tsx|js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

function fixContent(content) {
  return content.replace(LEAK, (match) => {
    const inner = match.slice(1, -1);
    return `\`${inner}\``;
  });
}

let changed = 0;
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const before = readFileSync(file, 'utf8');
    const after = fixContent(before);
    if (after !== before) {
      writeFileSync(file, after);
      console.log('fixed', relative(ROOT, file));
      changed++;
    }
  }
}
console.log(`\n${changed} file(s) updated`);
