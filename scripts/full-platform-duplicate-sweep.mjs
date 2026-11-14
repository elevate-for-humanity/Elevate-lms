#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

const ROOTS = {
  marketing: { path: 'apps/marketing/app', production: true },
  lms: { path: 'apps/lms/app', production: true },
  admin: { path: 'apps/admin/app', production: true },
  legacyRoot: { path: 'app', production: false },
  legacyDetached: { path: 'apps/app', production: false },
};

const PAGE = /^page\.(tsx|ts|jsx|js|mdx)$/;
const ROUTE = /^route\.(tsx|ts|jsx|js)$/;
const ROUTE_GROUP = /^\(.+\)$/;
const PARALLEL = /^@.+$/;
const DYNAMIC = /^\[.*\]$/;
const ALIASES = new Map([
  ['student', 'learner'], ['students', 'learner'], ['learner', 'learner'], ['learners', 'learner'],
  ['participant', 'learner'], ['participants', 'learner'],
  ['apply', 'application'], ['application', 'application'], ['applications', 'application'],
  ['enroll', 'application'], ['enrollment', 'application'], ['enrollments', 'application'],
  ['host-shop', 'host-site'], ['host-shops', 'host-site'], ['host-site', 'host-site'], ['host-sites', 'host-site'],
  ['barbershop', 'host-site'], ['barber-shop', 'host-site'],
  ['employers', 'employer'], ['employer', 'employer'],
  ['case-managers', 'case-manager'], ['case-manager', 'case-manager'],
  ['workforce-board', 'workforce'], ['workforce-partner', 'workforce'], ['workforce-partners', 'workforce'],
  ['dashboards', 'dashboard'], ['portals', 'portal'],
]);
const WEAK = new Set(['', 'page', 'index', 'home', 'dashboard', 'portal', 'manage', 'management', 'admin', 'app', 'api']);

function existsDir(path) {
  try { return statSync(path).isDirectory(); } catch { return false; }
}
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('_')) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (PAGE.test(entry) || ROUTE.test(entry)) out.push(full);
  }
  return out;
}
function kind(file) {
  return PAGE.test(file.split(sep).at(-1) ?? '') ? 'page' : 'route';
}
function urlFor(root, file) {
  const parts = relative(root, file).split(sep);
  parts.pop();
  const segments = parts.filter((part) => !ROUTE_GROUP.test(part) && !PARALLEL.test(part));
  const url = `/${segments.join('/')}`.replace(/\/+/g, '/');
  return url === '/' ? '/' : url.replace(/\/$/, '');
}
function redirectOnly(source) {
  return /\b(?:redirect|permanentRedirect)\s*\(/.test(source) && !/return\s*\(\s*</.test(source);
}
function normalizedHash(source) {
  const normalized = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  return createHash('sha256').update(normalized).digest('hex');
}
function semanticTokens(url) {
  return url.split('/').filter(Boolean).filter((segment) => !DYNAMIC.test(segment))
    .map((segment) => segment.toLowerCase()).map((segment) => ALIASES.get(segment) ?? segment)
    .filter((segment) => !WEAK.has(segment));
}
function semanticSignature(url) {
  return [...new Set(semanticTokens(url))].sort().join('|');
}
function publicRecord(record) {
  return {
    app: record.app,
    production: record.production,
    kind: record.kind,
    url: record.url,
    file: record.file,
    redirectOnly: record.redirectOnly,
  };
}
function routeSegments(url) {
  return url.split('/').filter(Boolean);
}
function isDirectDynamicChild(parentUrl, childUrl) {
  const parent = routeSegments(parentUrl);
  const child = routeSegments(childUrl);
  if (child.length !== parent.length + 1) return false;
  if (!parent.every((segment, index) => segment === child[index])) return false;
  return DYNAMIC.test(child.at(-1) ?? '');
}
function isSameAppListDetailFamily(family) {
  const productionItems = family.items.filter((item) => item.production);
  if (productionItems.length < 2) return false;
  if (new Set(productionItems.map((item) => item.app)).size !== 1) return false;
  const urls = productionItems.map((item) => item.url);
  return urls.some((parentUrl) =>
    urls.every((url) => url === parentUrl || isDirectDynamicChild(parentUrl, url)),
  );
}

const records = [];
for (const [app, config] of Object.entries(ROOTS)) {
  if (!existsDir(config.path)) continue;
  for (const file of walk(config.path)) {
    const source = readFileSync(file, 'utf8');
    const routeKind = kind(file);
    const url = urlFor(config.path, file);
    records.push({
      app,
      root: config.path,
      production: config.production,
      file,
      kind: routeKind,
      url,
      source,
      redirectOnly: redirectOnly(source),
      hash: normalizedHash(source),
      semanticSignature: semanticSignature(url),
    });
  }
}

const redirectIntegrityFailures = records
  .filter((record) => record.kind === 'page' && record.source.includes('permanentRedirect'))
  .filter((record) => {
    const hasDefaultExport = /export\s+default\s+(?:async\s+)?(?:function|class)|export\s+default\s+[A-Za-z_$]/.test(record.source);
    const callsRedirect = /\bpermanentRedirect\s*\(/.test(record.source.replace(/import\s*\{[^}]*permanentRedirect[^}]*\}\s*from[^;]+;/g, ''));
    return !hasDefaultExport || !callsRedirect;
  })
  .map(publicRecord);

const inventory = Object.entries(ROOTS).map(([app, config]) => {
  const rows = records.filter((record) => record.app === app);
  return {
    app,
    root: config.path,
    production: config.production,
    pages: rows.filter((record) => record.kind === 'page').length,
    routes: rows.filter((record) => record.kind === 'route').length,
    total: rows.length,
  };
});

const byAppUrl = new Map();
for (const record of records) {
  const key = `${record.app}:${record.kind}:${record.url}`;
  const list = byAppUrl.get(key) ?? [];
  list.push(record);
  byAppUrl.set(key, list);
}
const exactWithinRoot = [...byAppUrl.values()].filter((items) => items.length > 1).map((items) => items.map(publicRecord));

const byUrl = new Map();
for (const record of records) {
  const key = `${record.kind}:${record.url}`;
  const list = byUrl.get(key) ?? [];
  list.push(record);
  byUrl.set(key, list);
}
const sameUrlCrossRoot = [...byUrl.entries()]
  .filter(([, items]) => new Set(items.map((item) => item.app)).size > 1)
  .map(([key, items]) => ({ key, items: items.map(publicRecord) }));
const productionCrossAppSameUrl = sameUrlCrossRoot.filter(({ items }) =>
  new Set(items.filter((item) => item.production).map((item) => item.app)).size > 1,
);
const legacyOverlaps = sameUrlCrossRoot.filter(({ items }) =>
  items.some((item) => item.production) && items.some((item) => !item.production),
);

const hashGroups = new Map();
for (const record of records) {
  if (record.redirectOnly || record.source.length < 400) continue;
  const list = hashGroups.get(record.hash) ?? [];
  list.push(record);
  hashGroups.set(record.hash, list);
}
const clonedImplementations = [...hashGroups.values()]
  .filter((items) => new Set(items.map((item) => `${item.app}:${item.kind}:${item.url}`)).size > 1)
  .map((items) => items.map(publicRecord));

const semanticGroups = new Map();
for (const record of records) {
  if (record.kind !== 'page' || record.redirectOnly || !record.semanticSignature) continue;
  const list = semanticGroups.get(record.semanticSignature) ?? [];
  list.push(record);
  semanticGroups.set(record.semanticSignature, list);
}
const semanticFamilies = [...semanticGroups.entries()]
  .filter(([, items]) => new Set(items.map((item) => `${item.app}:${item.url}`)).size > 1)
  .map(([signature, items]) => ({ signature, items: items.map(publicRecord) }))
  .sort((a, b) => b.items.length - a.items.length);
const productionSemanticCandidates = semanticFamilies.filter(({ items }) => {
  const productionItems = items.filter((item) => item.production);
  return new Set(productionItems.map((item) => `${item.app}:${item.url}`)).size > 1;
});
const listDetailFamilies = productionSemanticCandidates.filter(isSameAppListDetailFamily);
const actionableSemanticCandidates = productionSemanticCandidates.filter(
  (family) => !isSameAppListDetailFamily(family),
);

const report = {
  generatedAt: new Date().toISOString(),
  roots: inventory,
  totals: {
    files: records.length,
    productionFiles: records.filter((record) => record.production).length,
    legacyFiles: records.filter((record) => !record.production).length,
    redirectIntegrityFailures: redirectIntegrityFailures.length,
    exactWithinRoot: exactWithinRoot.length,
    sameUrlCrossRoot: sameUrlCrossRoot.length,
    productionCrossAppSameUrl: productionCrossAppSameUrl.length,
    legacyOverlaps: legacyOverlaps.length,
    clonedImplementations: clonedImplementations.length,
    semanticFamilies: semanticFamilies.length,
    productionSemanticCandidates: productionSemanticCandidates.length,
    listDetailFamilies: listDetailFamilies.length,
    actionableSemanticCandidates: actionableSemanticCandidates.length,
  },
  redirectIntegrityFailures,
  exactWithinRoot,
  productionCrossAppSameUrl,
  legacyOverlaps,
  clonedImplementations,
  semanticFamilies,
  productionSemanticCandidates,
  listDetailFamilies,
  actionableSemanticCandidates,
};

const out = process.env.DUPLICATE_SWEEP_OUT || 'artifacts/full-platform-duplicate-sweep.json';
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);

console.log('Full platform duplicate sweep');
for (const row of inventory) {
  console.log(`- ${row.app} (${row.root}) ${row.production ? '[production]' : '[legacy]'}: ${row.pages} pages, ${row.routes} route handlers`);
}
console.log(`- total route files: ${report.totals.files}`);
console.log(`- redirect integrity failures: ${report.totals.redirectIntegrityFailures}`);
console.log(`- legacy-to-production exact URL overlaps: ${report.totals.legacyOverlaps}`);
console.log(`- production cross-app same-URL candidates: ${report.totals.productionCrossAppSameUrl}`);
console.log(`- exact implementation clone groups: ${report.totals.clonedImplementations}`);
console.log(`- semantic page families: ${report.totals.semanticFamilies}`);
console.log(`- production semantic candidates: ${report.totals.productionSemanticCandidates}`);
console.log(`- normal list/detail families: ${report.totals.listDetailFamilies}`);
console.log(`- actionable semantic candidates after list/detail filtering: ${report.totals.actionableSemanticCandidates}`);
console.log(`- report: ${out}`);

if (redirectIntegrityFailures.length > 0) {
  console.error(`Found ${redirectIntegrityFailures.length} malformed permanentRedirect page(s).`);
  for (const item of redirectIntegrityFailures) console.error(`  ${item.app}:${item.url} -> ${item.file}`);
  process.exit(1);
}
if (exactWithinRoot.length > 0) {
  console.error(`Found ${exactWithinRoot.length} exact route collision(s) inside individual app roots.`);
  for (const group of exactWithinRoot.slice(0, 25)) {
    for (const item of group) console.error(`  ${item.app}:${item.url} -> ${item.file}`);
  }
  process.exit(1);
}
if (clonedImplementations.length > 0) {
  console.error(`Found ${clonedImplementations.length} cloned implementation group(s). Consolidate business logic into one shared handler/component and keep only thin host adapters where same-origin routes are required.`);
  for (const group of clonedImplementations.slice(0, 25)) {
    for (const item of group) console.error(`  ${item.app}:${item.url} -> ${item.file}`);
  }
  process.exit(1);
}
