#!/usr/bin/env node
/**
 * check-internal-links.mjs
 * Scans app/, components/, content/, data/, lib/routes/ for internal hrefs
 * and verifies each resolves to a compiled route or redirect alias.
 * Runs during the container build.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const canonicalConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib/routes/canonical-routes.json'), 'utf8'));
const CANONICAL_ALIASES = new Map((canonicalConfig.legacyAliases || []).map((a) => [normalizePath(a.source), a.destination]));
const EXTERNAL_ALLOWLIST = new Set(canonicalConfig.externalOrAppHostedAllowlist || []);

const IGNORE_PREFIXES = ['http://','https://','mailto:','tel:','#','/#','/_next/','/api/','/images/','/img/','/icons/','/fonts/','/videos/','/audio/','/documents/','/files/','/public/','/static/','/assets/','/.well-known/','/sitemap','/robots','/feed','/rss'];
const IGNORE_EXTENSIONS = ['.jpg','.jpeg','.png','.gif','.svg','.webp','.avif','.mp4','.webm','.mp3','.wav','.pdf','.zip','.xml','.json','.csv','.ico','.woff','.woff2','.ttf'];
const FILE_EXTENSIONS = new Set(['.tsx','.ts','.jsx','.js','.mdx','.md']);
const MARKETING_APP_ROOT = 'apps/marketing/app';
const SCAN_ROOTS = [MARKETING_APP_ROOT,'components/marketing','components/layout','components/programs','components/home','content','data','lib/routes'];

function normalizePath(input) {
  if (!input || typeof input !== 'string') return null;
  const s = input.split('?')[0].split('#')[0].trim();
  if (!s.startsWith('/')) return null;
  return s !== '/' && s.endsWith('/') ? s.slice(0,-1) : s;
}

function shouldIgnoreHref(h) {
  if (!h || typeof h !== 'string') return true;
  if (h.includes('${') || h.startsWith('{') || h.includes('{{')) return true;
  if (/^(sms|mailto|tel|ftp|javascript):/i.test(h)) return true;
  if (h.includes('(') || h.includes(')')) return true;
  if (IGNORE_PREFIXES.some((p) => h.startsWith(p))) return true;
  const lower = h.toLowerCase();
  if (IGNORE_EXTENSIONS.some((e) => lower.endsWith(e))) return true;
  return false;
}

function loadCompiledRoutes() {
  const manifest = path.join(ROOT, 'apps/marketing/.next/server/app-paths-manifest.json');
  if (fs.existsSync(manifest)) {
    const m = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    return new Set(Object.keys(m).map((k) => normalizePath(k.replace(/\/page$/, '').replace(/\/\([^)]+\)/g, '')) || '/').filter(Boolean));
  }
  const routes = new Set(['/']);
  function walk(dir, prefix = '') {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name.startsWith('_')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, `${prefix}${e.name.startsWith('(') ? '' : '/'+e.name}`);
      else if (/^page\.(tsx|ts|jsx|js)$/.test(e.name)) routes.add(prefix || '/');
    }
  }
  walk(path.join(ROOT, MARKETING_APP_ROOT), '');
  return routes;
}

function routeExists(href, routes, aliases) {
  const c = normalizePath(href);
  if (!c || c === '/') return true;
  if (routes.has(c)) return true;
  for (const r of routes) if (r.includes('[') && matchDynamic(r, c)) return true;
  for (const a of aliases) if (c === a || c.startsWith(`${a}/`)) return true;
  return false;
}

function matchDynamic(pattern, candidate) {
  const pp = pattern.split('/').filter(Boolean);
  const cp = candidate.split('/').filter(Boolean);
  if (pp.length !== cp.length) return false;
  return pp.every((seg, i) => /^\[\[?\.\.\..+\]?\]$/.test(seg) || /^\[.+\]$/.test(seg) || seg === cp[i]);
}

function readRedirectSources() {
  const s = new Set([...CANONICAL_ALIASES.keys()]);
  const nc = path.join(ROOT, 'apps/marketing/next.config.mjs');
  if (fs.existsSync(nc)) {
    const content = fs.readFileSync(nc, 'utf8');
    let m; const re = /source:\s*['"`]([^'"`]+)['"`]/g;
    while ((m = re.exec(content)) !== null) {
      const n = normalizePath(m[1].replace(/\/:path\*$/,'').replace(/\/\*$/,'').replace(/\/:[^/]+/g,'/param'));
      if (n) s.add(n);
    }
  }
  return s;
}

function walkFiles(dir) {
  const abs = path.join(ROOT, dir), files = [];
  if (!fs.existsSync(abs)) return files;
  function walk(cur) {
    for (const e of fs.readdirSync(cur, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === '.next') continue;
      const full = path.join(cur, e.name);
      if (e.isDirectory()) walk(full);
      else if (FILE_EXTENSIONS.has(path.extname(e.name))) files.push(full);
    }
  }
  walk(abs); return files;
}

function extractHrefs(src) {
  const hrefs = [];
  for (const re of [/href\s*=\s*["'`]([^"'`]+)["'`]/g,/href\s*:\s*["'`]([^"'`]+)["'`]/g,/router\.(?:push|replace)\(\s*["'`]([^"'`]+)["'`]/g,/redirect\(\s*["'`]([^"'`]+)["'`]/g]) {
    let m; while ((m = re.exec(src)) !== null) hrefs.push({ href: m[1], index: m.index });
  }
  return hrefs;
}

function lineAt(src, idx) { return src.slice(0, idx).split('\n').length; }

const routes = loadCompiledRoutes();
const aliases = readRedirectSources();
const failures = [], seen = new Set();
const files = SCAN_ROOTS.flatMap(walkFiles);

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, 'utf8');
  for (const item of extractHrefs(src)) {
    const n = normalizePath(item.href);
    if (!n || shouldIgnoreHref(item.href)) continue;
    const key = `${rel}:${n}`;
    if (seen.has(key)) continue; seen.add(key);
    if (EXTERNAL_ALLOWLIST.has(n)) continue;
    if (!routeExists(n, routes, aliases)) {
      failures.push({ file: rel, line: lineAt(src, item.index), href: n, suggestion: CANONICAL_ALIASES.get(n) || null });
    }
  }
}

if (!failures.length) {
  console.log(`✅ Internal link check passed — ${files.length} files, ${routes.size} routes.`);
  process.exit(0);
}
console.error(`❌ Internal link check failed: ${failures.length} broken link(s)\n`);
for (const f of failures) {
  console.error(`${f.file}:${f.line}  href: ${f.href}`);
  if (f.suggestion) console.error(`  → ${f.suggestion}`);
}
process.exit(1);
