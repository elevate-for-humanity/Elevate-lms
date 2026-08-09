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

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    // Next.js private folders are implementation-only and do not create routes.
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

if (duplicateCount > 0) {
  console.error(`\nFound ${duplicateCount} duplicate App Router route(s) across ${roots.length} app root(s).`);
  process.exit(1);
}

console.log(`\nNo exact duplicate App Router page/route collisions found across ${roots.length} app root(s).`);
