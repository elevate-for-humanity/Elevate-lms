#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const appRoots = {
  legacy: 'app',
  marketing: 'apps/marketing/app',
  lms: 'apps/lms/app',
  admin: 'apps/admin/app',
};

const roots = Object.entries(appRoots).filter(([, root]) => {
  try {
    return statSync(root).isDirectory();
  } catch {
    return false;
  }
});

const pageFilePattern = /^page\.(tsx|ts|jsx|js|mdx)$/;
const routeFilePattern = /^route\.(tsx|ts|jsx|js)$/;
const routeGroups = /^\(.+\)$/;
const parallelRoutes = /^@.+$/;
const dynamicSegment = /^\[.*\]$/;

// These are naming aliases that have historically represented the same platform
// responsibility even when the URL is different. They are deliberately narrow:
// semantic matches are review candidates, not automatic redirects or failures.
const semanticAliases = new Map([
  ['students', 'learner'],
  ['student', 'learner'],
  ['learners', 'learner'],
  ['participants', 'learner'],
  ['participant', 'learner'],
  ['enroll', 'application'],
  ['enrollment', 'application'],
  ['enrollments', 'application'],
  ['apply', 'application'],
  ['applications', 'application'],
  ['host-shops', 'host-site'],
  ['host-shop', 'host-site'],
  ['host-sites', 'host-site'],
  ['host-site', 'host-site'],
  ['employers', 'employer'],
  ['partners', 'partner'],
  ['case-managers', 'case-manager'],
  ['case-manager', 'case-manager'],
  ['workforce-board', 'workforce'],
  ['workforce-partner', 'workforce'],
  ['workforce-partners', 'workforce'],
  ['portals', 'portal'],
  ['dashboards', 'dashboard'],
]);

const weakSegments = new Set([
  '',
  'page',
  'index',
  'dashboard',
  'portal',
  'home',
  'manage',
  'management',
  'admin',
  'app',
]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('_')) continue;

    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (pageFilePattern.test(entry) || routeFilePattern.test(entry)) out.push(full);
  }
  return out;
}

function urlFor(root, file) {
  const rel = relative(root, file).split(sep);
  rel.pop();
  const segments = rel.filter(
    (segment) => !routeGroups.test(segment) && !parallelRoutes.test(segment),
  );
  const url = `/${segments.join('/')}`.replace(/\/+/g, '/');
  return url === '/' ? '/' : url.replace(/\/$/, '');
}

function kindFor(file) {
  return pageFilePattern.test(file.split(sep).pop() ?? '') ? 'page' : 'route';
}

function isRedirectOnly(source) {
  const hasRedirect = /\b(?:redirect|permanentRedirect)\s*\(/.test(source);
  const hasJsxReturn = /return\s*\(\s*</.test(source);
  return hasRedirect && !hasJsxReturn;
}

function implementationHash(source) {
  const normalized = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  return createHash('sha256').update(normalized).digest('hex');
}

function normalizeSemanticSegment(segment) {
  const clean = segment.toLowerCase().replace(/^\[+|\]+$/g, '');
  return semanticAliases.get(clean) ?? clean;
}

function semanticTokens(url) {
  return url
    .split('/')
    .filter(Boolean)
    .filter((segment) => !dynamicSegment.test(segment))
    .map(normalizeSemanticSegment)
    .filter((segment) => !weakSegments.has(segment));
}

function semanticSignature(url) {
  const tokens = [...new Set(semanticTokens(url))].sort();
  return tokens.join('|');
}

function tokenOverlap(a, b) {
  const left = new Set(semanticTokens(a));
  const right = new Set(semanticTokens(b));
  if (left.size === 0 || right.size === 0) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / Math.min(left.size, right.size);
}

const records = [];
for (const [app, root] of roots) {
  for (const file of walk(root)) {
    const source = readFileSync(file, 'utf8');
    records.push({
      app,
      root,
      file,
      kind: kindFor(file),
      url: urlFor(root, file),
      source,
      redirectOnly: isRedirectOnly(source),
      hash: implementationHash(source),
      semanticSignature: semanticSignature(urlFor(root, file)),
    });
  }
}

let duplicateCount = 0;
for (const [app, root] of roots) {
  const byKindAndUrl = new Map();
  for (const record of records.filter((item) => item.app === app)) {
    const key = `${record.kind}:${record.url}`;
    const files = byKindAndUrl.get(key) ?? [];
    files.push(record.file);
    byKindAndUrl.set(key, files);
  }

  for (const [key, files] of byKindAndUrl.entries()) {
    if (files.length <= 1) continue;
    duplicateCount += 1;
    const splitAt = key.indexOf(':');
    const kind = key.slice(0, splitAt);
    const url = key.slice(splitAt + 1);
    console.error(`Duplicate ${kind} route in ${root}: ${url}`);
    for (const file of files) console.error(`  - ${file}`);
  }
}

const crossAppOverlaps = new Map();
for (const record of records) {
  const key = `${record.kind}:${record.url}`;
  const items = crossAppOverlaps.get(key) ?? [];
  items.push(record);
  crossAppOverlaps.set(key, items);
}

const overlappingRoutes = [...crossAppOverlaps.entries()].filter(([, items]) => {
  const apps = new Set(items.map((item) => item.app));
  return apps.size > 1;
});

const byHash = new Map();
for (const record of records) {
  if (record.kind !== 'page' || record.redirectOnly || record.source.length < 400) continue;
  const items = byHash.get(record.hash) ?? [];
  items.push(record);
  byHash.set(record.hash, items);
}

const clonedImplementations = [...byHash.values()].filter((items) => {
  const routeKeys = new Set(items.map((item) => `${item.app}:${item.url}`));
  return routeKeys.size > 1;
});

const activePages = records.filter(
  (record) => record.kind === 'page' && !record.redirectOnly && record.semanticSignature,
);

const semanticGroups = new Map();
for (const record of activePages) {
  const items = semanticGroups.get(record.semanticSignature) ?? [];
  items.push(record);
  semanticGroups.set(record.semanticSignature, items);
}

const semanticDuplicateCandidates = [...semanticGroups.entries()]
  .filter(([, items]) => {
    const routeKeys = new Set(items.map((item) => `${item.app}:${item.url}`));
    return routeKeys.size > 1;
  })
  .sort((a, b) => b[1].length - a[1].length);

const fuzzyCandidates = [];
for (let leftIndex = 0; leftIndex < activePages.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < activePages.length; rightIndex += 1) {
    const left = activePages[leftIndex];
    const right = activePages[rightIndex];
    if (left.semanticSignature === right.semanticSignature) continue;
    if (left.app === right.app && left.url === right.url) continue;

    const overlap = tokenOverlap(left.url, right.url);
    if (overlap < 1) continue;

    // Require at least one meaningful semantic token and keep this as a report-only
    // candidate. This catches nested variants such as /case-manager/participants and
    // /workforce/participants without treating every dashboard as equivalent.
    const leftTokens = semanticTokens(left.url);
    const rightTokens = semanticTokens(right.url);
    if (Math.min(leftTokens.length, rightTokens.length) === 0) continue;

    fuzzyCandidates.push({ left, right, overlap });
  }
}

console.log('\nPlatform route inventory:');
for (const [app, root] of roots) {
  const appRecords = records.filter((item) => item.app === app);
  const pages = appRecords.filter((item) => item.kind === 'page').length;
  const apiRoutes = appRecords.filter((item) => item.kind === 'route').length;
  console.log(`- ${app} (${root}): ${pages} pages, ${apiRoutes} route handlers`);
}
console.log(`- total: ${records.length} page/route files`);

if (overlappingRoutes.length > 0) {
  console.log(`\nCross-app URL overlaps to classify: ${overlappingRoutes.length}`);
  for (const [key, items] of overlappingRoutes) {
    console.log(`- ${key}`);
    for (const item of items) console.log(`  - ${item.app}: ${item.file}`);
  }
}

if (clonedImplementations.length > 0) {
  console.log(`\nExact implementation clones at different routes to review: ${clonedImplementations.length}`);
  for (const items of clonedImplementations) {
    console.log('- clone group');
    for (const item of items) console.log(`  - ${item.app}:${item.url} -> ${item.file}`);
  }
}

if (semanticDuplicateCandidates.length > 0) {
  console.log(`\nSemantic route families to classify: ${semanticDuplicateCandidates.length}`);
  for (const [signature, items] of semanticDuplicateCandidates) {
    console.log(`- ${signature}`);
    for (const item of items) console.log(`  - ${item.app}:${item.url} -> ${item.file}`);
  }
}

if (fuzzyCandidates.length > 0) {
  console.log(`\nNested/alias route candidates to review: ${fuzzyCandidates.length}`);
  for (const { left, right } of fuzzyCandidates) {
    console.log(`- ${left.app}:${left.url}`);
    console.log(`  ${right.app}:${right.url}`);
  }
}

if (duplicateCount > 0) {
  console.error(`\nFound ${duplicateCount} duplicate App Router route(s) across ${roots.length} app root(s).`);
  process.exit(1);
}

console.log(`\nNo exact duplicate App Router page/route collisions found across ${roots.length} app root(s).`);
