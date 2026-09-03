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

const PAGE_FILE = /^page\.(tsx|ts|jsx|js|mdx)$/;
const ROUTE_FILE = /^route\.(tsx|ts|jsx|js)$/;
const ROUTE_GROUP = /^\(.+\)$/;
const PARALLEL_ROUTE = /^@.+$/;

function walkRouteFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir)) {
    // Next.js private folders are implementation-only and do not create routes.
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('_')) continue;

    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkRouteFiles(full, out);
      continue;
    }

    if (PAGE_FILE.test(entry) || ROUTE_FILE.test(entry)) out.push(full);
  }

  return out;
}

function urlFor(root, file) {
  const segments = path.relative(root, file).split(path.sep);
  segments.pop();

  const routedSegments = segments.filter(
    (segment) => !ROUTE_GROUP.test(segment) && !PARALLEL_ROUTE.test(segment),
  );

  const url = `/${routedSegments.join('/')}`.replace(/\/+/g, '/');
  return url === '/' ? '/' : url.replace(/\/$/, '');
}

function buildRouteIndex(root) {
  const index = new Map();
  if (!fs.existsSync(root)) return index;

  for (const file of walkRouteFiles(root)) {
    const name = path.basename(file);
    const kind = PAGE_FILE.test(name) ? 'page' : 'route';
    const key = `${kind}:${urlFor(root, file)}`;
    const files = index.get(key) ?? [];
    files.push(file);
    index.set(key, files);
  }

  return index;
}

const ROUTE_INDEXES = Object.fromEntries(
  Object.entries(APP_ROOTS).map(([app, root]) => [app, buildRouteIndex(root)]),
);

function normalizeRoutePath(routePath) {
  const clean = routePath.split(/[?#]/)[0] || '/';
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`;
  if (withSlash === '/') return '/';
  return withSlash.replace(/\/$/, '');
}

function routeFiles(app, routePath) {
  const index = ROUTE_INDEXES[app];
  if (!index) return [];
  const url = normalizeRoutePath(routePath);
  const kind = url === '/api' || url.startsWith('/api/') ? 'route' : 'page';
  return index.get(`${kind}:${url}`) ?? [];
}

function rel(file) {
  return path.relative(ROOT, file).replaceAll('\\', '/');
}

const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
const failures = [];
const checked = [];

function requireRoute(surface, role, ref) {
  if (!ref?.app || !ref?.path) return null;

  const files = routeFiles(ref.app, ref.path);
  checked.push({
    surface,
    role,
    app: ref.app,
    path: ref.path,
    files: files.map(rel),
  });

  if (files.length === 0) {
    failures.push(`${surface}: missing ${role} route ${ref.app}:${ref.path}`);
    return null;
  }

  if (files.length > 1) {
    failures.push(
      `${surface}: ambiguous ${role} route ${ref.app}:${ref.path} resolves to multiple files: ${files
        .map(rel)
        .join(', ')}`,
    );
  }

  return files[0];
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
      failures.push(
        `${surface}: compatibility page must redirect instead of reimplementing function: ${rel(file)}`,
      );
    }
  }

  for (const ref of spec.api?.compatibility ?? []) {
    const file = requireRoute(surface, 'api compatibility', ref);
    if (!file) continue;

    const source = fs.readFileSync(file, 'utf8');
    if (ref.mode === 'adapter') {
      const delegates = /applications\/route|applications\/track\/route/.test(source);
      const directCanonicalWrite =
        /\.from\(['"]applications['"]\)[\s\S]{0,1200}\.(?:insert|upsert|update)\(/.test(source);
      if (!delegates || directCanonicalWrite) {
        failures.push(
          `${surface}: compatibility API must delegate to canonical application services without direct application writes: ${rel(file)}`,
        );
      }
    }
  }
}

if (failures.length) {
  console.error(`Platform surface contract check failed: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Platform surface contracts valid: ${Object.keys(contract.surfaces ?? {}).length} surface families, ${checked.length} routes checked.`,
);
