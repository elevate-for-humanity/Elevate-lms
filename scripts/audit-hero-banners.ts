/**
 * Hero-system pre-merge gate.
 *
 * Verifies program-banner copy contracts, production hero media, packaged
 * image existence, canonical renderer delegation, and critical active Marketing
 * route coverage.
 */

import fs from 'node:fs';
import path from 'node:path';
import heroBanners, {
  internalProgramHeroBanners,
  type ProgramHeroBannerConfig,
} from '../content/heroBanners';
import { HERO_VIDEO_BY_PAGE_KEY, VIDEO_REGISTRY } from '../lib/video/registry';

const BANNED_PHRASES = [
  'rewarding career',
  'exciting future',
  'in-demand',
  'career-ready',
  'next step',
  'start your journey',
  'launch your career',
  'transform your life',
  'bright future',
  'take the next step',
];

const root = process.cwd();

function auditBanner(slug: string, b: ProgramHeroBannerConfig): string[] {
  const issues: string[] = [];
  const t = b.transcript;
  const exempt = b.salaryExempt === true;

  if (!b.credentialLabel?.trim()) issues.push('credentialLabel is empty');
  if (!b.durationLabel?.trim()) issues.push('durationLabel is empty');
  if (!/\d+/.test(b.durationLabel ?? '')) issues.push(`durationLabel "${b.durationLabel}" has no numeric value`);

  if (exempt) {
    if (!b.salaryNote?.trim()) issues.push('salaryExempt:true requires a non-empty salaryNote');
  } else {
    const sal = b.salaryRangeLabel ?? '';
    if (!sal.trim()) issues.push('salaryRangeLabel is empty — set salaryExempt:true with salaryNote to exempt');
    else if (!/\$\d{2,3},?\d{3}/.test(sal)) issues.push(`salaryRangeLabel "${sal}" does not match $NN,NNN format`);
  }

  if (b.microLabel.trim().split(/\s+/).length > 4) issues.push(`microLabel "${b.microLabel}" exceeds 4 words`);

  const ti = b.trustIndicators;
  if (!Array.isArray(ti) || ti.length < 4 || ti.length > 6) {
    issues.push(`trustIndicators count: ${ti?.length ?? 0} (must be 4–6)`);
  } else {
    const deduped = new Set(ti.map((x) => x.trim().toLowerCase()));
    if (deduped.size !== ti.length) issues.push('trustIndicators contains duplicates');
  }

  if (t.length < 180 || t.length > 360) issues.push(`transcript ${t.length} chars (must be 180–360)`);
  if (b.credentialLabel && !t.includes(b.credentialLabel)) issues.push(`transcript missing credentialLabel: "${b.credentialLabel}"`);
  if (b.durationLabel && !t.includes(b.durationLabel)) issues.push(`transcript missing durationLabel: "${b.durationLabel}"`);
  if (!exempt && b.salaryRangeLabel && !t.includes(b.salaryRangeLabel)) issues.push(`transcript missing salaryRangeLabel: "${b.salaryRangeLabel}"`);

  const hit = BANNED_PHRASES.find((p) => t.toLowerCase().includes(p));
  if (hit) issues.push(`banned phrase: "${hit}"`);
  if (!/[.?!]$/.test(t.trim())) issues.push('transcript does not end with punctuation');
  return issues;
}

function mediaKey(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, 'https://elevate.local');
    return `${url.hostname.toLowerCase()}${url.pathname.toLowerCase()}`;
  } catch {
    return value.split('?')[0].split('#')[0].toLowerCase();
  }
}

function localPublicAssetExists(value?: string): boolean {
  if (!value || !value.startsWith('/')) return true;
  const clean = value.split(/[?#]/)[0].replace(/^\//, '');
  return [path.join(root, 'public', clean), path.join(root, 'apps/marketing/public', clean)].some((candidate) => fs.existsSync(candidate));
}

function readIfPresent(relative: string): string | null {
  const absolute = path.join(root, relative);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : null;
}

let failures = 0;

for (const [slug, banner] of Object.entries(internalProgramHeroBanners)) {
  const issues = auditBanner(slug, banner);
  if (issues.length) {
    console.error(`\nFAIL ${slug}`);
    issues.forEach((issue) => console.error(`   * ${issue}`));
    failures += 1;
  }
}

// Dedicated registry assignments must be unique. This is the surface where a
// page claims its own specific hero video and accidental reuse is a defect.
const assignedIds = Object.values(HERO_VIDEO_BY_PAGE_KEY);
const duplicateIds = assignedIds.filter((id, index) => assignedIds.indexOf(id) !== index);
if (duplicateIds.length) {
  console.error(`FAIL duplicate HERO_VIDEO_BY_PAGE_KEY IDs: ${[...new Set(duplicateIds)].join(', ')}`);
  failures += 1;
}

for (const [pageKey, videoId] of Object.entries(HERO_VIDEO_BY_PAGE_KEY)) {
  const video = VIDEO_REGISTRY[videoId];
  if (!video) {
    console.error(`FAIL hero assignment ${pageKey} -> missing video ${videoId}`);
    failures += 1;
  } else if (video.status !== 'live') {
    console.error(`FAIL hero assignment ${pageKey} -> ${videoId} is ${video.status}`);
    failures += 1;
  }
}

// Normalized page entries may intentionally share category/fallback media.
// Report that reuse for editorial review, but do not manufacture random media
// replacements. Dedicated video ownership is enforced above.
const effectiveUses = new Map<string, string[]>();
for (const [pageKey, banner] of Object.entries(heroBanners)) {
  const src = banner.videoSrcDesktop || banner.videoSrcMobile;
  const key = mediaKey(src);
  if (key) {
    const list = effectiveUses.get(key) || [];
    list.push(pageKey);
    effectiveUses.set(key, list);
  }

  if (!src && !banner.posterImage) {
    console.error(`FAIL ${pageKey} has neither hero video nor poster image`);
    failures += 1;
  }

  if (banner.posterImage && !localPublicAssetExists(banner.posterImage)) {
    console.error(`FAIL ${pageKey} poster image does not exist: ${banner.posterImage}`);
    failures += 1;
  }
}

for (const [media, pageKeys] of effectiveUses) {
  if (pageKeys.length > 1) console.log(`ADVISORY shared effective hero video ${media}: ${pageKeys.join(', ')}`);
}

const canonicalJson = path.join(root, 'public/data/hero-banners.json');
const marketingJson = path.join(root, 'apps/marketing/public/data/hero-banners.json');
if (!fs.existsSync(canonicalJson)) {
  console.error('FAIL public/data/hero-banners.json is missing');
  failures += 1;
}
if (!fs.existsSync(marketingJson)) {
  console.error('FAIL apps/marketing/public/data/hero-banners.json is missing');
  failures += 1;
}
if (fs.existsSync(canonicalJson) && fs.existsSync(marketingJson)) {
  const canonical = fs.readFileSync(canonicalJson, 'utf8').trim();
  const packaged = fs.readFileSync(marketingJson, 'utf8').trim();
  if (canonical !== packaged) {
    console.error('FAIL apps/marketing/public/data/hero-banners.json drifted from public/data/hero-banners.json');
    failures += 1;
  }
}

const wrapperChecks = ['components/ui/HomeHeroVideo.tsx', 'components/ui/PageVideoHero.tsx'];
for (const relative of wrapperChecks) {
  const source = readIfPresent(relative);
  if (source === null) continue;
  if (!source.includes("@/components/marketing/HeroVideo")) {
    console.error(`FAIL ${relative} does not delegate to canonical HeroVideo`);
    failures += 1;
  }
  if (/<video\b/i.test(source)) {
    console.error(`FAIL ${relative} contains its own <video> playback implementation`);
    failures += 1;
  }
}

const criticalRouteChecks = [
  { file: 'apps/marketing/app/call-now/page.tsx', description: 'Get Started', acceptedMarkers: ["@/components/marketing/HeroPicture", "@/components/marketing/HeroVideo"] },
  { file: 'apps/marketing/app/page.tsx', description: 'Homepage', acceptedMarkers: ['HomeHeroVideo', "@/components/marketing/HeroVideo"] },
  { file: 'apps/marketing/app/programs/[program]/page.tsx', description: 'Program detail renderer', acceptedMarkers: ['ProgramDetailPage', 'HeroPicture', 'HeroVideo'] },
];

for (const check of criticalRouteChecks) {
  const source = readIfPresent(check.file);
  if (source === null) {
    console.error(`FAIL ${check.description} route is missing: ${check.file}`);
    failures += 1;
    continue;
  }
  if (!check.acceptedMarkers.some((marker) => source.includes(marker))) {
    console.error(`FAIL ${check.description} bypasses the canonical hero system: ${check.file}`);
    failures += 1;
  }
}

const storeHeroLegacy = path.join(root, 'apps/marketing/app/store/StoreHeroVideo.tsx');
if (fs.existsSync(storeHeroLegacy)) {
  console.error('FAIL obsolete StoreHeroVideo.tsx still exists');
  failures += 1;
}

console.log(`Audited ${Object.keys(heroBanners).length} normalized hero entries.`);
console.log(`Audited ${Object.keys(HERO_VIDEO_BY_PAGE_KEY).length} dedicated hero video assignments.`);
console.log(`Audited ${Object.keys(internalProgramHeroBanners).length} internal program banner contracts.`);
console.log(`Audited ${criticalRouteChecks.length} critical active Marketing hero routes.`);

if (failures > 0) {
  console.error(`\n${failures} hero-system failure(s). Fix before merging.\n`);
  process.exit(1);
}

console.log('Hero system passes renderer, media, asset, and route checks.');
