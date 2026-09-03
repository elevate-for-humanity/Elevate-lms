#!/usr/bin/env node
/**
 * Monorepo internal-route audit for the three canonical deployed Next.js apps.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const APPS = [
  {
    name: 'marketing',
    appDir: 'apps/marketing/app',
    scanDirs: [
      'apps/marketing/app',
      'components/site',
      'components/marketing',
      'components/home',
      'components/layout',
      'components/site-footer',
    ],
  },
  {
    name: 'lms',
    appDir: 'apps/lms/app',
    scanDirs: ['apps/lms/app', 'apps/lms/components'],
  },
  {
    name: 'admin',
    appDir: 'apps/admin/app',
    scanDirs: ['apps/admin/app', 'apps/admin/components', 'components/admin', 'components/studio'],
  },
];

const PAGE_FILES = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js']);
const METADATA_ROUTE_FILES = new Set([
  'robots.ts', 'robots.js', 'sitemap.ts', 'sitemap.js',
  'manifest.ts', 'manifest.js', 'favicon.ico',
]);
const SOURCE_EXT = /\.(tsx|ts|jsx|js)$/;
const STATIC_EXT = /\.(png|jpg|jpeg|gif|svg|ico|webp|avif|pdf|mp4|webm|mp3|wav|woff|woff2|ttf|eot|css|js|json|xml|txt)$/i;
const SKIP_PREFIXES = ['/api/', '/_next/', '/images/', '/img/', '/icons/', '/fonts/', '/static/', '/public/'];

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function normalizeRouteSegment(segment) {
  if ((segment.startsWith('(') && segment.endsWith(')')) || segment.startsWith('@')) return '';
  return segment.replace(/^\(\.\.\.\)/, '').replace(/^\(\.\.\)/, '').replace(/^\(\.\)/, '');
}

function routeFromPage(appAbs, fileAbs) {
  const relDir = path.relative(appAbs, path.dirname(fileAbs));
  if (!relDir || relDir === '.') return '/';
  const segments = relDir.split(path.sep).map(normalizeRouteSegment).filter(Boolean);
  return '/' + segments.join('/');
}

function collectRoutes(appDir) {
  const appAbs = path.join(ROOT, appDir);
  const routes = new Set(['/']);
  if (!fs.existsSync(appAbs)) return routes;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('_')) continue;
        walk(full);
        continue;
      }
      if (PAGE_FILES.has(entry.name)) routes.add(routeFromPage(appAbs, full));
      if (METADATA_ROUTE_FILES.has(entry.name)) {
        if (entry.name.startsWith('robots.')) routes.add('/robots.txt');
        if (entry.name.startsWith('sitemap.')) routes.add('/sitemap.xml');
        if (entry.name.startsWith('manifest.')) routes.add('/manifest.webmanifest');
        if (entry.name === 'favicon.ico') routes.add('/favicon.ico');
      }
    }
  }
  walk(appAbs);
  return routes;
}

function routeMatches(routes, href) {
  const base = href.split('?')[0].split('#')[0] || '/';
  if (routes.has(base)) return true;
  for (const route of routes) {
    if (!route.includes('[')) continue;
    const routeParts = route.split('/').filter(Boolean);
    const hrefParts = base.split('/').filter(Boolean);
    let ri = 0;
    let hi = 0;
    let ok = true;
    while (ri < routeParts.length) {
      const rp = routeParts[ri];
      if (rp.startsWith('[[...') || rp.startsWith('[...')) {
        hi = hrefParts.length;
        ri = routeParts.length;
        break;
      }
      if (hi >= hrefParts.length) { ok = false; break; }
      if (!(rp.startsWith('[') && rp.endsWith(']')) && rp !== hrefParts[hi]) { ok = false; break; }
      ri += 1;
      hi += 1;
    }
    if (ok && ri === routeParts.length && hi === hrefParts.length) return true;
  }
  return false;
}

function collectRedirectSources() {
  const sources = new Set();
  const configCandidates = [
    'next.config.mjs', 'next.config.js',
    'apps/marketing/next.config.mjs', 'apps/marketing/next.config.js',
    'apps/lms/next.config.mjs', 'apps/lms/next.config.js',
    'apps/admin/next.config.mjs', 'apps/admin/next.config.js',
  ];
  const pattern = /source:\s*['"]([/][^'"]+)['"]/g;
  for (const rel of configCandidates) {
    if (!exists(rel)) continue;
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    let match;
    while ((match = pattern.exec(src)) !== null) sources.add(match[1]);
  }
  return sources;
}

const REDIRECTS = collectRedirectSources();

function redirectMatches(href) {
  const base = href.split('?')[0].split('#')[0];
  for (const source of REDIRECTS) {
    const normalized = source.replace(/:\w+\*/g, '').replace(/:\w+/g, ':param');
    if (normalized.includes(':param')) {
      const prefix = normalized.split('/:param')[0];
      if (base.startsWith(prefix + '/')) return true;
    } else if (source.endsWith('/:path*')) {
      const prefix = source.slice(0, -7);
      if (base === prefix || base.startsWith(prefix + '/')) return true;
    } else if (base === source) return true;
  }
  return false;
}

const hrefPatterns = [
  /href\s*=\s*["'`](\/[a-zA-Z0-9][^"'`\s>]*)/g,
  /router\.(?:push|replace)\(\s*["'`](\/[a-zA-Z0-9][^"'`\s]*)/g,
  /window\.location\.(?:href|assign|replace)\s*(?:=|\()\s*["'`](\/[a-zA-Z0-9][^"'`\s)]*)/g,
];

function shouldSkip(href) {
  if (!href || href === '/') return true;
  const base = href.split('?')[0].split('#')[0];
  if (!base || base === '/') return true;
  if (SKIP_PREFIXES.some((p) => base.startsWith(p))) return true;
  if (STATIC_EXT.test(base)) return true;
  if (base.includes('${') || base.includes('{') || base.includes('[')) return true;
  return false;
}

function scanFile(fileAbs, app, routes, broken, seen) {
  let src;
  try { src = fs.readFileSync(fileAbs, 'utf8'); } catch { return; }
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    for (const pattern of hrefPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(lines[i])) !== null) {
        const href = match[1];
        if (shouldSkip(href)) continue;
        const key = `${app.name}:${path.relative(ROOT, fileAbs)}:${href}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!routeMatches(routes, href) && !redirectMatches(href)) {
          broken.push({ app: app.name, file: path.relative(ROOT, fileAbs), line: i + 1, href });
        }
      }
    }
  }
}

function walkScan(relDir, callback) {
  const abs = path.join(ROOT, relDir);
  if (!fs.existsSync(abs)) return;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const full = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
      walkScan(path.relative(ROOT, full), callback);
    } else if (SOURCE_EXT.test(entry.name)) callback(full);
  }
}

const broken = [];
const seen = new Set();
for (const app of APPS) {
  if (!exists(app.appDir)) continue;
  const routes = collectRoutes(app.appDir);
  for (const dir of app.scanDirs) walkScan(dir, (file) => scanFile(file, app, routes, broken, seen));
  console.log(`✓ ${app.name}: ${routes.size} filesystem routes indexed`);
}

if (!broken.length) {
  console.log('✅ Zero unresolved literal internal links across deployed monorepo apps');
  process.exit(0);
}
console.error(`❌ BROKEN LINKS: ${broken.length}`);
for (const item of broken) console.error(`[${item.app}] ${item.file}:${item.line}  ${item.href}`);
process.exit(1);
