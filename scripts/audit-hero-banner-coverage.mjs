#!/usr/bin/env node
/**
 * Program hero integrity gate.
 *
 * A program may use a configured video/picture banner or the canonical dynamic
 * fallback, but no public program may render without a full hero treatment.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
let failures = 0;

function pass(message) { console.log(` ✅ ${message}`); }
function fail(message) { console.error(` ❌ ${message}`); failures += 1; }

const banners = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/hero-banners.json'), 'utf8'));
const indexSrc = fs.readFileSync(path.join(ROOT, 'data/programs/index.ts'), 'utf8');
const importedFiles = [...indexSrc.matchAll(/from ['"]\.\/([^'"]+)['"]/g)].map((match) => match[1]);
const staticPrograms = [];

for (const file of importedFiles) {
  const filePath = path.join(ROOT, 'data/programs', `${file}.ts`);
  if (!fs.existsSync(filePath)) continue;
  const src = fs.readFileSync(filePath, 'utf8');
  const slug = src.match(/slug:\s*['"]([^'"]+)['"]/)?.[1];
  const heroImage = src.match(/heroImage:\s*['"]([^'"]+)['"]/)?.[1];
  if (slug) staticPrograms.push({ slug, heroImage: heroImage || '' });
}

const missingProgramImages = staticPrograms.filter((program) => !program.heroImage);
if (missingProgramImages.length) {
  fail(`Static programs missing heroImage: ${missingProgramImages.map((program) => program.slug).join(', ')}`);
} else {
  pass(`${staticPrograms.length} static programs declare a hero image`);
}

const dynamicPagePath = path.join(ROOT, 'apps/marketing/app/programs/[program]/page.tsx');
const dynamicPage = fs.readFileSync(dynamicPagePath, 'utf8');
const fallbackRequirements = [
  'const banner: HeroBannerConfig',
  'posterImage: resolved.heroImage',
  'belowHeroHeadline: resolved.title',
  'belowHeroSubheadline: resolved.subtitle',
  'href: resolved.cta.applyHref',
  '<ProgramDetailPage program={resolved} banner={banner}',
];
const missingFallbackRequirements = fallbackRequirements.filter((needle) => !dynamicPage.includes(needle));
if (missingFallbackRequirements.length) {
  fail(`Dynamic program hero fallback incomplete: ${missingFallbackRequirements.join(' | ')}`);
} else {
  pass('Dynamic program route guarantees a full HeroPicture/HeroVideo banner fallback');
}

const heroRuntimePath = path.join(ROOT, 'content/heroBanners.ts');
const heroRuntime = fs.readFileSync(heroRuntimePath, 'utf8');
if (!heroRuntime.includes('SHARED_GENERIC_VIDEO_FILES') || !heroRuntime.includes('if (desktopShared && picture)')) {
  fail('Hero runtime does not suppress shared generic videos with program/page-specific pictures');
} else {
  pass('Shared generic hero videos are replaced with page/program-specific pictures at runtime');
}

const posterOwners = new Map();
for (const [key, banner] of Object.entries(banners)) {
  if (!banner?.pageKey) fail(`${key}: hero entry is missing pageKey`);
  if (banner.posterImage) {
    const owners = posterOwners.get(banner.posterImage) || [];
    owners.push(key);
    posterOwners.set(banner.posterImage, owners);
  }
}
const duplicatePosters = [...posterOwners.entries()].filter(([, owners]) => owners.length > 1);
if (duplicatePosters.length) {
  fail(`Explicit duplicate poster images: ${duplicatePosters.map(([src, owners]) => `${src} => ${owners.join(',')}`).join(' | ')}`);
} else {
  pass('No explicit hero poster image is assigned to multiple banner entries');
}

console.log(`\nConfigured hero entries: ${Object.keys(banners).length}`);
console.log(`Static programs checked: ${staticPrograms.length}`);

if (failures) {
  console.error(`\n❌ Hero audit FAILED — ${failures} issue(s).\n`);
  process.exit(1);
}
console.log('\n✅ Hero audit PASSED.\n');
