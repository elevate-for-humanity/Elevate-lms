#!/usr/bin/env node
/**
 * Strict production link scanner.
 *
 * Scans the three deployed Next.js app trees plus only shared components that
 * are actually reachable from those app trees. Route ownership is resolved
 * across all deployed services and each app's canonical Next config, including
 * Marketing's .js config.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const reportsDir = path.join(rootDir, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

function existingConfig(...candidates) {
  return candidates.map((item) => path.join(rootDir, item)).find((item) => fs.existsSync(item)) ?? null;
}

const APPS = [
  {
    name: 'marketing',
    dir: path.join(rootDir, 'apps', 'marketing', 'app'),
    config: existingConfig('apps/marketing/next.config.js', 'apps/marketing/next.config.mjs'),
  },
  {
    name: 'lms',
    dir: path.join(rootDir, 'apps', 'lms', 'app'),
    config: existingConfig('apps/lms/next.config.mjs', 'apps/lms/next.config.js'),
  },
  {
    name: 'admin',
    dir: path.join(rootDir, 'apps', 'admin', 'app'),
    config: existingConfig('apps/admin/next.config.mjs', 'apps/admin/next.config.js'),
  },
].filter((app) => fs.existsSync(app.dir));

const publicDir = path.join(rootDir, 'public');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs'];

function walk(dir, visitor) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', '.next', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visitor);
    else visitor(full, entry);
  }
}

function collectNextRoutes(appDir) {
  const routes = [];
  function traverse(dir, segments = []) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')');
        const isParallel = entry.name.startsWith('@');
        traverse(full, isGroup || isParallel ? segments : [...segments, entry.name]);
        continue;
      }
      const isPage = /^page\.(tsx|ts|jsx|js)$/.test(entry.name);
      const isApi = /^route\.(tsx|ts|jsx|js)$/.test(entry.name) && segments.includes('api');
      if (!isPage && !isApi) continue;
      const route = '/' + segments.join('/');
      routes.push({ route: route === '/' ? '/' : route, type: isApi ? 'api' : 'page' });
    }
  }
  traverse(appDir);
  return routes;
}

function collectStatic(dir, base = '') {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    const item = `${base}/${entry.name}`;
    if (entry.isDirectory()) out.push(...collectStatic(full, item));
    else out.push(item);
  }
  return out;
}

function resolveImport(fromFile, specifier) {
  if (!specifier || (!specifier.startsWith('.') && !specifier.startsWith('@/'))) return null;
  const raw = specifier.startsWith('@/')
    ? path.join(rootDir, specifier.slice(2))
    : path.resolve(path.dirname(fromFile), specifier);
  const candidates = [];
  if (path.extname(raw)) candidates.push(raw);
  else {
    for (const ext of SOURCE_EXTENSIONS) candidates.push(`${raw}${ext}`);
    for (const ext of SOURCE_EXTENSIONS) candidates.push(path.join(raw, `index${ext}`));
  }
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function directImports(file) {
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch { return []; }
  const deps = new Set();
  const patterns = [
    /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const resolved = resolveImport(file, match[1]);
      if (resolved) deps.add(resolved);
    }
  }
  return [...deps];
}

function sourceClosure(appDir) {
  const seeds = [];
  walk(appDir, (full, entry) => {
    if (SOURCE_EXTENSIONS.includes(path.extname(entry.name))) seeds.push(full);
  });
  const seen = new Set();
  const queue = [...seeds];
  while (queue.length) {
    const file = queue.shift();
    if (!file || seen.has(file)) continue;
    seen.add(file);
    for (const dep of directImports(file)) {
      if (!seen.has(dep)) queue.push(dep);
    }
  }
  return seen;
}

function extractLinksFromFiles(files, owner) {
  const refs = [];
  for (const full of files) {
    if (!SOURCE_EXTENSIONS.includes(path.extname(full))) continue;
    let content;
    try { content = fs.readFileSync(full, 'utf8'); } catch { continue; }
    const patterns = [
      /href\s*=\s*["']([^"']+)["']/g,
      /router\.(?:push|replace)\(\s*["']([^"']+)["']/g,
      /redirect\(\s*["']([^"']+)["']/g,
      /fetch\(\s*["']([^"']+)["']/g,
    ];
    for (const pattern of patterns) {
      for (const match of content.matchAll(pattern)) {
        const raw = match[1];
        if (!raw.startsWith('/') || raw.startsWith('//')) continue;
        const link = raw.split('?')[0].split('#')[0];
        refs.push({ link, owner, source: path.relative(rootDir, full) });
      }
    }
  }
  return refs;
}

function routeRegex(route) {
  if (route === '/') return /^\/$/;
  const parts = route.split('/').filter(Boolean).map((segment) => {
    if (/^\[\[\.\.\..+\]\]$/.test(segment)) return '(?:/.*)?';
    if (/^\[\.\.\..+\]$/.test(segment)) return '/.+';
    if (/^\[.+\]$/.test(segment)) return '/[^/]+';
    if (/^:.+\*$/.test(segment)) return '/.*';
    if (/^:.+$/.test(segment)) return '/[^/]+';
    return '/' + escapeRegExp(segment);
  });
  return new RegExp('^' + parts.join('') + '/?$');
}

function flattenRewrites(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  return [...(value.beforeFiles || []), ...(value.afterFiles || []), ...(value.fallback || [])];
}

async function collectConfigRoutes(app) {
  if (!app.config || !fs.existsSync(app.config)) return [];
  try {
    const mod = await import(`${pathToFileURL(app.config).href}?integrity=${Date.now()}-${app.name}`);
    const cfg = mod.default || mod;
    const entries = [];
    if (typeof cfg?.redirects === 'function') {
      const values = await cfg.redirects();
      if (Array.isArray(values)) entries.push(...values.map((item) => ({ source: item.source, type: 'redirect' })).filter((item) => item.source));
    }
    if (typeof cfg?.rewrites === 'function') {
      const values = flattenRewrites(await cfg.rewrites());
      entries.push(...values.map((item) => ({ source: item.source, type: 'rewrite' })).filter((item) => item.source));
    }
    return entries;
  } catch (error) {
    console.error(`FAIL: Could not load ${app.name} route config from ${path.relative(rootDir, app.config)}: ${error.message}`);
    process.exit(1);
  }
}

if (APPS.length !== 3) {
  console.error(`FAIL: Expected 3 deployed app trees (marketing/lms/admin), found ${APPS.length}.`);
  process.exit(1);
}

const routeEntries = APPS.flatMap((app) => collectNextRoutes(app.dir).map((route) => ({ ...route, owner: app.name })));
const routeRegexes = routeEntries.map((route) => ({ ...route, regex: routeRegex(route.route) }));
const staticFiles = new Set(collectStatic(publicDir));
const configEntries = [];
for (const app of APPS) {
  for (const entry of await collectConfigRoutes(app)) configEntries.push({ owner: app.name, ...entry, regex: routeRegex(entry.source) });
}

// Shared modules are scanned in the context of the deployed app that can reach
// them. Unreferenced historical components no longer manufacture production
// failures merely because they still exist in the repository.
const refs = [];
for (const app of APPS) {
  refs.push(...extractLinksFromFiles(sourceClosure(app.dir), app.name));
}

const unique = [...new Map(refs.map((ref) => [`${ref.owner}|${ref.source}|${ref.link}`, ref])).values()];
const broken = [];
const valid = [];

for (const ref of unique) {
  const routeMatch = routeRegexes.find((route) => route.regex.test(ref.link));
  const configMatch = configEntries.find((route) => route.regex.test(ref.link));
  const staticMatch = staticFiles.has(ref.link);
  const ok = Boolean(routeMatch || configMatch || staticMatch);
  const result = {
    ...ref,
    status: ok ? 'valid' : 'broken',
    targetType: routeMatch?.type || configMatch?.type || (staticMatch ? 'static' : null),
    targetOwner: routeMatch?.owner || configMatch?.owner || (staticMatch ? 'public' : null),
  };
  (ok ? valid : broken).push(result);
}

const report = {
  timestamp: new Date().toISOString(),
  deployedApps: APPS.map((app) => app.name),
  summary: {
    appTrees: APPS.length,
    pageRoutes: routeEntries.filter((route) => route.type === 'page').length,
    apiRoutes: routeEntries.filter((route) => route.type === 'api').length,
    redirectsAndRewrites: configEntries.length,
    sourceReferences: unique.length,
    validLinks: valid.length,
    brokenLinks: broken.length,
  },
  brokenLinks: broken,
  validLinks: valid.slice(0, 500),
};

fs.writeFileSync(path.join(reportsDir, 'link_report.json'), JSON.stringify(report, null, 2));
console.log(`Link integrity: ${APPS.length} deployed apps, ${report.summary.pageRoutes} pages, ${report.summary.apiRoutes} APIs, ${report.summary.sourceReferences} reachable references.`);

if (unique.length < 50) {
  console.error('FAIL: Link coverage is implausibly low; production link integrity cannot be proven.');
  process.exit(1);
}
if (broken.length) {
  console.error(`FAIL: ${broken.length} unresolved production internal reference(s).`);
  for (const item of broken.slice(0, 100)) console.error(`  - ${item.link} <- ${item.source} [${item.owner}]`);
  process.exit(1);
}
console.log('PASS: Reachable deployed-app page/API/static references resolve.');
process.exit(0);
