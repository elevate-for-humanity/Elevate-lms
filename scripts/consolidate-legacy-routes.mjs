#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const LEGACY_ROOT = path.join(ROOT, 'apps/app');
const ADMIN_ROOT = path.join(ROOT, 'apps/admin/app');
const LMS_ROOT = path.join(ROOT, 'apps/lms/app');
const EXECUTE = process.argv.includes('--execute');

const routeNames = new Set(['route.ts','route.js','route.tsx','route.jsx']);
const sourceExts = ['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json'];
const indexNames = sourceExts.map((ext) => `index${ext}`);

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

function sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function same(a, b) {
  return fs.existsSync(a) && fs.existsSync(b) && sha(a) === sha(b);
}

function targetRootFor(relativeRoute) {
  const rel = relativeRoute.split(path.sep).join('/');
  if (rel.startsWith('api/apprentice/') || rel.startsWith('api/learner/')) return LMS_ROOT;
  if (rel.startsWith('api/')) return ADMIN_ROOT;
  return null;
}

function resolveRelativeImport(importer, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(importer), specifier);
  const candidates = [
    base,
    ...sourceExts.map((ext) => base + ext),
    ...indexNames.map((name) => path.join(base, name)),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function importSpecifiers(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return []; }
  const specs = new Set();
  const patterns = [
    /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(text))) specs.add(match[1]);
  }
  return [...specs];
}

function dependencyClosure(entry) {
  const seen = new Set();
  const stack = [entry];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const spec of importSpecifiers(file)) {
      const resolved = resolveRelativeImport(file, spec);
      if (!resolved) continue;
      if (resolved === LEGACY_ROOT || resolved.startsWith(LEGACY_ROOT + path.sep)) stack.push(resolved);
    }
  }
  return [...seen];
}

function mappedPath(file, targetRoot) {
  return path.join(targetRoot, path.relative(LEGACY_ROOT, file));
}

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

const routes = walk(LEGACY_ROOT).filter((file) => routeNames.has(path.basename(file)));
const report = {
  execute: EXECUTE,
  migrated: [],
  exactDuplicatesRemoved: [],
  divergent: [],
  dependencyConflicts: [],
  unsupported: [],
};

for (const sourceRoute of routes) {
  const rel = path.relative(LEGACY_ROOT, sourceRoute);
  const targetRoot = targetRootFor(rel);
  if (!targetRoot) {
    report.unsupported.push(rel.split(path.sep).join('/'));
    continue;
  }

  const targetRoute = mappedPath(sourceRoute, targetRoot);
  if (fs.existsSync(targetRoute)) {
    if (same(sourceRoute, targetRoute)) {
      report.exactDuplicatesRemoved.push({ source: rel.split(path.sep).join('/'), target: path.relative(ROOT, targetRoute).split(path.sep).join('/') });
      if (EXECUTE) fs.rmSync(sourceRoute, { force: true });
    } else {
      report.divergent.push({ source: rel.split(path.sep).join('/'), target: path.relative(ROOT, targetRoute).split(path.sep).join('/') });
    }
    continue;
  }

  const closure = dependencyClosure(sourceRoute);
  const conflicts = [];
  for (const dependency of closure) {
    const target = mappedPath(dependency, targetRoot);
    if (fs.existsSync(target) && !same(dependency, target)) {
      conflicts.push({
        source: path.relative(ROOT, dependency).split(path.sep).join('/'),
        target: path.relative(ROOT, target).split(path.sep).join('/'),
      });
    }
  }

  if (conflicts.length) {
    report.dependencyConflicts.push({ route: rel.split(path.sep).join('/'), conflicts });
    continue;
  }

  report.migrated.push({
    source: rel.split(path.sep).join('/'),
    target: path.relative(ROOT, targetRoute).split(path.sep).join('/'),
    dependencyFiles: closure.length - 1,
  });

  if (EXECUTE) {
    for (const dependency of closure) {
      const target = mappedPath(dependency, targetRoot);
      if (!fs.existsSync(target)) copyFile(dependency, target);
    }
    fs.rmSync(sourceRoute, { force: true });
  }
}

fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts/legacy-route-consolidation.json'), JSON.stringify(report, null, 2) + '\n');

console.log(`Mode: ${EXECUTE ? 'EXECUTE' : 'DRY RUN'}`);
console.log(`Migratable unique routes: ${report.migrated.length}`);
console.log(`Exact duplicates removable: ${report.exactDuplicatesRemoved.length}`);
console.log(`Divergent duplicates requiring reconciliation: ${report.divergent.length}`);
console.log(`Routes blocked by dependency collisions: ${report.dependencyConflicts.length}`);
console.log(`Unsupported non-API legacy route files: ${report.unsupported.length}`);

if (report.dependencyConflicts.length) {
  console.log('\nDependency conflicts:');
  for (const item of report.dependencyConflicts) console.log(`- ${item.route}: ${item.conflicts.length} conflict(s)`);
}
if (report.unsupported.length) {
  console.log('\nUnsupported legacy route files:');
  for (const item of report.unsupported) console.log(`- ${item}`);
}
