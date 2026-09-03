#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'reports', 'canonicalization');
const SEARCH_ROOTS = [
  path.join(ROOT, 'app'),
  path.join(ROOT, 'apps', 'admin', 'app'),
];
const TEXT_SCAN_ROOTS = [
  path.join(ROOT, 'app'),
  path.join(ROOT, 'apps'),
  path.join(ROOT, 'components'),
  path.join(ROOT, 'lib'),
  path.join(ROOT, 'next.config.mjs'),
  path.join(ROOT, 'proxy.ts'),
];

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mdx', '.mjs', '.cjs']);

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function walkFiles(startPath) {
  const out = [];
  if (!exists(startPath)) return out;

  const stat = fs.statSync(startPath);
  if (stat.isFile()) return [startPath];

  const stack = [startPath];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  return out;
}

function normalizeContent(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function toWorkspaceRelative(absPath) {
  return toPosix(path.relative(ROOT, absPath));
}

function getAppRootPrefix(absPath) {
  for (const root of SEARCH_ROOTS) {
    if (absPath.startsWith(root + path.sep) || absPath === root) return root;
  }
  return null;
}

function routePathFromPage(absPath) {
  const root = getAppRootPrefix(absPath);
  if (!root) return null;

  const rel = toPosix(path.relative(root, absPath));
  const pageMatch = rel.match(/^(.*)\/page\.(tsx|ts|jsx|js|mdx)$/);
  if (!pageMatch) return null;

  let route = '/' + pageMatch[1];
  route = route.replace(/\/\(.*?\)/g, '');
  route = route.replace(/\/+/g, '/');
  if (route === '/index' || route === '/.') route = '/';
  if (route.endsWith('/') && route !== '/') route = route.slice(0, -1);
  if (route === '') route = '/';
  return route;
}

function isDynamicRoute(route) {
  return route.includes('[') || route.includes(']');
}

function scanTextCorpus() {
  const corpus = [];
  for (const root of TEXT_SCAN_ROOTS) {
    for (const f of walkFiles(root)) {
      const ext = path.extname(f);
      if (!CODE_EXTENSIONS.has(ext) && !f.endsWith('next.config.mjs') && !f.endsWith('proxy.ts')) continue;
      try {
        const text = fs.readFileSync(f, 'utf8');
        corpus.push({ file: f, text });
      } catch {
        // Ignore unreadable files
      }
    }
  }
  return corpus;
}

function main() {
  ensureDir(REPORT_DIR);

  const allFiles = SEARCH_ROOTS.flatMap((root) => walkFiles(root));
  const routePageFiles = allFiles.filter((f) => /\/page\.(tsx|ts|jsx|js|mdx)$/.test(f));
  const layoutFiles = allFiles.filter((f) => /\/layout\.(tsx|ts|jsx|js|mdx)$/.test(f));
  const componentFiles = allFiles.filter((f) => /\.(tsx|ts|jsx|js)$/.test(f));

  const routeMap = routePageFiles
    .map((f) => ({ file: toWorkspaceRelative(f), route: routePathFromPage(f) }))
    .filter((r) => Boolean(r.route))
    .sort((a, b) => a.route.localeCompare(b.route) || a.file.localeCompare(b.file));

  const duplicateComponents = {};
  for (const file of componentFiles) {
    const rel = toWorkspaceRelative(file);
    const text = fs.readFileSync(file, 'utf8');
    const digest = hash(normalizeContent(text));
    duplicateComponents[digest] ??= [];
    duplicateComponents[digest].push(rel);
  }
  const duplicateComponentMap = Object.values(duplicateComponents)
    .filter((group) => group.length > 1)
    .sort((a, b) => b.length - a.length)
    .map((files) => ({ count: files.length, files: files.sort() }));

  const duplicateLayouts = {};
  for (const file of layoutFiles) {
    const rel = toWorkspaceRelative(file);
    const text = fs.readFileSync(file, 'utf8');
    const digest = hash(normalizeContent(text));
    duplicateLayouts[digest] ??= [];
    duplicateLayouts[digest].push(rel);
  }
  const duplicateLayoutMap = Object.values(duplicateLayouts)
    .filter((group) => group.length > 1)
    .sort((a, b) => b.length - a.length)
    .map((files) => ({ count: files.length, files: files.sort() }));

  const corpus = scanTextCorpus();
  const orphanedCandidates = [];
  for (const entry of routeMap) {
    if (isDynamicRoute(entry.route)) continue;
    if (entry.route === '/') continue;

    let refs = 0;
    for (const doc of corpus) {
      if (doc.text.includes(entry.route)) refs += 1;
      if (refs > 1) break;
    }

    // Heuristic: <=1 textual mention means likely route-island candidate.
    if (refs <= 1) {
      orphanedCandidates.push({
        route: entry.route,
        file: entry.file,
        referenceMentions: refs,
      });
    }
  }
  orphanedCandidates.sort((a, b) => a.route.localeCompare(b.route));

  const summary = {
    generatedAt: new Date().toISOString(),
    totals: {
      routes: routeMap.length,
      layoutFiles: layoutFiles.length,
      componentFiles: componentFiles.length,
      duplicateComponentGroups: duplicateComponentMap.length,
      duplicateLayoutGroups: duplicateLayoutMap.length,
      orphanRouteCandidates: orphanedCandidates.length,
    },
  };

  fs.writeFileSync(path.join(REPORT_DIR, 'route-map.json'), JSON.stringify(routeMap, null, 2));
  fs.writeFileSync(path.join(REPORT_DIR, 'duplicate-component-map.json'), JSON.stringify(duplicateComponentMap, null, 2));
  fs.writeFileSync(path.join(REPORT_DIR, 'duplicate-layout-map.json'), JSON.stringify(duplicateLayoutMap, null, 2));
  fs.writeFileSync(path.join(REPORT_DIR, 'orphaned-page-map.json'), JSON.stringify(orphanedCandidates, null, 2));
  fs.writeFileSync(path.join(REPORT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));

  process.stdout.write(`Route canonicalization audit complete. Reports written to ${toWorkspaceRelative(REPORT_DIR)}\n`);
}

main();
