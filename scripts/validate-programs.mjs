#!/usr/bin/env node
/**
 * validate-programs.mjs
 *
 * Build-time program integrity check.
 * Fails with exit code 1 if any registered program is missing required fields
 * or if a registered slug has no resolvable public route.
 *
 * Run: node scripts/validate-programs.mjs
 * CI: runs in deployment workflows after pnpm next build
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

// ── Load the static program map via the compiled manifest ─────────────────
// We can't import TypeScript directly, so we read the data files as text
// and extract slugs + required fields via regex. This is intentionally
// lightweight — the TypeScript compiler already validates types at build time.

// Required fields every ProgramSchema must have (non-empty)
const REQUIRED_FIELDS = ['slug', 'title', 'subtitle', 'sector', 'selfPayCost', 'durationWeeks'];

// Programs that are intentionally not public (internal/reporting only)
const INTERNAL_SLUGS = new Set([]);

// Read index.ts to get all registered slugs
const indexPath = join(ROOT, 'data/programs/index.ts');
const indexContent = readFileSync(indexPath, 'utf8');

// Extract imported file names
const importedFiles = [...indexContent.matchAll(/from '\.\/([^']+)'/g)].map((m) => m[1]);

// Extract slugs from STATIC_PROGRAMS array entries
const registeredExports = [...indexContent.matchAll(/^\s{2}([A-Z_]+),/gm)].map((m) => m[1]);

let errors = 0;
let warnings = 0;
const slugsSeen = new Set();

console.log(`\n[validate-programs] Checking ${importedFiles.length} program data files...\n`);

for (const file of importedFiles) {
  const filePath = join(ROOT, 'data/programs', `${file}.ts`);
  if (!existsSync(filePath)) {
    console.error(`  ❌ MISSING FILE: data/programs/${file}.ts`);
    errors++;
    continue;
  }

  const content = readFileSync(filePath, 'utf8');

  // Extract slug
  const slugMatch = content.match(/slug:\s*['"]([^'"]+)['"]/);
  if (!slugMatch) {
    console.error(`  ❌ ${file}.ts — no slug field`);
    errors++;
    continue;
  }
  const slug = slugMatch[1];

  // Duplicate slug check
  if (slugsSeen.has(slug)) {
    console.error(`  ❌ DUPLICATE SLUG: "${slug}" appears in multiple data files`);
    errors++;
  }
  slugsSeen.add(slug);

  // Required field checks
  const missing = [];
  for (const field of REQUIRED_FIELDS) {
    const pattern = new RegExp(`\\b${field}:\\s*`);
    if (!pattern.test(content)) missing.push(field);
  }
  if (missing.length > 0) {
    console.error(`  ❌ ${slug} — missing required fields: ${missing.join(', ')}`);
    errors++;
    continue;
  }

  // Route check — dedicated page.tsx, [program]/page.tsx dynamic renderer, or STATIC_PROGRAMS export
  const ownPage = join(ROOT, 'app/programs', slug, 'page.tsx');
  const dynamicProgramPage = join(ROOT, 'app/programs/[program]/page.tsx');
  const inStaticProgramsArray = new RegExp(
    `slug:\\s*['"]${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,
  ).test(content);
  const hasOwnPage = existsSync(ownPage);
  const hasDynamicRoute = existsSync(dynamicProgramPage);

  if (!hasOwnPage && !(hasDynamicRoute && inStaticProgramsArray)) {
    console.error(
      `  ❌ ${slug} — no route: missing app/programs/${slug}/page.tsx and not served by [program]/page.tsx`,
    );
    errors++;
    continue;
  }

  // Funding field check (warning only — not all programs have explicit funding yet)
  if (!content.includes('funding:') && !content.includes('isSelfPay: true')) {
    console.warn(`  ⚠️  ${slug} — no explicit funding{} block (add for agency reporting)`);
    warnings++;
  }

  console.log(`  ✅ ${slug}`);
}

// ── Duplicate title check ─────────────────────────────────────────────────
console.log('\n[validate-programs] Checking for duplicate program titles...');
const titlesSeen = new Map(); // title → slug
for (const file of importedFiles) {
  const filePath = join(ROOT, 'data/programs', `${file}.ts`);
  if (!existsSync(filePath)) continue;
  const content = readFileSync(filePath, 'utf8');
  const slugMatch = content.match(/slug:\s*['"]([^'"]+)['"]/);
  const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
  if (!slugMatch || !titleMatch) continue;
  const slug = slugMatch[1];
  const title = titleMatch[1].toLowerCase().trim();
  if (titlesSeen.has(title)) {
    console.error(`  ❌ DUPLICATE TITLE: "${titleMatch[1]}" used by both "${titlesSeen.get(title)}" and "${slug}"`);
    errors++;
  } else {
    titlesSeen.set(title, slug);
  }
}
if (errors === 0) console.log('  ✅ No duplicate titles');

// ── Primary CTA check ─────────────────────────────────────────────────────
console.log('\n[validate-programs] Checking for missing primary CTAs...');
for (const file of importedFiles) {
  const filePath = join(ROOT, 'data/programs', `${file}.ts`);
  if (!existsSync(filePath)) continue;
  const content = readFileSync(filePath, 'utf8');
  const slugMatch = content.match(/slug:\s*['"]([^'"]+)['"]/);
  if (!slugMatch) continue;
  const slug = slugMatch[1];
  // Must have either applyHref in cta block, or enrollmentType: 'external' with externalEnrollmentUrl
  const hasApplyHref = /applyHref:\s*['"][^'"]+['"]/.test(content);
  const hasExternal = /enrollmentType:\s*['"]external['"]/.test(content) && /externalEnrollmentUrl:\s*['"][^'"]+['"]/.test(content);
  const hasWaitlist = /enrollmentType:\s*['"]waitlist['"]/.test(content);
  if (!hasApplyHref && !hasExternal && !hasWaitlist) {
    console.error(`  ❌ ${slug} — missing primary CTA: no applyHref, externalEnrollmentUrl, or waitlist enrollmentType`);
    errors++;
  }
}
if (errors === 0) console.log('  ✅ All programs have primary CTAs');

// ── H1 check on dedicated page.tsx files ─────────────────────────────────
console.log('\n[validate-programs] Checking for missing H1 on dedicated program pages...');
for (const file of importedFiles) {
  const filePath = join(ROOT, 'data/programs', `${file}.ts`);
  if (!existsSync(filePath)) continue;
  const content = readFileSync(filePath, 'utf8');
  const slugMatch = content.match(/slug:\s*['"]([^'"]+)['"]/);
  if (!slugMatch) continue;
  const slug = slugMatch[1];
  const pagePath = join(ROOT, 'app/programs', slug, 'page.tsx');
  if (!existsSync(pagePath)) continue; // uses [slug] renderer — H1 checked there
  const pageContent = readFileSync(pagePath, 'utf8');
  // Skip alias pages (they just redirect)
  if (pageContent.includes('redirect(') && pageContent.split('\n').length < 15) continue;
  // Must have <h1 or use a component known to render H1 (ProgramDetailPage, WorkforceProgramPage, etc.)
  const hasH1 = /<h1[\s>]/.test(pageContent);
  const hasH1Component = /ProgramDetailPage|WorkforceProgramPage|TradesProgramPage|VisualProgramTemplate|ProgramPageLayout|ProgramPageTemplate|programName=|PathwayDisclosure/.test(pageContent);
  if (!hasH1 && !hasH1Component) {
    console.warn(`  ⚠️  ${slug} — no <h1> or known H1 component in dedicated page.tsx`);
    warnings++;
  }
}
if (warnings === 0) console.log('  ✅ All dedicated program pages have H1');

// ── ProgramMarketingPage pattern — banner must be passed server-side ────────
console.log('\n[validate-programs] Checking dedicated pages use ProgramMarketingPage...');
for (const file of importedFiles) {
  const filePath = join(ROOT, 'data/programs', `${file}.ts`);
  if (!existsSync(filePath)) continue;
  const content = readFileSync(filePath, 'utf8');
  const slugMatch = content.match(/slug:\s*['"]([^'"]+)['"]/);
  if (!slugMatch) continue;
  const slug = slugMatch[1];
  const pagePath = join(ROOT, 'app/programs', slug, 'page.tsx');
  if (!existsSync(pagePath)) continue;
  const pageContent = readFileSync(pagePath, 'utf8');
  if (pageContent.includes('redirect(') && pageContent.split('\n').length < 15) continue;
  if (
    pageContent.includes('ProgramDetailPage') &&
    !pageContent.includes('ProgramMarketingPage')
  ) {
    console.error(
      `  ❌ ${slug} — uses ProgramDetailPage without ProgramMarketingPage (hero banner will not load)`,
    );
    errors++;
  }
}
if (errors === 0) console.log('  ✅ Dedicated program pages pass hero banners server-side');

// ── Hero banner media validation ──────────────────────────────────────────
// Checks hero-banners.json for:
//   1. Missing banner entry for a registered program
//   2. Missing posterImage
//   3. posterImage file not found in public/
//   4. Duplicate posterImage across unrelated programs (warning)
//   5. Duplicate videoSrcDesktop across programs in different sectors (warning)
console.log('\n[validate-programs] Checking hero banner media...');
const heroBannersPath = join(ROOT, 'public/data/hero-banners.json');
let heroBanners = {};
if (existsSync(heroBannersPath)) {
  heroBanners = JSON.parse(readFileSync(heroBannersPath, 'utf8'));
} else {
  console.warn('  ⚠️  public/data/hero-banners.json not found — skipping media checks');
}

// Programs that intentionally share a category page key (not their own slug)
const BANNER_KEY_OVERRIDES = new Set(['business-administration', 'finance-bookkeeping-accounting']);

// Sector groupings — programs in the same sector may share a video
const SECTOR_GROUPS = {
  healthcare: ['cna','qma','phlebotomy','medical-assistant','pharmacy-technician','home-health-aide',
    'emergency-health-safety','cpr-first-aid','drug-collector','sanitation-infection-control',
    'peer-recovery-specialist','direct-support-professional'],
  trades: ['hvac-technician','welding','electrical','plumbing','diesel-mechanic',
    'construction-trades-certification','forklift','cad-drafting'],
  beauty: ['barber-apprenticeship','cosmetology-apprenticeship','nail-technician-apprenticeship',
    'esthetician-apprenticeship','esthetician','beauty-career-educator','culinary-apprenticeship'],
  technology: ['it-help-desk','cybersecurity-analyst','network-administration',
    'network-support-technician','software-development','web-development','graphic-design',
    'technology','data-analytics'],
  business: ['bookkeeping','office-administration','entrepreneurship','project-management',
    'business-administration','hospitality','finance-bookkeeping-accounting'],
  transport: ['cdl-training'],
  tax: ['bookkeeping'],
};
const slugToSector = {};
for (const [sector, slugs] of Object.entries(SECTOR_GROUPS)) {
  for (const s of slugs) slugToSector[s] = sector;
}

const posterUsage = {}; // posterImage -> [slug]
const videoUsage = {};  // videoSrcDesktop -> [slug]

for (const file of importedFiles) {
  const filePath = join(ROOT, 'data/programs', `${file}.ts`);
  if (!existsSync(filePath)) continue;
  const content = readFileSync(filePath, 'utf8');
  const slugMatch = content.match(/slug:\s*['"]([^'"]+)['"]/);
  if (!slugMatch) continue;
  const slug = slugMatch[1];
  if (BANNER_KEY_OVERRIDES.has(slug)) continue;

  const banner = heroBanners[slug];
  if (!banner) {
    console.warn(`  ⚠️  ${slug} — no entry in hero-banners.json`);
    warnings++;
    continue;
  }

  // Check posterImage exists
  const poster = banner.posterImage;
  if (!poster) {
    console.warn(`  ⚠️  ${slug} — banner has no posterImage`);
    warnings++;
  } else {
    const posterPath = join(ROOT, 'public', poster);
    if (!existsSync(posterPath)) {
      console.error(`  ❌ ${slug} — posterImage not found: ${poster}`);
      errors++;
    } else {
      if (!posterUsage[poster]) posterUsage[poster] = [];
      posterUsage[poster].push(slug);
    }
  }

  // Track video usage
  const video = banner.videoSrcDesktop;
  if (video) {
    if (!videoUsage[video]) videoUsage[video] = [];
    videoUsage[video].push(slug);
  }
}

// Warn on duplicate posters across programs in different sectors
for (const [poster, slugs] of Object.entries(posterUsage)) {
  if (slugs.length < 2) continue;
  const sectors = [...new Set(slugs.map((s) => slugToSector[s] ?? 'unknown'))];
  if (sectors.length > 1) {
    console.warn(`  ⚠️  Poster shared across sectors: ${poster}`);
    console.warn(`       Programs: ${slugs.join(', ')}`);
    warnings++;
  }
}

// Warn on duplicate videos across programs in different sectors
for (const [video, slugs] of Object.entries(videoUsage)) {
  if (slugs.length < 2) continue;
  const sectors = [...new Set(slugs.map((s) => slugToSector[s] ?? 'unknown'))];
  if (sectors.length > 1) {
    const vidName = video.split('/').pop();
    console.warn(`  ⚠️  Video shared across sectors: ${vidName}`);
    console.warn(`       Programs: ${slugs.join(', ')}`);
    warnings++;
  }
}

const posterDupeCount = Object.values(posterUsage).filter((s) => s.length > 1).length;
const videoDupeCount = Object.values(videoUsage).filter((s) => s.length > 1).length;
if (posterDupeCount === 0 && videoDupeCount === 0) {
  console.log('  ✅ No cross-sector media duplication');
} else {
  console.log(`  ℹ️  Same-sector sharing: ${posterDupeCount} poster groups, ${videoDupeCount} video groups (expected)`);
}

// Check for duplicate slugs across next.config.mjs redirects pointing to programs
const nextConfig = readFileSync(join(ROOT, 'next.config.mjs'), 'utf8');
const programRedirects = [...nextConfig.matchAll(/source:\s*['"]\/programs\/([^'"]+)['"]/g)].map((m) => m[1]);
const redirectTargets = [...nextConfig.matchAll(/destination:\s*['"]\/programs\/([^'"]+)['"]/g)].map((m) => m[1]);

// Warn if a redirect target doesn't exist as a registered slug
// Skip wildcards, category pages, and known non-registry targets
const KNOWN_NON_REGISTRY = new Set([
  'healthcare', 'skilled-trades', 'technology', 'beauty', 'business',
  'building-services-technician', 'esthetician-apprenticeship',
  ':path*', 'catalog', 'admin',
]);
for (const target of redirectTargets) {
  const targetSlug = target.split('/')[0];
  if (targetSlug.includes(':') || KNOWN_NON_REGISTRY.has(targetSlug)) continue;
  if (!slugsSeen.has(targetSlug) && !INTERNAL_SLUGS.has(targetSlug)) {
    console.warn(`  ⚠️  next.config redirect target /programs/${target} — slug "${targetSlug}" not in registry`);
    warnings++;
  }
}

console.log(`\n[validate-programs] ${slugsSeen.size} programs checked`);
if (warnings > 0) console.warn(`[validate-programs] ${warnings} warning(s) — non-blocking`);

if (errors > 0) {
  console.error(`\n[validate-programs] ❌ ${errors} error(s) — fix before deploying\n`);
  process.exit(1);
} else {
  console.log(`[validate-programs] ✅ All programs valid\n`);
}
