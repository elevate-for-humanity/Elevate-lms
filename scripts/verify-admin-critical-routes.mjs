import { readFile } from 'node:fs/promises';
import path from 'node:path';

const nextDir = path.resolve(process.env.ADMIN_NEXT_DIR ?? 'apps/admin/.next');
const appPathsFile = path.join(nextDir, 'server', 'app-paths-manifest.json');
const routesFile = path.join(nextDir, 'routes-manifest.json');

const requiredAppPaths = [
  '/page',
  '/api/ping/route',
  '/api/auth/admin-login/route',
  '/api/admin/workflows/run/route',
  '/studio/page',
  '/studio/workflows/page',
  '/studio/workflows/new/page',
  '/studio/workflows/[id]/page',
];

function fail(message) {
  console.error(`[verify-admin-critical-routes] ${message}`);
  process.exitCode = 1;
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    fail(`Cannot read ${file}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

const appPaths = await readJson(appPathsFile);
const routes = await readJson(routesFile);

if (appPaths) {
  const missing = requiredAppPaths.filter((route) => !Object.hasOwn(appPaths, route));
  if (missing.length) {
    fail(`Admin build is missing critical app paths: ${missing.join(', ')}`);
  }
}

if (routes) {
  const redirects = Array.isArray(routes.redirects) ? routes.redirects : [];
  if (redirects.some((rule) => rule.source === '/studio/workflows/new')) {
    fail('/studio/workflows/new is still shadowed by a redirect');
  }
  if (redirects.some((rule) => rule.source === '/api/auth/admin-login')) {
    fail('/api/auth/admin-login is shadowed by a redirect');
  }

  const rewriteGroups = routes.rewrites && !Array.isArray(routes.rewrites)
    ? Object.values(routes.rewrites)
    : [routes.rewrites ?? []];
  const rewrites = rewriteGroups.flat().filter(Boolean);
  if (rewrites.some((rule) => rule.source === '/api/admin/workflows/run')) {
    fail('/api/admin/workflows/run is still shadowed by a rewrite');
  }
  if (rewrites.some((rule) => rule.source === '/api/auth/admin-login')) {
    fail('/api/auth/admin-login is shadowed by a rewrite');
  }
}

if (!process.exitCode) {
  console.info(
    `[verify-admin-critical-routes] verified ${requiredAppPaths.length} packaged Admin routes`,
  );
}
