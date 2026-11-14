#!/usr/bin/env node
/**
 * Fix INCONSISTENT_CONTAINER violations.
 * Replaces non-standard max-w-[Npx] and max-w-8xl/9xl/10xl with max-w-7xl.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts', 'design-enforcer-report.json'), 'utf8'));
const findings = report.findings ?? [];

const affectedFiles = [...new Set(
  findings.filter(f => f.code === 'INCONSISTENT_CONTAINER').map(f => f.file)
)];

let fixedFiles = 0;
let fixedCount = 0;

for (const relPath of affectedFiles) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) continue;

  let content = fs.readFileSync(absPath, 'utf8');
  const original = content;

  // max-w-[Npx] → max-w-7xl
  content = content.replace(/\bmax-w-\[\d+px\]/g, 'max-w-7xl');
  // max-w-8xl, max-w-9xl, max-w-10xl → max-w-7xl
  content = content.replace(/\bmax-w-(8xl|9xl|10xl)\b/g, 'max-w-7xl');

  if (content !== original) {
    fs.writeFileSync(absPath, content, 'utf8');
    fixedFiles++;
    fixedCount += findings.filter(f => f.code === 'INCONSISTENT_CONTAINER' && f.file === relPath).length;
  }
}

console.log(`Fixed container widths in ${fixedCount} locations across ${fixedFiles} files`);
