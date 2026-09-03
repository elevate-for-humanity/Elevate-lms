#!/usr/bin/env node
/**
 * Fix JSX alt/title strings that contain literal {PLATFORM_DEFAULTS...} or ${PLATFORM_DEFAULTS...}
 * inside double-quoted attributes (should be template literals).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIRS = ['app', 'components'].map((d) => join(ROOT, d));

const LEAK =
  /(alt|title|aria-label|placeholder)=("(?:[^"\\]|\\.)*\{PLATFORM_DEFAULTS[^"]*"|'(?:[^'\\]|\\.)*\{PLATFORM_DEFAULTS[^']*')/g;

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      walk(p, out);
    } else if (/\.(tsx|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

function fixContent(content) {
  return content.replace(
    /(\b(?:alt|title|aria-label|placeholder)=)("([^"]*)")/g,
    (match, attr, _q, inner) => {
      if (!inner.includes('{PLATFORM_DEFAULTS') && !inner.includes('${PLATFORM_DEFAULTS')) {
        return match;
      }
      let fixed = inner
        .replace(/\{PLATFORM_DEFAULTS\.([a-zA-Z0-9_]+)\}/g, '${PLATFORM_DEFAULTS.$1}')
        .replace(/\$\{PLATFORM_DEFAULTS\.([a-zA-Z0-9_]+)\}/g, '${PLATFORM_DEFAULTS.$1}');
      return `${attr}{\`${fixed}\`}`;
    },
  );
}

let changed = 0;
for (const dir of DIRS) {
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
process.exit(0);
