#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const surfaces = {
  legacyRoot: 'apps/app',
  admin: 'apps/admin/app',
  lms: 'apps/lms/app',
  marketing: 'apps/marketing/app',
  partnerLegacy: 'apps/partner/app',
};

const routeFiles = new Set(['page.tsx','page.ts','page.jsx','page.js','route.ts','route.js','layout.tsx','layout.ts','layout.jsx','layout.js']);
const codeExt = /\.(?:ts|tsx|js|jsx|mjs|cjs|json)$/;
const allowedAppsEntries = new Set(['admin', 'lms', 'marketing']);
const retiredArtifactNames = new Set([
  'manifest-barber.json',
  'manifest-partner.json',
  'manifest-instructor.json',
  'manifest-store.json',
  'manifest-enrollment.json',
  'store-manifest.json',
  'manifest-portal.json',
  'sw-portal.js',
]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else out.push(full);
    }
  }
  return out;
}

function normalizeRoute(base, file) {
  let rel = path.relative(base, file).split(path.sep).join('/');
  const name = path.basename(rel);
  if (!routeFiles.has(name)) return null;
  rel = rel.slice(0, -(name.length + (rel.length === name.length ? 0 : 1)));
  const parts = rel.split('/').filter(Boolean).filter((part) => !/^\(.*\)$/.test(part));
  const url = '/' + parts.join('/');
  const kind = name.startsWith('route.') ? 'api' : name.startsWith('layout.') ? 'layout' : 'page';
  return { url: url === '/' ? '/' : url.replace(/\/$/, ''), kind };
}

function digest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function collectSurface(name, baseRel) {
  const base = path.join(ROOT, baseRel);
  const files = walk(base).filter((f) => routeFiles.has(path.basename(f)));
  return files.map((file) => {
    const route = normalizeRoute(base, file);
    return {
      surface: name,
      base: baseRel,
      file: path.relative(ROOT, file).split(path.sep).join('/'),
      ...route,
      sha256: digest(file),
      bytes: fs.statSync(file).size,
    };
  });
}

const appsDir = path.join(ROOT, 'apps');
const appsEntries = fs.existsSync(appsDir) ? fs.readdirSync(appsDir).sort() : [];
const unexpectedAppsEntries = appsEntries.filter((entry) => !allowedAppsEntries.has(entry));

const collected = Object.entries(surfaces).flatMap(([name, base]) => collectSurface(name, base));
const canonical = collected.filter((r) => ['admin','lms','marketing'].includes(r.surface));
const legacy = collected.filter((r) => ['legacyRoot','partnerLegacy'].includes(r.surface));

const byKey = new Map();
for (const row of canonical) {
  const key = `${row.kind}:${row.url}`;
  const arr = byKey.get(key) || [];
  arr.push(row);
  byKey.set(key, arr);
}

const classifications = legacy.map((row) => {
  const key = `${row.kind}:${row.url}`;
  const matches = byKey.get(key) || [];
  let classification = 'UNIQUE_LEGACY';
  if (matches.length) classification = matches.some((m) => m.sha256 === row.sha256) ? 'EXACT_DUPLICATE' : 'DIVERGENT_DUPLICATE';
  return { ...row, classification, canonicalMatches: matches.map((m) => ({ surface: m.surface, file: m.file, sha256: m.sha256, bytes: m.bytes })) };
});

const duplicateCanonical = [];
for (const [key, rows] of byKey.entries()) {
  if (rows.length > 1) duplicateCanonical.push({ key, rows });
}

const publicDirs = [
  'public',
  'apps/marketing/public',
  'apps/admin/public',
  'apps/lms/public',
  'apps/public',
].filter((rel) => fs.existsSync(path.join(ROOT, rel)));

const manifests = publicDirs.flatMap((rel) => walk(path.join(ROOT, rel))
  .filter((f) => /(?:manifest.*\.json|manifest.*\.webmanifest|.*manifest\.json)$/i.test(path.basename(f)))
  .map((f) => path.relative(ROOT, f).split(path.sep).join('/')));

const workers = publicDirs.flatMap((rel) => walk(path.join(ROOT, rel))
  .filter((f) => /^sw(?:-[\w-]+)?\.js$/i.test(path.basename(f)))
  .map((f) => path.relative(ROOT, f).split(path.sep).join('/')));

const retiredArtifacts = [...manifests, ...workers].filter((file) => retiredArtifactNames.has(path.basename(file)));

const staleTokens = [
  'manifest-barber.json','manifest-partner.json','manifest-instructor.json','manifest-store.json','manifest-enrollment.json','store-manifest.json',
  'manifest-portal.json','sw-portal.js','PortalPwaRegistration',
  '/portal/barber','/portal/cosmetology','/portal/esthetician','/portal/nail-technician','/portal/culinary','/portal/electrical','/portal/plumbing',
  'apps/partner','apps/app/',
];

const excludedParts = new Set(['node_modules', '.next', '.git', 'artifacts']);
function isScannable(file) {
  return codeExt.test(file) && !file.split(path.sep).some((part) => excludedParts.has(part));
}

// Blocking references are limited to code/config that can affect a deployed
// runtime. Historical audits, tests, and one-off maintenance scripts remain
// visible as advisory evidence but cannot manufacture a production outage.
const runtimeRoots = [
  'apps/admin',
  'apps/lms',
  'apps/marketing',
  'components',
  'content',
  'data',
  'lib',
  'middleware.ts',
  'next.config.mjs',
  'next.config.mjs',
  'package.json',
].map((rel) => path.join(ROOT, rel));

const runtimeFiles = runtimeRoots.flatMap((entry) => {
  if (!fs.existsSync(entry)) return [];
  const stat = fs.statSync(entry);
  return stat.isDirectory() ? walk(entry).filter(isScannable) : (isScannable(entry) ? [entry] : []);
});
const allSourceFiles = walk(ROOT).filter(isScannable);
const runtimeSet = new Set(runtimeFiles.map((file) => path.resolve(file)));
const advisoryFiles = allSourceFiles.filter((file) => !runtimeSet.has(path.resolve(file)));

function collectReferences(files) {
  const references = {};
  for (const token of staleTokens) {
    references[token] = [];
    for (const file of files) {
      const rel = path.relative(ROOT, file).split(path.sep).join('/');
      if (rel === 'scripts/audit-parallel-surfaces.mjs') continue;
      let text;
      try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
      if (text.includes(token)) references[token].push(rel);
    }
  }
  return references;
}

const references = collectReferences(runtimeFiles);
const advisoryReferences = collectReferences(advisoryFiles);
const staleReferenceCount = Object.values(references).reduce((sum, files) => sum + files.length, 0);
const advisoryReferenceCount = Object.values(advisoryReferences).reduce((sum, files) => sum + files.length, 0);

const violations = [];
if (legacy.length) violations.push(`${legacy.length} legacy route file(s) remain under apps/app or apps/partner`);
if (unexpectedAppsEntries.length) violations.push(`unexpected top-level apps entries: ${unexpectedAppsEntries.join(', ')}`);
if (retiredArtifacts.length) violations.push(`retired PWA artifacts remain: ${retiredArtifacts.join(', ')}`);
if (staleReferenceCount) violations.push(`${staleReferenceCount} stale private-route/PWA reference(s) remain in deployable runtime/config code`);

const summary = {
  counts: {
    legacyRoutes: legacy.length,
    canonicalRoutes: canonical.length,
    exactDuplicates: classifications.filter((r) => r.classification === 'EXACT_DUPLICATE').length,
    divergentDuplicates: classifications.filter((r) => r.classification === 'DIVERGENT_DUPLICATE').length,
    uniqueLegacy: classifications.filter((r) => r.classification === 'UNIQUE_LEGACY').length,
    duplicateCanonicalKeys: duplicateCanonical.length,
    manifests: manifests.length,
    serviceWorkers: workers.length,
    retiredArtifacts: retiredArtifacts.length,
    staleReferences: staleReferenceCount,
    advisoryStaleReferences: advisoryReferenceCount,
  },
  appsEntries,
  unexpectedAppsEntries,
  classifications,
  duplicateCanonical,
  manifests,
  workers,
  retiredArtifacts,
  references,
  advisoryReferences,
  violations,
};

fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts/parallel-surface-audit.json'), JSON.stringify(summary, null, 2) + '\n');

const md = [];
md.push('# Parallel Surface Audit');
md.push('');
md.push(`Top-level apps entries: **${appsEntries.join(', ') || 'none'}**`);
md.push(`Unexpected apps entries: **${unexpectedAppsEntries.length}**`);
md.push(`Legacy route files: **${summary.counts.legacyRoutes}**`);
md.push(`Canonical route files: **${summary.counts.canonicalRoutes}**`);
md.push(`Exact duplicates: **${summary.counts.exactDuplicates}**`);
md.push(`Divergent duplicates: **${summary.counts.divergentDuplicates}**`);
md.push(`Unique legacy: **${summary.counts.uniqueLegacy}**`);
md.push(`Canonical route collisions: **${summary.counts.duplicateCanonicalKeys}**`);
md.push(`Retired PWA artifacts: **${summary.counts.retiredArtifacts}**`);
md.push(`Blocking stale route/PWA references: **${summary.counts.staleReferences}**`);
md.push(`Advisory historical/test/script references: **${summary.counts.advisoryStaleReferences}**`);
md.push('');
md.push('## Legacy route classification');
md.push('');
md.push('| Class | Legacy file | Route | Canonical match |');
md.push('|---|---|---|---|');
for (const row of classifications) {
  const matches = row.canonicalMatches.map((m) => `${m.surface}:${m.file}`).join('<br>') || '—';
  md.push(`| ${row.classification} | \`${row.file}\` | \`${row.kind}:${row.url}\` | ${matches} |`);
}
md.push('');
md.push('## Manifests');
for (const f of manifests) md.push(`- \`${f}\``);
md.push('');
md.push('## Service workers');
for (const f of workers) md.push(`- \`${f}\``);
md.push('');
md.push('## Blocking stale-token references');
for (const [token, files] of Object.entries(references)) {
  md.push(`- \`${token}\`: ${files.length ? files.map((f) => `\`${f}\``).join(', ') : 'none'}`);
}
md.push('');
md.push('## Advisory stale-token references outside deployed runtime');
for (const [token, files] of Object.entries(advisoryReferences)) {
  md.push(`- \`${token}\`: ${files.length ? files.map((f) => `\`${f}\``).join(', ') : 'none'}`);
}
md.push('');
md.push('## Violations');
if (violations.length) {
  for (const violation of violations) md.push(`- ${violation}`);
} else {
  md.push('- none');
}
md.push('');
fs.writeFileSync(path.join(ROOT, 'artifacts/parallel-surface-audit.md'), md.join('\n') + '\n');

console.log(md.join('\n'));
if (violations.length) {
  console.error(`Parallel surface integrity FAILED with ${violations.length} violation group(s).`);
  process.exit(1);
}
console.log('PASS: only canonical Admin/LMS/Marketing app surfaces remain, with no stale deployable private-route/PWA references.');
