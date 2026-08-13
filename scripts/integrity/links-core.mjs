#!/usr/bin/env node
/**
 * Strict production link scanner. The recovery wrapper in links.mjs compares
 * this scanner's current findings with the current main baseline.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const reportsDir = path.join(rootDir, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const APPS = [
  { name: 'marketing', dir: path.join(rootDir, 'apps', 'marketing', 'app'), config: path.join(rootDir, 'apps', 'marketing', 'next.config.mjs') },
  { name: 'lms', dir: path.join(rootDir, 'apps', 'lms', 'app'), config: path.join(rootDir, 'apps', 'lms', 'next.config.mjs') },
  { name: 'admin', dir: path.join(rootDir, 'apps', 'admin', 'app'), config: path.join(rootDir, 'apps', 'admin', 'next.config.mjs') },
].filter(app => fs.existsSync(app.dir));

const sharedDir = path.join(rootDir, 'components');
const publicDir = path.join(rootDir, 'public');
const escapeRegExp = v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function walk(dir, visitor) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || ['node_modules', '.next', '.git'].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, visitor);
    else visitor(full, e);
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
        traverse(full, isGroup ? segments : [...segments, entry.name]);
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
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    const p = `${base}/${e.name}`;
    if (e.isDirectory()) out.push(...collectStatic(full, p));
    else out.push(p);
  }
  return out;
}

function extractLinks(dir, owner) {
  const refs = [];
  if (!fs.existsSync(dir)) return refs;
  walk(dir, (full, entry) => {
    if (!/\.(tsx|ts|jsx|js)$/.test(entry.name)) return;
    const content = fs.readFileSync(full, 'utf8');
    const patterns = [
      /href\s*=\s*["']([^"']+)["']/g,
      /router\.(?:push|replace)\(\s*["']([^"']+)["']/g,
      /redirect\(\s*["']([^"']+)["']/g,
      /fetch\(\s*["']([^"']+)["']/g,
    ];
    for (const re of patterns) {
      for (const m of content.matchAll(re)) {
        const raw = m[1];
        if (!raw.startsWith('/') || raw.startsWith('//')) continue;
        const link = raw.split('?')[0].split('#')[0];
        refs.push({ link, owner, source: path.relative(rootDir, full) });
      }
    }
  });
  return refs;
}

function routeRegex(route) {
  if (route === '/') return /^\/$/;
  const parts = route.split('/').filter(Boolean).map(segment => {
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
  if (!fs.existsSync(app.config)) return [];
  try {
    const mod = await import(`${pathToFileURL(app.config).href}?integrity=${Date.now()}-${app.name}`);
    const cfg = mod.default || mod;
    const entries = [];
    if (typeof cfg?.redirects === 'function') {
      const values = await cfg.redirects();
      if (Array.isArray(values)) entries.push(...values.map(r => ({ source: r.source, type: 'redirect' })).filter(r => r.source));
    }
    if (typeof cfg?.rewrites === 'function') {
      const values = flattenRewrites(await cfg.rewrites());
      entries.push(...values.map(r => ({ source: r.source, type: 'rewrite' })).filter(r => r.source));
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

const routeEntries = APPS.flatMap(app => collectNextRoutes(app.dir).map(r => ({ ...r, owner: app.name })));
const routeRegexes = routeEntries.map(r => ({ ...r, regex: routeRegex(r.route) }));
const staticFiles = new Set(collectStatic(publicDir));
const configEntries = [];
for (const app of APPS) {
  for (const entry of await collectConfigRoutes(app)) configEntries.push({ owner: app.name, ...entry, regex: routeRegex(entry.source) });
}

const refs = [
  ...APPS.flatMap(app => extractLinks(app.dir, app.name)),
  ...extractLinks(sharedDir, 'shared'),
];

const unique = [...new Map(refs.map(r => [`${r.owner}|${r.source}|${r.link}`, r])).values()];
const broken = [];
const valid = [];

for (const ref of unique) {
  const routeMatch = routeRegexes.find(r => r.regex.test(ref.link));
  const configMatch = configEntries.find(r => r.regex.test(ref.link));
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
  deployedApps: APPS.map(a => a.name),
  summary: {
    appTrees: APPS.length,
    pageRoutes: routeEntries.filter(r => r.type === 'page').length,
    apiRoutes: routeEntries.filter(r => r.type === 'api').length,
    redirectsAndRewrites: configEntries.length,
    sourceReferences: unique.length,
    validLinks: valid.length,
    brokenLinks: broken.length,
  },
  brokenLinks: broken,
  validLinks: valid.slice(0, 500),
};

fs.writeFileSync(path.join(reportsDir, 'link_report.json'), JSON.stringify(report, null, 2));
console.log(`Link integrity: ${APPS.length} deployed apps, ${report.summary.pageRoutes} pages, ${report.summary.apiRoutes} APIs, ${report.summary.sourceReferences} references.`);

if (unique.length < 50) {
  console.error('FAIL: Link coverage is implausibly low; production link integrity cannot be proven.');
  process.exit(1);
}
if (broken.length) {
  console.error(`FAIL: ${broken.length} unresolved production internal reference(s).`);
  for (const x of broken.slice(0, 100)) console.error(`  - ${x.link} <- ${x.source} [${x.owner}]`);
  process.exit(1);
}
console.log('PASS: Deployed-app internal page/API/static references resolve.');
process.exit(0);
