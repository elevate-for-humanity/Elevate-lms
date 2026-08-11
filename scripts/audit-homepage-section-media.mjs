#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const HOME_PAGE = path.join(ROOT, 'apps/marketing/app/page.tsx');
const REUSABLE_MEDIA = /(?:logo|favicon|icon|badge|seal|partner|sponsor|credential|certification|qr|avatar|placeholder)/i;
const ASSET_RE = /['"](\/(?:images|uploads|media)\/[^'"\s)]+)['"]/g;

if (!fs.existsSync(HOME_PAGE)) {
  console.error('FAIL: Marketing homepage source is missing.');
  process.exit(1);
}

const homeSource = fs.readFileSync(HOME_PAGE, 'utf8');
const sectionFiles = new Set();
for (const match of homeSource.matchAll(/from\s+['"]@\/components\/home\/([^'"]+)['"]/g)) {
  const base = path.join(ROOT, 'components/home', match[1]);
  const candidates = path.extname(base)
    ? [base]
    : [`${base}.tsx`, `${base}.ts`, `${base}.jsx`, `${base}.js`, path.join(base, 'index.tsx')];
  const resolved = candidates.find((candidate) => fs.existsSync(candidate));
  if (resolved) sectionFiles.add(resolved);
}

const uses = new Map();
const withinComponent = [];
for (const file of sectionFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const localCounts = new Map();
  for (const match of source.matchAll(ASSET_RE)) {
    const asset = match[1].split(/[?#]/)[0];
    if (REUSABLE_MEDIA.test(asset)) continue;
    localCounts.set(asset, (localCounts.get(asset) ?? 0) + 1);
    const files = uses.get(asset) ?? new Set();
    files.add(path.relative(ROOT, file).replaceAll('\\', '/'));
    uses.set(asset, files);
  }
  for (const [asset, count] of localCounts) {
    if (count > 1) {
      withinComponent.push({
        asset,
        count,
        file: path.relative(ROOT, file).replaceAll('\\', '/'),
      });
    }
  }
}

const crossSection = [...uses.entries()]
  .filter(([, files]) => files.size > 1)
  .map(([asset, files]) => ({ asset, files: [...files] }));

console.log('Homepage section media audit');
console.log(`- live homepage section components checked: ${sectionFiles.size}`);
console.log(`- duplicate non-brand assets inside a section: ${withinComponent.length}`);
console.log(`- duplicate non-brand assets across sections: ${crossSection.length}`);

for (const item of withinComponent) {
  console.error(`- ${item.asset} appears ${item.count} times in ${item.file}`);
}
for (const item of crossSection) {
  console.error(`- ${item.asset} is reused across: ${item.files.join(', ')}`);
}

if (withinComponent.length || crossSection.length) {
  console.error('FAIL: the live homepage reuses non-brand imagery across visible sections.');
  process.exit(1);
}

console.log('PASS: live homepage section imagery is unique.');
