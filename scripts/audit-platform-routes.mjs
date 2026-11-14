#!/usr/bin/env node
/**
 * Full route inventory for Marketing, LMS, Admin, and Portal.
 *
 * Read-only by design. This script does not delete or rewrite anything.
 * It identifies:
 *   - every App Router page and URL
 *   - exact duplicate implementations (normalized content hash)
 *   - redirect-only routes
 *   - migration/placeholder pages
 *   - duplicate route leaf names across apps/namespaces
 *
 * Usage:
 *   node scripts/audit-platform-routes.mjs
 *   node scripts/audit-platform-routes.mjs --json
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const JSON_MODE = process.argv.includes('--json');

const APPS = [
  { name: 'marketing', root: 'apps/marketing/app' },
  { name: 'lms', root: 'apps/lms/app' },
  { name: 'admin', root: 'apps/admin/app' },
  { name: 'portal', root: 'apps/portal/app' },
  { name: 'legacy-root', root: 'app' },
].filter(({ root }) => fs.existsSync(path.join(ROOT, root)));

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function routeFromFile(appRoot, file) {
  let rel = path.relative(appRoot, file).replace(/\\/g, '/');
  rel = rel.replace(/\/page\.(tsx|ts|jsx|js)$/, '');
  rel = rel.replace(/(^|\/)\([^)]+\)(?=\/|$)/g, '');
  rel = rel.replace(/\/+/g, '/').replace(/^\//, '').replace(/\/$/, '');
  return rel ? `/${rel}` : '/';
}

function normalizeSource(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function contentHash(source) {
  return crypto.createHash('sha256').update(normalizeSource(source)).digest('hex').slice(0, 16);
}

function classify(source) {
  const redirect = /\b(?:redirect|permanentRedirect)\s*\(/.test(source);
  const placeholder = /being migrated|placeholder|coming soon|not implemented|under construction/i.test(source);
  const client = /['"]use client['"]/.test(source);
  const dynamic = /export\s+const\s+dynamic\s*=/.test(source);
  const metadata = /export\s+(?:const\s+metadata|async\s+function\s+generateMetadata|function\s+generateMetadata)/.test(source);
  return { redirect, placeholder, client, dynamic, metadata };
}

function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

const routes = [];
for (const app of APPS) {
  const absRoot = path.join(ROOT, app.root);
  for (const file of walk(absRoot)) {
    const source = fs.readFileSync(file, 'utf8');
    const route = routeFromFile(absRoot, file);
    routes.push({
      app: app.name,
      route,
      file: path.relative(ROOT, file).replace(/\\/g, '/'),
      leaf: route === '/' ? '/' : route.split('/').filter(Boolean).at(-1),
      hash: contentHash(source),
      bytes: Buffer.byteLength(source),
      ...classify(source),
    });
  }
}

routes.sort((a, b) => a.app.localeCompare(b.app) || a.route.localeCompare(b.route));

const exactDuplicates = [...groupBy(routes, (r) => r.hash).values()]
  .filter((group) => group.length > 1)
  .map((group) => group.map(({ app, route, file }) => ({ app, route, file })));

const leafDuplicates = [...groupBy(routes.filter((r) => r.leaf !== '/'), (r) => r.leaf).entries()]
  .filter(([, group]) => group.length > 1)
  .map(([leaf, group]) => ({
    leaf,
    routes: group.map(({ app, route, file, redirect, placeholder }) => ({ app, route, file, redirect, placeholder })),
  }))
  .sort((a, b) => b.routes.length - a.routes.length || a.leaf.localeCompare(b.leaf));

const redirectOnly = routes.filter((r) => r.redirect);
const placeholders = routes.filter((r) => r.placeholder);

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    pages: routes.length,
    byApp: Object.fromEntries(APPS.map((app) => [app.name, routes.filter((r) => r.app === app.name).length])),
    exactDuplicateGroups: exactDuplicates.length,
    duplicateLeafGroups: leafDuplicates.length,
    redirectPages: redirectOnly.length,
    placeholderPages: placeholders.length,
  },
  routes,
  exactDuplicates,
  duplicateLeaves: leafDuplicates,
  redirectOnly,
  placeholders,
};

if (JSON_MODE) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(0);
}

console.log('\n=== Elevate Platform Route Audit ===\n');
console.log(`Pages: ${report.totals.pages}`);
for (const [app, count] of Object.entries(report.totals.byApp)) console.log(`  ${app}: ${count}`);
console.log(`Exact duplicate implementation groups: ${exactDuplicates.length}`);
console.log(`Duplicate leaf-name groups: ${leafDuplicates.length}`);
console.log(`Redirect-only pages: ${redirectOnly.length}`);
console.log(`Placeholder/migration pages: ${placeholders.length}`);

if (placeholders.length) {
  console.log('\n--- Placeholder / migration pages ---');
  for (const r of placeholders) console.log(`${r.app.padEnd(12)} ${r.route.padEnd(48)} ${r.file}`);
}

if (redirectOnly.length) {
  console.log('\n--- Redirect-only pages ---');
  for (const r of redirectOnly) console.log(`${r.app.padEnd(12)} ${r.route.padEnd(48)} ${r.file}`);
}

if (exactDuplicates.length) {
  console.log('\n--- Exact duplicate implementations ---');
  for (const [i, group] of exactDuplicates.entries()) {
    console.log(`Group ${i + 1}:`);
    for (const r of group) console.log(`  ${r.app.padEnd(12)} ${r.route.padEnd(44)} ${r.file}`);
  }
}

console.log('\n--- Duplicate route leaf names (review, not automatic deletion) ---');
for (const group of leafDuplicates.slice(0, 100)) {
  console.log(`${group.leaf}:`);
  for (const r of group.routes) {
    const flags = [r.redirect && 'redirect', r.placeholder && 'placeholder'].filter(Boolean).join(',');
    console.log(`  ${r.app.padEnd(12)} ${r.route}${flags ? ` [${flags}]` : ''}`);
  }
}

console.log('\nThis report is diagnostic only. Run audit-deletion-safety.mjs on each proposed deletion.\n');
