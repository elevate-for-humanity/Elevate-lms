#!/usr/bin/env node
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const roots = [
  'app',
  'apps/marketing/app',
  'apps/lms/app',
  'apps/admin/app',
].filter((root) => {
  try { return statSync(root).isDirectory(); } catch { return false; }
});

const pageFilePattern = /^page\.(tsx|ts|jsx|js|mdx)$/;
const routeFilePattern = /^route\.(tsx|ts|jsx|js)$/;
const routeGroups = /^\(.+\)$/;
const parallelRoutes = /^@.+$/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue;
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
  const segments = rel.filter((segment) => !routeGroups.test(segment) && !parallelRoutes.test(segment));
  const url = `/${segments.join('/')}`.replace(/\/+/g, '/');
  return url === '/' ? '/' : url.replace(/\/$/, '');
}

let duplicateCount = 0;
for (const root of roots) {
  const byKindAndUrl = new Map();
  for (const file of walk(root)) {
    const kind = pageFilePattern.test(file.split(sep).pop() ?? '') ? 'page' : 'route';
    const key = `${kind}:${urlFor(root, file)}`;
    const files = byKindAndUrl.get(key) ?? [];
    files.push(file);
    byKindAndUrl.set(key, files);
  }

  for (const [key, files] of byKindAndUrl.entries()) {
    if (files.length <= 1) continue;
    duplicateCount += 1;
    const [kind, url] = key.split(':');
    console.error(`Duplicate ${kind} route in ${root}: ${url}`);
    for (const file of files) console.error(`  - ${file}`);
  }
}

if (duplicateCount > 0) {
  console.error(`Found ${duplicateCount} duplicate App Router route(s) across ${roots.length} app root(s).`);
  process.exit(1);
}

console.log(`No duplicate App Router page/route files found across ${roots.length} app root(s).`);
