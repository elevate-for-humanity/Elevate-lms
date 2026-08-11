/**
 * Hero-system pre-merge gate.
 *
 * Verifies both program-banner copy contracts and the production hero-media
 * architecture: one assigned video per page, no duplicate effective video URLs,
 * picture fallback for pages without video, one canonical renderer, and synced
 * packaged hero JSON.
 */

import fs from 'node:fs';
import path from 'node:path';
import heroBanners, {
  internalProgramHeroBanners,
  type ProgramHeroBannerConfig,
} from '../content/heroBanners';
import {
  HERO_VIDEO_BY_PAGE_KEY,
  VIDEO_REGISTRY,
} from '../lib/video/registry';

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

function auditBanner(slug: string, b: ProgramHeroBannerConfig): string[] {
  const issues: string[] = [];
  const t = b.transcript;
  const exempt = b.salaryExempt === true;

  if (!b.credentialLabel?.trim()) issues.push('credentialLabel is empty');
  if (!b.durationLabel?.trim()) issues.push('durationLabel is empty');
  if (!/\d+/.test(b.durationLabel ?? '')) {
    issues.push(`durationLabel "${b.durationLabel}" has no numeric value`);
  }

  if (exempt) {
    if (!b.salaryNote?.trim()) issues.push('salaryExempt:true requires a non-empty salaryNote');
  } else {
    const sal = b.salaryRangeLabel ?? '';
    if (!sal.trim()) {
      issues.push('salaryRangeLabel is empty — set salaryExempt:true with salaryNote to exempt');
    } else if (!/\$\d{2,3},?\d{3}/.test(sal)) {
      issues.push(`salaryRangeLabel "${sal}" does not match $NN,NNN format`);
    }
  }

  if (b.microLabel.trim().split(/\s+/).length > 4) {
    issues.push(`microLabel "${b.microLabel}" exceeds 4 words`);
  }

  const ti = b.trustIndicators;
  if (!Array.isArray(ti) || ti.length < 4 || ti.length > 6) {
    issues.push(`trustIndicators count: ${ti?.length ?? 0} (must be 4–6)`);
  } else {
    const deduped = new Set(ti.map((x) => x.trim().toLowerCase()));
    if (deduped.size !== ti.length) issues.push('trustIndicators contains duplicates');
  }

  if (t.length < 180 || t.length > 360) {
    issues.push(`transcript ${t.length} chars (must be 180–360)`);
  }
  if (b.credentialLabel && !t.includes(b.credentialLabel)) {
    issues.push(`transcript missing credentialLabel: "${b.credentialLabel}"`);
  }
  if (b.durationLabel && !t.includes(b.durationLabel)) {
    issues.push(`transcript missing durationLabel: "${b.durationLabel}"`);
  }
  if (!exempt && b.salaryRangeLabel && !t.includes(b.salaryRangeLabel)) {
    issues.push(`transcript missing salaryRangeLabel: "${b.salaryRangeLabel}"`);
  }

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

let failures = 0;

for (const [slug, banner] of Object.entries(internalProgramHeroBanners)) {
  const issues = auditBanner(slug, banner);
  if (issues.length) {
    console.error(`\nFAIL ${slug}`);
    issues.forEach((issue) => console.error(`   * ${issue}`));
    failures += 1;
  }
}

// Registry must be one page key -> one unique live video record.
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

// Effective normalized hero media must not repeat across page keys.
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
}

for (const [media, pageKeys] of effectiveUses) {
  if (pageKeys.length > 1) {
    console.error(`FAIL duplicate effective hero video ${media}: ${pageKeys.join(', ')}`);
    failures += 1;
  }
}

// Root source and packaged Marketing copy must remain identical.
const root = process.cwd();
const canonicalJson = path.join(root, 'public/data/hero-banners.json');
const marketingJson = path.join(root, 'apps/marketing/public/data/hero-banners.json');
if (fs.existsSync(canonicalJson) && fs.existsSync(marketingJson)) {
  const canonical = fs.readFileSync(canonicalJson, 'utf8').trim();
  const packaged = fs.readFileSync(marketingJson, 'utf8').trim();
  if (canonical !== packaged) {
    console.error('FAIL apps/marketing/public/data/hero-banners.json drifted from public/data/hero-banners.json');
    failures += 1;
  }
}

// Compatibility wrappers must delegate playback to the canonical renderer.
const wrapperChecks = [
  'components/ui/HomeHeroVideo.tsx',
  'components/ui/PageVideoHero.tsx',
];
for (const relative of wrapperChecks) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) continue;
  const source = fs.readFileSync(absolute, 'utf8');
  if (!source.includes("@/components/marketing/HeroVideo")) {
    console.error(`FAIL ${relative} does not delegate to canonical HeroVideo`);
    failures += 1;
  }
  if (/<video\b/i.test(source)) {
    console.error(`FAIL ${relative} contains its own <video> playback implementation`);
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

if (failures > 0) {
  console.error(`\n${failures} hero-system failure(s). Fix before merging.\n`);
  process.exit(1);
}

console.log('Hero system passes canonical renderer/media checks.');
