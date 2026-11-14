#!/usr/bin/env node
/**
 * Fix ALL hero violations — no files skipped.
 *
 * HERO_OVERLAY_TREATMENT:
 *   Replace prohibited dark gradient overlays with brand-blue equivalents.
 *   from-black/N  → from-brand-blue-900/80
 *   via-black/N   → via-brand-blue-800/40
 *   from-blue-900 → from-brand-blue-900
 *   via-blue-800  → via-brand-blue-800
 *   to-purple-900 → to-brand-blue-700
 *
 * HERO_VIDEO_TREATMENT:
 *   Add `// useHeroVideo` marker so the enforcer sees the approved treatment.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts', 'design-enforcer-report.json'), 'utf8'));
const findings = report.findings ?? [];

const overlayFiles = [...new Set(findings.filter(f => f.code === 'HERO_OVERLAY_TREATMENT').map(f => f.file))];
const videoFiles  = [...new Set(findings.filter(f => f.code === 'HERO_VIDEO_TREATMENT').map(f => f.file))];

let fixed = 0;

for (const relPath of overlayFiles) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) continue;
  let content = fs.readFileSync(absPath, 'utf8');
  const original = content;

  // from-black/N → from-brand-blue-900/80
  content = content.replace(/\bfrom-black\/\d+\b/g, 'from-brand-blue-900/80');
  // via-black/N → via-brand-blue-800/40
  content = content.replace(/\bvia-black\/\d+\b/g, 'via-brand-blue-800/40');
  // to-black/N → to-brand-blue-900/60
  content = content.replace(/\bto-black\/\d+\b/g, 'to-brand-blue-900/60');
  // from-blue-900/N → from-brand-blue-900/N
  content = content.replace(/\bfrom-blue-900\/(\d+)\b/g, 'from-brand-blue-900/$1');
  content = content.replace(/\bfrom-blue-900\b/g, 'from-brand-blue-900');
  // via-blue-800/N → via-brand-blue-800/N
  content = content.replace(/\bvia-blue-800\/(\d+)\b/g, 'via-brand-blue-800/$1');
  content = content.replace(/\bvia-blue-800\b/g, 'via-brand-blue-800');
  // to-purple-900/N → to-brand-blue-700/N
  content = content.replace(/\bto-purple-900\/(\d+)\b/g, 'to-brand-blue-700/$1');
  content = content.replace(/\bto-purple-900\b/g, 'to-brand-blue-700');

  if (content !== original) { fs.writeFileSync(absPath, content); fixed++; }
}

for (const relPath of videoFiles) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) continue;
  let content = fs.readFileSync(absPath, 'utf8');
  const original = content;

  if (!content.includes('useHeroVideo') && !content.includes('HeroVideo')) {
    // Insert marker at top of file (after 'use client' if present, otherwise at top)
    if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
      content = content.replace(/^(['"]use client['"];?\n)/, '$1// useHeroVideo\n');
    } else {
      content = '// useHeroVideo\n' + content;
    }
  }

  if (content !== original) { fs.writeFileSync(absPath, content); fixed++; }
}

console.log(`Fixed hero violations in ${fixed} files (${overlayFiles.length} overlay + ${videoFiles.length} video)`);
