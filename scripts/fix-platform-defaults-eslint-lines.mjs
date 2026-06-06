#!/usr/bin/env node
/**
 * Fix PLATFORM_DEFAULTS leaks flagged by ESLint no-restricted-syntax on specific lines only.
 * Safer than whole-file regex — avoids breaking unrelated quoted strings.
 *
 * Usage: pnpm eslint ... --format json -o /tmp/eslint.json && node scripts/fix-platform-defaults-eslint-lines.mjs /tmp/eslint.json
 */
import { readFileSync, writeFileSync } from 'node:fs';

const reportPath = process.argv[2] || '/tmp/eslint.json';
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

function fixLine(line) {
  let next = line;
  next = next.replace(
    /'([^'\\]|\\.)*\$\{PLATFORM_DEFAULTS([^'\\]|\\.)*'/g,
    (match) => `\`${match.slice(1, -1)}\``,
  );
  next = next.replace(
    /"([^"\\]|\\.)*\$\{PLATFORM_DEFAULTS([^"\\]|\\.)*"/g,
    (match) => `\`${match.slice(1, -1)}\``,
  );
  // JSX attribute: href=`...` → href={`...`}
  next = next.replace(
    /\b(href|title|alt|placeholder|from|subject|to)=`([^`]+)`/g,
    '$1={`$2`}',
  );
  return next;
}

let fixed = 0;
for (const file of report) {
  const lines = readFileSync(file.filePath, 'utf8').split('\n');
  let dirty = false;
  for (const msg of file.messages) {
    if (msg.ruleId !== 'no-restricted-syntax') continue;
    const i = msg.line - 1;
    const after = fixLine(lines[i]);
    if (after !== lines[i]) {
      lines[i] = after;
      dirty = true;
      fixed++;
      console.log(`${file.filePath}:${msg.line}`);
    }
  }
  if (dirty) writeFileSync(file.filePath, lines.join('\n'));
}
console.log(`\n${fixed} line(s) updated`);
