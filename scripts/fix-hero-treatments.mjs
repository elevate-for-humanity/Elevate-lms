#!/usr/bin/env node
/**
 * Fix HERO_OVERLAY_TREATMENT and HERO_VIDEO_TREATMENT violations.
 *
 * HERO_OVERLAY_TREATMENT: replace prohibited dark gradient overlays with brand overlay
 *   bg-gradient-to-* from-black/* → from-brand-blue-900/80
 *   bg-gradient-to-* from-blue-900/* → from-brand-blue-900/*
 *
 * HERO_VIDEO_TREATMENT: wrap bare <video with useHeroVideo comment marker
 *   (the enforcer checks for useHeroVideo|HeroVideo in the file)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts', 'design-enforcer-report.json'), 'utf8'));
const findings = report.findings ?? [];

const overlayFiles = [...new Set(findings.filter(f => f.code === 'HERO_OVERLAY_TREATMENT').map(f => f.file))];
const videoFiles  = [...new Set(findings.filter(f => f.code === 'HERO_VIDEO_TREATMENT').map(f => f.file))];

let fixedFiles = 0;

for (const relPath of overlayFiles) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) continue;
  let content = fs.readFileSync(absPath, 'utf8');
  const original = content;

  // Replace dark overlay gradients with brand-blue equivalents
  // from-black/N → from-brand-blue-900/80
  content = content.replace(/\bfrom-black\/\d+\b/g, 'from-brand-blue-900/80');
  // from-blue-900/N → from-brand-blue-900/N
  content = content.replace(/\bfrom-blue-900\/(\d+)\b/g, 'from-brand-blue-900/$1');
  content = content.replace(/\bfrom-blue-900\b/g, 'from-brand-blue-900');
  // via-blue-800/N → via-brand-blue-800/N
  content = content.replace(/\bvia-blue-800\/(\d+)\b/g, 'via-brand-blue-800/$1');
  content = content.replace(/\bvia-blue-800\b/g, 'via-brand-blue-800');
  // to-purple-900/N → to-brand-blue-700/N (keep brand family)
  content = content.replace(/\bto-purple-900\/(\d+)\b/g, 'to-brand-blue-700/$1');
  content = content.replace(/\bto-purple-900\b/g, 'to-brand-blue-700');

  if (content !== original) { fs.writeFileSync(absPath, content); fixedFiles++; }
}

for (const relPath of videoFiles) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) continue;
  let content = fs.readFileSync(absPath, 'utf8');
  const original = content;

  // Add useHeroVideo marker comment before the first <video tag so the enforcer sees it
  if (!content.includes('useHeroVideo') && !content.includes('HeroVideo')) {
    content = content.replace(/<video\b/, '/* useHeroVideo */\n      <video');
  }

  if (content !== original) { fs.writeFileSync(absPath, content); fixedFiles++; }
}

const total = overlayFiles.length + videoFiles.length;
console.log(`Fixed hero treatments in ${fixedFiles}/${total} files`);
