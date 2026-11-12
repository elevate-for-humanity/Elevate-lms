#!/usr/bin/env node
// Fails when an apps/*/app/api route exports a mutating handler without a recognized auth guard.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const GUARDS = ['requireRole', 'apiRequireAdmin', 'apiRequireDevStudio', 'getCurrentUser',
  'requireAdminClient', 'withAuth', 'capabilityHealthResponse', 'requireUser'];
const MUTATING = /export\s+(?:async\s+)?(?:function\s+|const\s+|let\s+)(POST|PUT|PATCH|DELETE)\b|export\s*\{[^}]*\b(POST|PUT|PATCH|DELETE)\b[^}]*\}/;
const REEXPORT = /export\s*\{[^}]*\}\s*from\s*['"](\.[^'"]+)['"]/g;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === 'route.ts') out.push(full);
  }
  return out;
}

function sourceWithReexports(file, seen = new Set()) {
  if (seen.has(file)) return '';
  seen.add(file);
  const text = fs.readFileSync(file, 'utf8');
  let combined = text;
  for (const match of text.matchAll(REEXPORT)) {
    const base = path.resolve(path.dirname(file), match[1]);
    const target = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')].find((candidate) =>
      fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (target) combined += `\n${sourceWithReexports(target, seen)}`;
  }
  return combined;
}

const appsDir = path.join(root, 'apps');
const files = fs.readdirSync(appsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(appsDir, entry.name, 'app', 'api'))
  .filter((dir) => fs.existsSync(dir))
  .flatMap((dir) => walk(dir));

const offenders = [];
for (const file of files) {
  const source = sourceWithReexports(file);
  const methods = [...new Set([...source.matchAll(new RegExp(MUTATING, 'g'))].map((m) => m[1] || m[2]))];
  if (!methods.length) continue;
  if (!GUARDS.some((guard) => new RegExp(`\\b${guard}\\b`).test(source))) {
    offenders.push(`${path.relative(root, file)} [${methods.join(',')}]`);
  }
}

if (offenders.length) {
  console.error(`check-unprotected-routes: ${offenders.length} mutating route(s) without an auth guard:`);
  for (const offender of offenders.sort()) console.error(`  - ${offender}`);
  process.exit(1);
}
console.log(`check-unprotected-routes: OK (${files.length} route files scanned)`);
