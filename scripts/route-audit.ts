#!/usr/bin/env tsx
/**
 * Canonical route integrity audit.
 *
 * Anti-regression gate for route consolidation. Hard failures are duplicate
 * resolved pages, explicitly retired internal page routes, and banned API
 * namespaces. Small redirect-only pages are migration inventory: they are
 * reported, but they are not release failures unless they also match a retired
 * route rule below. Current substantive production surfaces must not be placed
 * on the retired list simply because an older architecture used the same name.
 *
 * Usage:
 *   pnpm route:audit
 *   pnpm route:audit --strict
 */

import fs from 'fs';
import path from 'path';

const STRICT = process.argv.includes('--strict');
const ROOT = process.cwd();

interface AppRoot {
  service: string;
  dir: string;
}

const APP_ROOTS: AppRoot[] = [
  { service: 'root', dir: path.join(ROOT, 'app') },
  { service: 'lms', dir: path.join(ROOT, 'apps/lms/app') },
  { service: 'admin', dir: path.join(ROOT, 'apps/admin/app') },
  { service: 'marketing', dir: path.join(ROOT, 'apps/marketing/app') },
  { service: 'website-builder', dir: path.join(ROOT, 'apps/website-builder/app') },
].filter(({ dir }) => fs.existsSync(dir));

// Retire only superseded portal/runtime namespaces. Current Admin management
// surfaces (courses, licenses, program-holders), public career-services,
// credential verification, payments, and licensing are canonical production
// surfaces and are therefore intentionally not listed here.
const BANNED_PAGE_PREFIXES = [
  'employer-portal',
  'partner-portal',
  'programs/admin',
  'program-holder-portal',
  'student-portal',
  'learners',
  'dashboards',
  'hvac/lesson',
];

const BANNED_EXACT_PAGES = new Set([
  'reset',
  'dev/barber-preview',
  'dev/hvac-preview',
  'dev/slide-preview',
]);

const BANNED_PARTNER_PAGES = new Set([
  'partners/dashboard',
  'partners/hours',
  'partners/attendance',
  'partners/documents',
  'partners/students',
  'partners/login',
]);

const BANNED_API_PREFIXES = [
  'api/pwa/api-pwa/',
  'api/store/api-store/',
  'api/cm/',
  'api/cert/',
  'api/donations/',
  'api/license/',
  'api/licenses/',
  'api/licensing/',
  'api/program-owner/',
  'api/employer-portal/',
  'api/employee-portal/',
];

interface RouteFile {
  service: string;
  appDir: string;
  file: string;
  route: string;
  relative: string;
  kind: 'page' | 'api';
}

function resolveRoute(appDir: string, absPath: string, filename: 'page.tsx' | 'route.ts'): string {
  const suffix = filename === 'page.tsx' ? /\/page\.tsx$/ : /\/route\.ts$/;
  const rel = absPath.replace(appDir, '').replace(suffix, '').replace(/\\/g, '/');
  const resolved = rel.replace(/\/\([^)]+\)/g, '') || '/';
  return resolved || '/';
}

function walkApp(root: AppRoot): RouteFile[] {
  const results: RouteFile[] = [];
  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['_next', '.next', 'node_modules'].includes(entry.name)) continue;
        walk(full);
        continue;
      }
      if (entry.name !== 'page.tsx' && entry.name !== 'route.ts') continue;
      const kind: RouteFile['kind'] = entry.name === 'page.tsx' ? 'page' : 'api';
      results.push({
        service: root.service,
        appDir: root.dir,
        file: full,
        route: resolveRoute(root.dir, full, entry.name),
        relative: path.relative(root.dir, full).replace(/\\/g, '/'),
        kind,
      });
    }
  }
  walk(root.dir);
  return results;
}

const all = APP_ROOTS.flatMap(walkApp);
const pages = all.filter((route) => route.kind === 'page');
const apiRoutes = all.filter((route) => route.kind === 'api');

const duplicateMap = new Map<string, RouteFile[]>();
for (const page of pages) {
  const key = `${page.service}:${page.route}`;
  const existing = duplicateMap.get(key) ?? [];
  existing.push(page);
  duplicateMap.set(key, existing);
}
const duplicates = [...duplicateMap.values()].filter((files) => files.length > 1);

function normalizedPagePath(page: RouteFile): string {
  return page.relative
    .replace(/\/page\.tsx$/, '')
    .replace(/\/\([^)]+\)/g, '')
    .replace(/^\//, '');
}

const bannedPages = pages.filter((page) => {
  const rel = normalizedPagePath(page);
  return (
    BANNED_PAGE_PREFIXES.some((prefix) => rel === prefix || rel.startsWith(`${prefix}/`)) ||
    BANNED_EXACT_PAGES.has(rel) ||
    BANNED_PARTNER_PAGES.has(rel)
  );
});

const bannedApi = apiRoutes.filter((route) => {
  const rel = route.relative.replace(/\/route\.ts$/, '');
  return BANNED_API_PREFIXES.some(
    (prefix) => rel === prefix.slice(0, -1) || rel.startsWith(prefix),
  );
});

const redirectStubs = pages.filter((page) => {
  try {
    const content = fs.readFileSync(page.file, 'utf8');
    const substantive = content
      .split('\n')
      .filter((line) => line.trim() && !line.trim().startsWith('//')).length;
    return substantive <= 24 && /\b(permanentRedirect|redirect)\s*\(/.test(content);
  } catch {
    return false;
  }
});
const bannedPageFiles = new Set(bannedPages.map((page) => page.file));
const governedRedirectStubs = redirectStubs.filter((page) => !bannedPageFiles.has(page.file));

let issues = 0;
console.log('\n══════════════════════════════════════════════════');
console.log('  CANONICAL ROUTE INTEGRITY AUDIT');
console.log('══════════════════════════════════════════════════\n');
console.log(`Services scanned: ${APP_ROOTS.map((root) => root.service).join(', ')}`);

if (duplicates.length === 0) {
  console.log('✅ No duplicate resolved page routes inside any service');
} else {
  issues += duplicates.length;
  console.log(`❌ DUPLICATE RESOLVED PAGE ROUTES (${duplicates.length})`);
  for (const files of duplicates) {
    console.log(`  ${files[0].service}:${files[0].route}`);
    for (const file of files) console.log(`    → ${path.relative(ROOT, file.file)}`);
  }
}

if (bannedPages.length === 0) {
  console.log('✅ No retired internal page namespaces');
} else {
  issues += bannedPages.length;
  console.log(`❌ RETIRED INTERNAL PAGE ROUTES (${bannedPages.length})`);
  for (const page of bannedPages) {
    console.log(`  ${page.service}:${page.route} → ${path.relative(ROOT, page.file)}`);
  }
}

if (bannedApi.length === 0) {
  console.log('✅ No banned duplicate API namespaces');
} else {
  issues += bannedApi.length;
  console.log(`❌ BANNED DUPLICATE API ROUTES (${bannedApi.length})`);
  for (const route of bannedApi) {
    console.log(`  ${route.service}:${route.route} → ${path.relative(ROOT, route.file)}`);
  }
}

if (governedRedirectStubs.length === 0) {
  console.log('✅ No compatibility redirect inventory');
} else {
  console.log(`ℹ️ COMPATIBILITY REDIRECT INVENTORY (${governedRedirectStubs.length}) — advisory`);
  for (const page of governedRedirectStubs) {
    console.log(`  ${page.service}:${page.route} → ${path.relative(ROOT, page.file)}`);
  }
}

console.log('');
for (const root of APP_ROOTS) {
  const servicePages = pages.filter((page) => page.service === root.service).length;
  const serviceApis = apiRoutes.filter((route) => route.service === root.service).length;
  console.log(`${root.service}: ${servicePages} pages | ${serviceApis} API routes`);
}
console.log(`Hard failures found: ${issues}`);
console.log(`Compatibility redirects reported: ${governedRedirectStubs.length}`);
console.log('══════════════════════════════════════════════════\n');
if (STRICT && issues > 0) process.exit(1);
