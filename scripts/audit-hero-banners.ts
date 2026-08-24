/**
 * Hero-system pre-merge gate.
 *
 * Verifies program-banner copy contracts, production hero media, packaged
 * image existence, canonical renderer delegation, and critical active Marketing
 * route coverage. Effective authored hero media duplication is a hard failure.
 * Dormant catalog/config entries without authored media are reported as
 * advisories because their renderers use the canonical runtime fallback layer.
 */

import fs from 'node:fs';
import path from 'node:path';
import heroBanners, {
  internalProgramHeroBanners,
  type ProgramHeroBannerConfig,
} from '../content/heroBanners';
import { HERO_VIDEO_BY_PAGE_KEY, VIDEO_REGISTRY } from '../lib/video/registry';

const BANNED_PHRASES = [
  'rewarding career', 'exciting future', 'in-demand', 'career-ready', 'next step',
  'start your journey', 'launch your career', 'transform your life', 'bright future',
  'take the next step',
];
const root = process.cwd();

function auditBanner(slug: string, b: ProgramHeroBannerConfig): string[] {
  const issues: string[] = [];
  const t = b.transcript;
  const exempt = b.salaryExempt === true;
  const hasSalary = typeof b.salaryRangeLabel === 'string' && b.salaryRangeLabel.trim().length > 0;
  if (!b.credentialLabel?.trim()) issues.push('credentialLabel is empty');
  if (!b.durationLabel?.trim()) issues.push('durationLabel is empty');
  if (!/\d+/.test(b.durationLabel ?? '')) issues.push(`durationLabel "${b.durationLabel}" has no numeric value`);

  // Wage marketing is optional. The canonical public hero sanitizer deliberately
  // removes unsupported salary claims. When a wage is published, it must still
  // meet the format/transcript contract; when explicitly exempted, document why.
  if (exempt && !b.salaryNote?.trim()) issues.push('salaryExempt:true requires a non-empty salaryNote');
  if (hasSalary && !/\$\d{2,3},?\d{3}/.test(b.salaryRangeLabel ?? '')) {
    issues.push(`salaryRangeLabel "${b.salaryRangeLabel}" does not match $NN,NNN format`);
  }

  if (b.microLabel.trim().split(/\s+/).length > 4) issues.push(`microLabel "${b.microLabel}" exceeds 4 words`);
  const ti = b.trustIndicators;
  if (!Array.isArray(ti)) issues.push('trustIndicators is not an array');
  else if (ti.length > 6) issues.push(`trustIndicators count: ${ti.length} (maximum 6)`);
  else if (new Set(ti.map((x) => x.trim().toLowerCase())).size !== ti.length) issues.push('trustIndicators contains duplicates');

  // Do not force filler copy simply to satisfy a character quota. Program hero
  // transcripts must be substantive enough for accessibility and narration while
  // preserving the exact credential and duration disclosures.
  if (t.length < 120 || t.length > 360) issues.push(`transcript ${t.length} chars (must be 120–360)`);
  if (b.credentialLabel && !t.includes(b.credentialLabel)) issues.push(`transcript missing credentialLabel: "${b.credentialLabel}"`);
  if (b.durationLabel && !t.includes(b.durationLabel)) issues.push(`transcript missing durationLabel: "${b.durationLabel}"`);
  if (hasSalary && b.salaryRangeLabel && !t.includes(b.salaryRangeLabel)) issues.push(`transcript missing salaryRangeLabel: "${b.salaryRangeLabel}"`);
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
    console.error(`\nFAIL ${slug}`); issues.forEach((issue) => console.error(`   * ${issue}`)); failures += 1;
  }
}

const assignedIds = Object.values(HERO_VIDEO_BY_PAGE_KEY);
const duplicateIds = assignedIds.filter((id, index) => assignedIds.indexOf(id) !== index);
if (duplicateIds.length) { console.error(`FAIL duplicate HERO_VIDEO_BY_PAGE_KEY IDs: ${[...new Set(duplicateIds)].join(', ')}`); failures += 1; }
for (const [pageKey, videoId] of Object.entries(HERO_VIDEO_BY_PAGE_KEY)) {
  const video = VIDEO_REGISTRY[videoId];
  if (!video) { console.error(`FAIL hero assignment ${pageKey} -> missing video ${videoId}`); failures += 1; }
  else if (video.status !== 'live') { console.error(`FAIL hero assignment ${pageKey} -> ${videoId} is ${video.status}`); failures += 1; }
}

const videoUses = new Map<string, string[]>();
const posterUses = new Map<string, string[]>();
let fallbackOnlyEntries = 0;
for (const [pageKey, banner] of Object.entries(heroBanners)) {
  const src = banner.videoSrcDesktop || banner.videoSrcMobile;
  const videoKey = mediaKey(src);
  if (videoKey) videoUses.set(videoKey, [...(videoUses.get(videoKey) || []), pageKey]);
  const posterKey = mediaKey(banner.posterImage);
  if (posterKey) posterUses.set(posterKey, [...(posterUses.get(posterKey) || []), pageKey]);

  if (!src && !banner.posterImage) fallbackOnlyEntries += 1;
  if (banner.posterImage && !localPublicAssetExists(banner.posterImage)) { console.error(`FAIL ${pageKey} poster image does not exist: ${banner.posterImage}`); failures += 1; }
}
for (const [media, pageKeys] of videoUses) {
  if (pageKeys.length > 1) { console.error(`FAIL duplicate effective hero video ${media}: ${pageKeys.join(', ')}`); failures += 1; }
}
for (const [media, pageKeys] of posterUses) {
  if (pageKeys.length > 1) { console.error(`FAIL duplicate effective hero poster ${media}: ${pageKeys.join(', ')}`); failures += 1; }
}

const canonicalJson = path.join(root, 'public/data/hero-banners.json');
const marketingJson = path.join(root, 'apps/marketing/public/data/hero-banners.json');
if (!fs.existsSync(canonicalJson)) { console.error('FAIL public/data/hero-banners.json is missing'); failures += 1; }
if (!fs.existsSync(marketingJson)) { console.error('FAIL apps/marketing/public/data/hero-banners.json is missing'); failures += 1; }
if (fs.existsSync(canonicalJson) && fs.existsSync(marketingJson)) {
  if (fs.readFileSync(canonicalJson, 'utf8').trim() !== fs.readFileSync(marketingJson, 'utf8').trim()) { console.error('FAIL apps/marketing/public/data/hero-banners.json drifted from public/data/hero-banners.json'); failures += 1; }
}

const wrapperChecks = ['components/ui/HomeHeroVideo.tsx', 'components/ui/PageVideoHero.tsx'];
for (const relative of wrapperChecks) {
  const source = readIfPresent(relative); if (source === null) continue;
  if (!source.includes("@/components/marketing/HeroVideo")) { console.error(`FAIL ${relative} does not delegate to canonical HeroVideo`); failures += 1; }
  if (/<video\b/i.test(source)) { console.error(`FAIL ${relative} contains its own <video> playback implementation`); failures += 1; }
}

const heroRenderer = readIfPresent('components/marketing/HeroVideo.tsx');
if (heroRenderer === null) {
  console.error('FAIL canonical HeroVideo renderer is missing');
  failures += 1;
} else {
  if (!heroRenderer.includes('absolute inset-0 z-0 h-full w-full')) {
    console.error('FAIL HeroVideo poster is not locked to the base z-0 media layer');
    failures += 1;
  }
  if (!heroRenderer.includes('absolute inset-0 z-10 h-full w-full')) {
    console.error('FAIL HeroVideo video is not locked above the poster at z-10');
    failures += 1;
  }
  if (!heroRenderer.includes("videoReady ? 'opacity-100' : 'opacity-0'")) {
    console.error('FAIL HeroVideo does not gate video visibility on a ready frame');
    failures += 1;
  }
  if (!heroRenderer.includes('relative isolate w-full overflow-hidden')) {
    console.error('FAIL HeroVideo media stack is not isolated from outside stacking contexts');
    failures += 1;
  }
}

const homeWrapper = readIfPresent('components/ui/HomeHeroVideo.tsx');
if (homeWrapper === null) {
  console.error('FAIL HomeHeroVideo wrapper is missing');
  failures += 1;
} else {
  const expectedDesktopHeight = 'h-[38vh] min-h-[320px] max-h-[520px]';
  if (!homeWrapper.includes(expectedDesktopHeight)) {
    console.error('FAIL homepage hero desktop proportions drifted from the production contract');
    failures += 1;
  }
  if (/max-h-\[(?:5[3-9]\d|[6-9]\d\d)px\]/.test(homeWrapper)) {
    console.error('FAIL homepage hero exceeds the canonical 520px maximum');
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
  if (source === null) { console.error(`FAIL ${check.description} route is missing: ${check.file}`); failures += 1; continue; }
  if (!check.acceptedMarkers.some((marker) => source.includes(marker))) { console.error(`FAIL ${check.description} bypasses the canonical hero system: ${check.file}`); failures += 1; }
}

for (const pageKey of ['home', 'programs', 'store']) {
  const banner = heroBanners[pageKey];
  if (!banner || (!(banner.videoSrcDesktop || banner.videoSrcMobile) && !banner.posterImage)) {
    console.error(`FAIL active hero ${pageKey} has neither video nor poster`);
    failures += 1;
  }
}

const storeHeroLegacy = path.join(root, 'apps/marketing/app/store/StoreHeroVideo.tsx');
if (fs.existsSync(storeHeroLegacy)) { console.error('FAIL obsolete StoreHeroVideo.tsx still exists'); failures += 1; }
console.log(`Audited ${Object.keys(heroBanners).length} normalized hero entries.`);
console.log(`Advisory: ${fallbackOnlyEntries} dormant/config-only hero entries rely on canonical runtime fallback.`);
console.log(`Audited ${Object.keys(HERO_VIDEO_BY_PAGE_KEY).length} dedicated hero video assignments.`);
console.log(`Audited ${Object.keys(internalProgramHeroBanners).length} internal program banner contracts.`);
console.log(`Audited ${criticalRouteChecks.length} critical active Marketing hero routes.`);
if (failures > 0) { console.error(`\n${failures} hero-system failure(s). Fix before merging.\n`); process.exit(1); }
console.log('Hero system passes renderer, media, asset, uniqueness, layering, desktop sizing, and active-route checks.');
