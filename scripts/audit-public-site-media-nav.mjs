#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const findFiles = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

function collectImageRefs() {
  const files = findFiles(
    "find app components content data lib -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.json' \\) 2>/dev/null",
  );
  const refs = [];
  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(/['"](\/images\/[^'"\s)]+)['"]/g)) {
      refs.push({ file, path: match[1] });
    }
  }
  return refs;
}

function routeExists(href) {
  const clean = href.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  if (exists(path.join('app', clean, 'page.tsx'))) return true;
  const parts = clean.split('/').filter(Boolean);
  function walk(dir, index) {
    if (index === parts.length) return exists(path.join(dir, 'page.tsx'));
    if (!exists(dir)) return false;
    const entries = fs
      .readdirSync(path.join(root, dir), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    if (entries.includes(parts[index]) && walk(path.join(dir, parts[index]), index + 1))
      return true;
    return entries.some(
      (entry) => /^\[.*\]$/.test(entry) && walk(path.join(dir, entry), index + 1),
    );
  }
  return walk('app', 0);
}

function collectNavHrefs() {
  const nav = read('lib/navigation.ts');
  const hrefs = new Set();
  for (const match of nav.matchAll(/href:\s*['"]([^'"]+)['"]/g)) {
    if (match[1].startsWith('/')) hrefs.add(match[1]);
  }
  return [...hrefs].sort();
}

function collectHeroCoverage() {
  const routeFiles = collectNavHrefs()
    .map((href) => href.split(/[?#]/)[0].replace(/\/$/, '') || '/')
    .map((href) => path.join('app', href, 'page.tsx'))
    .filter((file) => exists(file));
  const missing = [];
  const heroPattern =
    /HeroVideo|HeroPicture|QualityHero|ProgramPageLayout|ProgramCategoryPage|<section[^>]+(?:Hero|hero|h-\[45vh\]|h-64|h-80)/s;
  for (const file of [...new Set(routeFiles)]) {
    const source = read(file);
    if (!heroPattern.test(source)) missing.push(file);
  }
  return missing.sort();
}

const imageRefs = collectImageRefs();
const missingImages = imageRefs.filter((ref) => !exists(path.join('public', ref.path)));
const navHrefs = collectNavHrefs();
const missingRoutes = navHrefs.filter((href) => !routeExists(href));
const missingHeroRouteFiles = collectHeroCoverage();

console.log('# Public Site Media + Navigation Audit');
console.log();
console.log(`- Image references checked: ${imageRefs.length}`);
console.log(`- Missing image files: ${missingImages.length}`);
console.log(`- Header/hamburger hrefs checked: ${navHrefs.length}`);
console.log(`- Missing app routes: ${missingRoutes.length}`);
console.log(
  `- Header-linked concrete page files without detectable hero pattern: ${missingHeroRouteFiles.length}`,
);
console.log();

if (missingImages.length) {
  console.log('## Missing Images');
  for (const item of missingImages) console.log(`- ${item.path} referenced in ${item.file}`);
  console.log();
}

if (missingRoutes.length) {
  console.log('## Missing Routes');
  for (const href of missingRoutes) console.log(`- ${href}`);
  console.log();
}

if (missingHeroRouteFiles.length) {
  console.log('## Header-Linked Concrete Pages Without Detected Hero');
  for (const file of missingHeroRouteFiles) console.log(`- ${file}`);
  console.log();
}
