#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONTRACT_PATH = path.join(ROOT, 'lib/routes/platform-surface-contracts.json');
const APP_ROOTS = {
  marketing: path.join(ROOT, 'apps/marketing/app'),
  lms: path.join(ROOT, 'apps/lms/app'),
  admin: path.join(ROOT, 'apps/admin/app'),
  legacy: path.join(ROOT, 'app'),
};

function routeFile(app, routePath) {
  const root = APP_ROOTS[app];
  if (!root) return null;
  const clean = routePath.split(/[?#]/)[0].replace(/^\//, '').replace(/\/$/, '');
  const isApi = clean.startsWith('api/');
  const dir = path.join(root, clean);
  const candidates = isApi
    ? ['route.ts', 'route.tsx', 'route.js', 'route.jsx']
    : ['page.tsx', 'page.ts', 'page.jsx', 'page.js'];
  for (const name of candidates) {
    const file = path.join(dir, name);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

function rel(file) {
  return path.relative(ROOT, file).replaceAll('\\', '/');
}

const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
const failures = [];
const checked = [];

function requireRoute(surface, role, ref) {
  if (!ref?.app || !ref?.path) return;
  const file = routeFile(ref.app, ref.path);
  checked.push({ surface, role, app: ref.app, path: ref.path, file: file ? rel(file) : null });
  if (!file) failures.push(`${surface}: missing ${role} route ${ref.app}:${ref.path}`);
  return file;
}

for (const [surface, spec] of Object.entries(contract.surfaces ?? {})) {
  requireRoute(surface, 'canonical', spec.canonical);
  requireRoute(surface, 'application', spec.application);
  requireRoute(surface, 'portal', spec.portal);
  requireRoute(surface, 'api canonical', spec.api?.canonical);

  for (const ref of spec.operational ?? []) requireRoute(surface, 'operational', ref);
  for (const ref of spec.informational ?? []) requireRoute(surface, 'informational', ref);

  for (const ref of spec.compatibility ?? []) {
    const file = requireRoute(surface, 'compatibility', ref);
    if (!file) continue;
    const source = fs.readFileSync(file, 'utf8');
    const redirects = /\b(?:redirect|permanentRedirect)\s*\(/.test(source);
    if (!redirects) {
      failures.push(`${surface}: compatibility page must redirect instead of reimplementing function: ${rel(file)}`);
    }
  }

  for (const ref of spec.api?.compatibility ?? []) {
    const file = requireRoute(surface, 'api compatibility', ref);
    if (!file) continue;
    const source = fs.readFileSync(file, 'utf8');
    if (ref.mode === 'adapter') {
      const delegates = /applications\/route|applications\/track\/route/.test(source);
      const directCanonicalWrite = /\.from\(['"]applications['"]\)[\s\S]{0,1200}\.(?:insert|upsert)\(/.test(source);
      if (!delegates || directCanonicalWrite) {
        failures.push(`${surface}: compatibility API must delegate to canonical application services without direct application writes: ${rel(file)}`);
      }
    }
  }
}

if (failures.length) {
  console.error(`Platform surface contract check failed: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Platform surface contracts valid: ${Object.keys(contract.surfaces ?? {}).length} surface families, ${checked.length} routes checked.`);
