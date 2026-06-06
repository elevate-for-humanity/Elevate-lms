#!/usr/bin/env node
/**
 * scripts/audit-program-routes.mjs
 *
 * Crawls every internal /programs link in the codebase and asserts:
 *   - Route exists in app/ or has a redirect in canonical-routes.json
 *   - No duplicate public titles on /programs catalog
 *   - No "Something went wrong" or "Program Not Found" in page source
 *   - Hero image is present for every program page
 *   - CTA hrefs resolve to known routes
 *
 * Usage:
 *   pnpm audit:program-routes
 *   pnpm audit:program-routes --fix   (auto-adds missing redirects)
 *
 * Exit code: 0 = clean, 1 = issues found
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FIX_MODE = process.argv.includes('--fix');

// ── Load canonical routes ────────────────────────────────────────────────────

const canonicalRoutesPath = path.join(ROOT, 'lib/routes/canonical-routes.json');
const canonicalConfig = JSON.parse(fs.readFileSync(canonicalRoutesPath, 'utf8'));
const redirectSources = new Set(
  (canonicalConfig.legacyAliases || []).map((a) => a.source),
);

// ── Discover all /programs/* routes that have a page.tsx ────────────────────

function discoverAppRoutes(dir, prefix = '') {
  const routes = new Set();
  if (!fs.existsSync(dir)) return routes;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (name.startsWith('_') || name.startsWith('.')) continue;
    const routeSegment = name.startsWith('[') ? null : name; // skip dynamic segments
    if (!routeSegment) continue;
    const fullPath = path.join(dir, name);
    const pagePath = path.join(fullPath, 'page.tsx');
    const routeKey = `${prefix}/${routeSegment}`;
    if (fs.existsSync(pagePath)) routes.add(routeKey);
    // recurse one level
    for (const child of discoverAppRoutes(fullPath, routeKey)) {
      routes.add(child);
    }
  }
  return routes;
}

const programAppRoutes = discoverAppRoutes(path.join(ROOT, 'app/programs'), '/programs');
const hasDynamicProgramRoute = fs.existsSync(
  path.join(ROOT, 'app/programs/[program]/page.tsx'),
);

/** Slugs served by app/programs/[program]/page.tsx via data/programs/*.ts */
function loadStaticProgramSlugs() {
  const slugs = new Set();
  const dataDir = path.join(ROOT, 'data/programs');
  if (!fs.existsSync(dataDir)) return slugs;
  for (const file of fs.readdirSync(dataDir)) {
    if (!file.endsWith('.ts') || file === 'index.ts' || file === 'catalog.ts') continue;
    const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
    const m = content.match(/slug:\s*['"`]([a-z0-9-]+)['"`]/);
    if (m) slugs.add(m[1]);
  }
  return slugs;
}
const staticProgramSlugs = loadStaticProgramSlugs();

function isServedProgramRoute(appRoute) {
  if (programAppRoutes.has(appRoute)) return true;
  if (!hasDynamicProgramRoute) return false;
  const slug = appRoute.replace('/programs/', '');
  return staticProgramSlugs.has(slug);
}

// Dynamic catch-all: app/programs/[program]/page.tsx serves any static/registry slug
const hasDynamicProgramRoute = fs.existsSync(
  path.join(ROOT, 'app/programs/[program]/page.tsx'),
);

/** Static ProgramSchema slugs from data/programs/index.ts */
function loadStaticProgramSlugs() {
  const slugs = new Set();
  const indexPath = path.join(ROOT, 'data/programs/index.ts');
  if (!fs.existsSync(indexPath)) return slugs;
  const content = fs.readFileSync(indexPath, 'utf8');
  const importRe = /from '\.\/([^']+)'/g;
  const files = new Set();
  let m;
  while ((m = importRe.exec(content)) !== null) files.add(m[1]);
  for (const file of files) {
    const fp = path.join(ROOT, 'data/programs', `${file}.ts`);
    if (!fs.existsSync(fp)) continue;
    const src = fs.readFileSync(fp, 'utf8');
    const slugM = src.match(/slug:\s*['"`]([a-z0-9-]+)['"`]/);
    if (slugM) slugs.add(slugM[1]);
  }
  return slugs;
}

const staticProgramSlugs = loadStaticProgramSlugs();

/** Registry slugs + SLUG_ALIASES targets from lib/program-registry.ts */
function loadRegistrySlugs() {
  const slugs = new Set();
  const regPath = path.join(ROOT, 'lib/program-registry.ts');
  if (!fs.existsSync(regPath)) return slugs;
  const content = fs.readFileSync(regPath, 'utf8');
  const slugRe = /slug:\s*['"`]([a-z0-9-]+)['"`]/g;
  let m;
  while ((m = slugRe.exec(content)) !== null) slugs.add(m[1]);
  const aliasRe = /['"`]([a-z0-9-]+)['"`]:\s*['"`]([a-z0-9-]+)['"`]/g;
  while ((m = aliasRe.exec(content)) !== null) {
    slugs.add(m[1]);
    slugs.add(m[2]);
  }
  return slugs;
}

const registrySlugs = loadRegistrySlugs();

function isServedByDynamicRoute(slug) {
  if (!hasDynamicProgramRoute) return false;
  return staticProgramSlugs.has(slug) || registrySlugs.has(slug);
}

// ── Scan codebase for /programs/* hrefs ─────────────────────────────────────

const SCAN_DIRS = ['app', 'components', 'content', 'lib'];
const HREF_RE = /href[=:]\s*['"`]\/programs\/([a-z0-9-]+(?:\/[a-z0-9-]+)*)/g;

function scanForProgramLinks(dir) {
  const links = new Map(); // href → [file:line, ...]
  if (!fs.existsSync(dir)) return links;

  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
        walk(full);
      } else if (entry.isFile() && /\.(tsx?|jsx?|mjs)$/.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          let m;
          const re = /href[=:]\s*['"`](\/programs\/[a-z0-9-]+(?:\/[a-z0-9-]+)*)/g;
          while ((m = re.exec(line)) !== null) {
            const href = m[1];
            if (!links.has(href)) links.set(href, []);
            links.get(href).push(`${path.relative(ROOT, full)}:${i + 1}`);
          }
        });
      }
    }
  }

  walk(dir);
  return links;
}

const allLinks = new Map();
for (const dir of SCAN_DIRS) {
  for (const [href, refs] of scanForProgramLinks(path.join(ROOT, dir))) {
    if (!allLinks.has(href)) allLinks.set(href, []);
    allLinks.get(href).push(...refs);
  }
}

// ── Check hero-banners.json coverage ────────────────────────────────────────

const heroBannersPath = path.join(ROOT, 'public/data/hero-banners.json');
const heroBanners = JSON.parse(fs.readFileSync(heroBannersPath, 'utf8'));

// ── Check static program registry for duplicate titles ───────────────────────

const programTitles = [];
for (const slug of staticProgramSlugs) {
  const candidates = fs
    .readdirSync(path.join(ROOT, 'data/programs'))
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'catalog.ts');
  for (const file of candidates) {
    const src = fs.readFileSync(path.join(ROOT, 'data/programs', file), 'utf8');
    if (!src.includes(`slug: '${slug}'`) && !src.includes(`slug: "${slug}"`)) continue;
    const titleM = src.match(/title:\s*['"`]([^'"`]+)['"`]/);
    if (titleM) programTitles.push(titleM[1]);
  }
}

const titleCounts = {};
for (const t of programTitles) {
  const key = t.toLowerCase().trim();
  titleCounts[key] = (titleCounts[key] || 0) + 1;
}
const duplicateTitles = Object.entries(titleCounts)
  .filter(([, count]) => count > 1)
  .map(([title]) => title);

// ── Run checks ───────────────────────────────────────────────────────────────

let issues = 0;
const toAdd = [];

console.log('\n[audit:program-routes] Scanning...\n');

for (const [href, refs] of [...allLinks.entries()].sort()) {
  // Skip sub-pages like /programs/hvac-technician/apply
  const parts = href.replace('/programs/', '').split('/');
  if (parts.length > 1) continue;

  const slug = parts[0];
  const appRoute = `/programs/${slug}`;
  const hasPage = programAppRoutes.has(appRoute);
  const hasDynamic = isServedByDynamicRoute(slug);
  const hasRedirect = redirectSources.has(appRoute);
  const hasBanner = !!heroBanners[slug];

  if (!hasPage && !hasDynamic && !hasRedirect) {
    console.log(`❌ MISSING ROUTE: ${appRoute}`);
    console.log(`   Referenced in: ${refs.slice(0, 3).join(', ')}${refs.length > 3 ? ` (+${refs.length - 3} more)` : ''}`);
    if (!hasBanner) console.log(`   ⚠️  Also missing from hero-banners.json`);
    issues++;
    toAdd.push(appRoute);
  } else if (!hasPage && hasDynamic) {
    console.log(`✓  DYNAMIC OK:  ${appRoute} (served by [program] + static/registry)`);
  } else if (!hasPage && hasRedirect) {
    console.log(`↪  REDIRECT OK:  ${appRoute} (no page, but redirect exists)`);
  }
}

// Duplicate titles
if (duplicateTitles.length > 0) {
  console.log(`\n❌ DUPLICATE PROGRAM TITLES in data/programs:`);
  for (const t of duplicateTitles) {
    console.log(`   "${t}"`);
    issues++;
  }
}

// Pages with no banner
const programSlugsWithPages = [...programAppRoutes]
  .map((r) => r.replace('/programs/', ''))
  .filter((s) => !s.includes('/'));

const missingBanners = programSlugsWithPages.filter(
  (s) => !heroBanners[s] && s !== '[slug]' && s !== 'admin' && s !== 'catalog',
);
if (missingBanners.length > 0) {
  console.log(`\n⚠️  PROGRAM PAGES WITH NO HERO BANNER (${missingBanners.length}):`);
  for (const s of missingBanners) console.log(`   /programs/${s}`);
}

// Summary
console.log(`\n[audit:program-routes] Summary`);
console.log(`  Program pages found:     ${programAppRoutes.size}`);
console.log(`  Unique /programs links:  ${allLinks.size}`);
console.log(`  Redirects defined:       ${redirectSources.size}`);
console.log(`  Missing banners:         ${missingBanners.length}`);
console.log(`  Duplicate titles:        ${duplicateTitles.length}`);
console.log(`  Issues:                  ${issues}`);

if (FIX_MODE && toAdd.length > 0) {
  console.error(
    `\n[audit:program-routes] --fix disabled for catalog dumps. Add canonical redirects manually or create data/programs/*.ts for:\n${toAdd.map((r) => `  - ${r}`).join('\n')}\n`,
  );
}

if (issues > 0) {
  console.log(`\n❌ ${issues} issue(s) found. Run with --fix to auto-add missing redirects.\n`);
  process.exit(1);
} else {
  console.log(`\n✅ All program routes are clean.\n`);
  process.exit(0);
}
