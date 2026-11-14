#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const HOME_PAGE = path.join(ROOT, 'apps/marketing/app/page.tsx');
const COMPONENT_ROOT = path.join(ROOT, 'components');
const REUSABLE_MEDIA = /(?:logo|favicon|icon|badge|seal|partner|sponsor|credential|certification|qr|avatar|placeholder)/i;
const ASSET_RE = /['"](\/(?:images|uploads|media)\/[^'"\s)]+)['"]/g;
const IMPORT_RE = /from\s+['"]([^'"]+)['"]/g;

if (!fs.existsSync(HOME_PAGE)) {
  console.error('FAIL: Marketing homepage source is missing.');
  process.exit(1);
}

function resolveModule(fromFile, specifier) {
  let base;
  if (specifier.startsWith('@/components/')) {
    base = path.join(ROOT, specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    base = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null;
  }

  const candidates = path.extname(base)
    ? [base]
    : [
        `${base}.tsx`,
        `${base}.ts`,
        `${base}.jsx`,
        `${base}.js`,
        path.join(base, 'index.tsx'),
        path.join(base, 'index.ts'),
        path.join(base, 'index.jsx'),
        path.join(base, 'index.js'),
      ];

  const resolved = candidates.find((candidate) => fs.existsSync(candidate));
  if (!resolved) return null;

  const normalized = path.resolve(resolved);
  if (!normalized.startsWith(`${COMPONENT_ROOT}${path.sep}`)) return null;
  return normalized;
}

function collectComponentTree(rootFile) {
  const visited = new Set();
  const stack = [rootFile];

  while (stack.length) {
    const file = stack.pop();
    if (!file || visited.has(file)) continue;
    visited.add(file);

    const source = fs.readFileSync(file, 'utf8');
    IMPORT_RE.lastIndex = 0;
    for (const match of source.matchAll(IMPORT_RE)) {
      const resolved = resolveModule(file, match[1]);
      if (resolved && !visited.has(resolved)) stack.push(resolved);
    }
  }

  return visited;
}

function rootLabel(file) {
  return path.relative(ROOT, file).replaceAll('\\', '/');
}

const homeSource = fs.readFileSync(HOME_PAGE, 'utf8');
const sectionRoots = new Set();
for (const match of homeSource.matchAll(IMPORT_RE)) {
  const specifier = match[1];
  const isSection =
    specifier.startsWith('@/components/home/') ||
    specifier === '@/components/ui/HomeHeroVideo' ||
    specifier === '@/components/MarqueeBanner';
  if (!isSection) continue;

  const resolved = resolveModule(HOME_PAGE, specifier);
  if (resolved) sectionRoots.add(resolved);
}

const uses = new Map();
const withinSection = [];
const scannedFiles = new Set();

for (const rootFile of sectionRoots) {
  const root = rootLabel(rootFile);
  const tree = collectComponentTree(rootFile);
  const localCounts = new Map();
  const localFiles = new Map();

  for (const file of tree) {
    scannedFiles.add(file);
    const source = fs.readFileSync(file, 'utf8');
    ASSET_RE.lastIndex = 0;

    for (const match of source.matchAll(ASSET_RE)) {
      const asset = match[1].split(/[?#]/)[0];
      if (REUSABLE_MEDIA.test(asset)) continue;

      localCounts.set(asset, (localCounts.get(asset) ?? 0) + 1);
      const assetFiles = localFiles.get(asset) ?? new Set();
      assetFiles.add(rootLabel(file));
      localFiles.set(asset, assetFiles);

      const roots = uses.get(asset) ?? new Set();
      roots.add(root);
      uses.set(asset, roots);
    }
  }

  for (const [asset, count] of localCounts) {
    if (count > 1) {
      withinSection.push({
        asset,
        count,
        root,
        files: [...(localFiles.get(asset) ?? [])],
      });
    }
  }
}

const crossSection = [...uses.entries()]
  .filter(([, roots]) => roots.size > 1)
  .map(([asset, roots]) => ({ asset, roots: [...roots] }));

console.log('Homepage section media audit');
console.log(`- visible homepage section roots checked: ${sectionRoots.size}`);
console.log(`- transitive component files checked: ${scannedFiles.size}`);
console.log(`- duplicate non-brand assets inside a section tree: ${withinSection.length}`);
console.log(`- duplicate non-brand assets across visible sections: ${crossSection.length}`);

for (const item of withinSection) {
  console.error(
    `- ${item.asset} appears ${item.count} times under ${item.root}: ${item.files.join(', ')}`,
  );
}
for (const item of crossSection) {
  console.error(`- ${item.asset} is reused across: ${item.roots.join(', ')}`);
}

if (withinSection.length || crossSection.length) {
  console.error('FAIL: the live homepage reuses non-brand imagery across visible section trees.');
  process.exit(1);
}

console.log('PASS: live homepage section imagery is unique, including nested components.');
