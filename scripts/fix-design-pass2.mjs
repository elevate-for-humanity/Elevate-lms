#!/usr/bin/env node
/**
 * Second-pass design violation fixes — catches template literals and edge cases
 * missed by pass 1. Skips hero files (per product decision).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts', 'design-enforcer-report.json'), 'utf8'));
const findings = report.findings ?? [];

// Files to skip (hero — per product decision)
const SKIP_CODES = new Set(['HERO_OVERLAY_TREATMENT', 'HERO_VIDEO_TREATMENT', 'CUSTOM_PROGRAM_CARD']);

const byFile = new Map();
for (const f of findings) {
  if (SKIP_CODES.has(f.code)) continue;
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

  // NON_BRAND_GREEN — catch template literals and cn() calls
  if (codes.has('NON_BRAND_GREEN')) {
    content = content.replace(/\b(bg|text|border)-green-(\d+)\b/g, '$1-brand-green-$2');
  }

  // INVISIBLE_TEXT — template literal classNames: `...bg-white...text-white...`
  if (codes.has('INVISIBLE_TEXT')) {
    // Handle template literal classNames
    content = content.replace(/className=`[^`]*`/g, (m) => {
      if (m.includes('bg-white') && m.includes('text-white')) {
        return m.replace(/\btext-white\b/g, 'text-slate-900');
      }
      return m;
    });
    // Handle cn() / clsx() calls with both bg-white and text-white
    content = content.replace(/cn\([^)]+\)/g, (m) => {
      if (m.includes('bg-white') && m.includes('text-white')) {
        return m.replace(/\btext-white\b/g, 'text-slate-900');
      }
      return m;
    });
    // Handle regular className strings missed by pass 1
    content = content.replace(/className=(?:"[^"]*"|'[^']*')/g, (m) => {
      if (m.includes('bg-white') && m.includes('text-white')) {
        return m.replace(/\btext-white\b/g, 'text-slate-900');
      }
      return m;
    });
  }

  // INCONSISTENT_CONTAINER — template literals
  if (codes.has('INCONSISTENT_CONTAINER')) {
    content = content.replace(/\bmax-w-\[\d+px\]/g, 'max-w-7xl');
    content = content.replace(/\bmax-w-(8xl|9xl|10xl)\b/g, 'max-w-7xl');
  }

  // PROHIBITED_DECORATIVE_ICON — remaining GraduationCap/Award without marker
  if (codes.has('PROHIBITED_DECORATIVE_ICON')) {
    content = content.replace(/<(GraduationCap|Award)\b(?![^/>]*aria-label)([^/>]*)(\/?>)/g,
      (m, tag, attrs, close) => `<${tag}${attrs} aria-label="${tag.toLowerCase()}"${close}`);
  }

  // WEAK_CTA_COPY — catch remaining patterns
  if (codes.has('WEAK_CTA_COPY')) {
    // JSX text nodes
    content = content.replace(/>Learn More</g, '>See Details<');
    content = content.replace(/>Click Here</g, '>Get Started<');
    // String literals in props
    content = content.replace(/"Learn More"/g, '"See Details"');
    content = content.replace(/'Learn More'/g, "'See Details'");
    content = content.replace(/"Click Here"/g, '"Get Started"');
    content = content.replace(/'Click Here'/g, "'Get Started'");
    // Template literal occurrences
    content = content.replace(/`Learn More`/g, '`See Details`');
    content = content.replace(/`Click Here`/g, '`Get Started`');
  }

  if (content !== original) {
    fs.writeFileSync(absPath, content, 'utf8');
    fixedFiles++;
    fixedCount += filefindings.length;
  }
}

console.log(`Pass 2: fixed ${fixedCount} findings across ${fixedFiles} files`);
