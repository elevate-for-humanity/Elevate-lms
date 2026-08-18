#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files'], { encoding: 'utf8' })
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const files = trackedFiles();
const warnings = [];

const suspicious = [
  /(^|\/)\.DS_Store$/,
  /(^|\/)Thumbs\.db$/i,
  /\.(tmp|temp|bak|backup|swp|swo)$/i,
  /(^|\/)npm-debug\.log/i,
  /(^|\/)yarn-(debug|error)\.log/i,
  /(^|\/)coverage\//,
  /(^|\/)test-results\//,
  /(^|\/)playwright-report\//,
  /(^|\/)node_modules\//,
  /(^|\/)\.next\//,
];

for (const file of files) {
  if (suspicious.some((pattern) => pattern.test(file))) {
    warnings.push(`tracked generated/temp artifact: ${file}`);
  }
}

let gitignore = '';
try {
  gitignore = readFileSync('.gitignore', 'utf8');
} catch {
  warnings.push('.gitignore is missing');
}

if (gitignore) {
  const normalized = gitignore
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  const counts = new Map();
  for (const line of normalized) counts.set(line, (counts.get(line) ?? 0) + 1);
  for (const [line, count] of counts) {
    if (count > 1) warnings.push(`duplicate .gitignore rule (${count}x): ${line}`);
  }

  const contradictions = [
    ['dist/', '!dist/**'],
    ['logs/', '!logs/**/*.log'],
    ['public/videos/**/*.mp4', '!public/videos/*.mp4'],
  ];
  for (const [ignore, unignore] of contradictions) {
    if (normalized.includes(ignore) && normalized.includes(unignore)) {
      warnings.push(`review .gitignore exception pair: ${ignore} ↔ ${unignore}`);
    }
  }
}

const rootDocs = files.filter((file) => !file.includes('/') && /\.md$/i.test(file));
if (rootDocs.length > 12) {
  warnings.push(`root contains ${rootDocs.length} Markdown files; consider consolidating historical audits under docs/`);
}

console.log(`Repository hygiene audit: ${files.length} tracked files scanned.`);
if (!warnings.length) {
  console.log('✅ No hygiene warnings detected.');
  process.exit(0);
}

console.log(`⚠️ ${warnings.length} hygiene warning(s):`);
for (const warning of warnings) console.log(` - ${warning}`);
console.log('Advisory only: this audit never deletes files and does not fail CI.');
