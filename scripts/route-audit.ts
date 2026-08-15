#!/usr/bin/env tsx
/**
 * Canonical route integrity audit.
 *
 * This is an anti-regression gate for route consolidation. It scans every
 * production Next.js app in the monorepo and rejects retired internal aliases,
 * duplicate resolved pages inside a service, banned API namespaces, and tiny
 * redirect-only page stubs. Retired internal routes must be removed and callers
 * repaired; they must not be reintroduced as aliases or redirect patches.
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

// Retired internal page namespaces. Public marketing paths such as /partners and
// /partners/host-shops are intentionally NOT banned.
const BANNED_PAGE_PREFIXES = [
  'employer-portal',
  'partner-portal',
  'programs/admin',
  'program-holders',
  'program-holder-portal',
  'student-portal',
  'learners',
  'dashboards',
  'career-services/courses',
  'hvac/lesson',
  'cosmetology-host-shop',
];

const BANNED_EXACT_PAGES = new Set([
  'courses',
  'reset',
  'pay',
  'verify-credentials',
  'store/licensing',
  'license',
  'licenses',
  'licensing',
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
      results.push({ service: root.service, appDir: root.dir, file: full, route: resolveRoute(root.dir, full, entry.name), relative: path.relative(root.dir, full).replace(/\\/g, '/'), kind });
    }
  }
  walk(root.dir);
  return results;
}

const all = APP_ROOTS.flatMap(walkApp);
const pages = all.filter(r => r.kind === 'page');
const apiRoutes = all.filter(r => r.kind === 'api');

const duplicateMap = new Map<string, RouteFile[]>();
for (const p of pages) {
  const key = `${p.service}:${p.route}`;
  const existing = duplicateMap.get(key) ?? [];
  existing.push(p);
  duplicateMap.set(key, existing);
}
const duplicates = [...duplicateMap.values()].filter(files => files.length > 1);

function normalizedPagePath(p: RouteFile): string {
  return p.relative.replace(/\/page\.tsx$/, '').replace(/\/\([^)]+\)/g, '').replace(/^\//, '');
}

const bannedPages = pages.filter(p => {
  const rel = normalizedPagePath(p);
  return BANNED_PAGE_PREFIXES.some(prefix => rel === prefix || rel.startsWith(prefix + '/')) || BANNED_EXACT_PAGES.has(rel) || BANNED_PARTNER_PAGES.has(rel);
});

const bannedApi = apiRoutes.filter(r => {
  const rel = r.relative.replace(/\/route\.ts$/, '');
  return BANNED_API_PREFIXES.some(prefix => rel === prefix.slice(0, -1) || rel.startsWith(prefix));
});

const redirectStubs = pages.filter(p => {
  try {
    const content = fs.readFileSync(p.file, 'utf8');
    const substantive = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length;
    return substantive <= 24 && /\b(permanentRedirect|redirect)\s*\(/.test(content);
  } catch {
    return false;
  }
});

let issues = 0;
console.log('\n══════════════════════════════════════════════════');
console.log('  CANONICAL ROUTE INTEGRITY AUDIT');
console.log('══════════════════════════════════════════════════\n');
console.log(`Services scanned: ${APP_ROOTS.map(r => r.service).join(', ')}`);

if (duplicates.length === 0) console.log('✅ No duplicate resolved page routes inside any service');
else {
  issues += duplicates.length;
  console.log(`❌ DUPLICATE RESOLVED PAGE ROUTES (${duplicates.length})`);
  for (const files of duplicates) { console.log(`  ${files[0].service}:${files[0].route}`); for (const f of files) console.log(`    → ${path.relative(ROOT, f.file)}`); }
}

if (bannedPages.length === 0) console.log('✅ No retired internal page namespaces');
else {
  issues += bannedPages.length;
  console.log(`❌ RETIRED INTERNAL PAGE ROUTES (${bannedPages.length})`);
  for (const p of bannedPages) console.log(`  ${p.service}:${p.route} → ${path.relative(ROOT, p.file)}`);
}

if (bannedApi.length === 0) console.log('✅ No banned duplicate API namespaces');
else {
  issues += bannedApi.length;
  console.log(`❌ BANNED DUPLICATE API ROUTES (${bannedApi.length})`);
  for (const r of bannedApi) console.log(`  ${r.service}:${r.route} → ${path.relative(ROOT, r.file)}`);
}

if (redirectStubs.length === 0) console.log('✅ No redirect-only page stubs');
else {
  issues += redirectStubs.length;
  console.log(`❌ REDIRECT-ONLY PAGE STUBS (${redirectStubs.length})`);
  for (const p of redirectStubs) console.log(`  ${p.service}:${p.route} → ${path.relative(ROOT, p.file)}`);
}

console.log('');
for (const root of APP_ROOTS) {
  const servicePages = pages.filter(p => p.service === root.service).length;
  const serviceApis = apiRoutes.filter(p => p.service === root.service).length;
  console.log(`${root.service}: ${servicePages} pages | ${serviceApis} API routes`);
}
console.log(`Issues found: ${issues}`);
console.log('══════════════════════════════════════════════════\n');
if (STRICT && issues > 0) process.exit(1);
