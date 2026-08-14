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

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
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
  if (matches.length) {
    classification = matches.some((m) => m.sha256 === row.sha256) ? 'EXACT_DUPLICATE' : 'DIVERGENT_DUPLICATE';
  }
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

const sourceFiles = walk(ROOT).filter((f) => codeExt.test(f) && !f.includes(`${path.sep}node_modules${path.sep}`) && !f.includes(`${path.sep}.next${path.sep}`) && !f.includes(`${path.sep}.git${path.sep}`));
const staleTokens = [
  'manifest-barber.json','manifest-partner.json','manifest-instructor.json','manifest-store.json','manifest-enrollment.json','store-manifest.json',
  'manifest-portal.json','sw-portal.js','PortalPwaRegistration',
  '/portal/barber','/portal/cosmetology','/portal/esthetician','/portal/nail-technician','/portal/culinary','/portal/electrical','/portal/plumbing',
  'apps/partner','apps/app/',
];

const references = {};
for (const token of staleTokens) {
  references[token] = [];
  for (const file of sourceFiles) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (rel === 'scripts/audit-parallel-surfaces.mjs') continue;
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    if (text.includes(token)) references[token].push(rel);
  }
}

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
  },
  classifications,
  duplicateCanonical,
  manifests,
  workers,
  references,
};

fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts/parallel-surface-audit.json'), JSON.stringify(summary, null, 2) + '\n');

const md = [];
md.push('# Parallel Surface Audit');
md.push('');
md.push(`Legacy route files: **${summary.counts.legacyRoutes}**`);
md.push(`Canonical route files: **${summary.counts.canonicalRoutes}**`);
md.push(`Exact duplicates: **${summary.counts.exactDuplicates}**`);
md.push(`Divergent duplicates: **${summary.counts.divergentDuplicates}**`);
md.push(`Unique legacy: **${summary.counts.uniqueLegacy}**`);
md.push(`Canonical route collisions: **${summary.counts.duplicateCanonicalKeys}**`);
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
md.push('## Stale-token references');
for (const [token, files] of Object.entries(references)) {
  md.push(`- \`${token}\`: ${files.length ? files.map((f) => `\`${f}\``).join(', ') : 'none'}`);
}
md.push('');
fs.writeFileSync(path.join(ROOT, 'artifacts/parallel-surface-audit.md'), md.join('\n') + '\n');

console.log(md.join('\n'));
