#!/usr/bin/env node
/**
 * scripts/fetch-pexels-program-videos.mjs
 *
 * Fetches a Pexels stock video for each program that currently shares a
 * category video, then writes the direct Pexels CDN URL into
 * public/data/hero-banners.json.
 *
 * Pexels allows direct linking of video files (attribution in footer).
 * No R2 upload needed — the Pexels CDN URL is used as videoSrcDesktop.
 *
 * Usage:
 *   PEXELS_API_KEY=<key> node scripts/fetch-pexels-program-videos.mjs
 *   PEXELS_API_KEY=<key> node scripts/fetch-pexels-program-videos.mjs --dry-run
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BANNERS_PATH = join(ROOT, 'public/data/hero-banners.json');

const DRY_RUN = process.argv.includes('--dry-run');
const API_KEY = process.env.PEXELS_API_KEY;
// Optional: restrict to a comma-separated list of slugs, e.g. --only=esthetician,beauty
const ONLY_ARG = process.argv.find((a) => a.startsWith('--only='));
const ONLY = ONLY_ARG ? ONLY_ARG.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean) : null;

if (!API_KEY) {
  console.error('❌  PEXELS_API_KEY not set');
  process.exit(1);
}

// Programs that need unique videos + the best Pexels search query for each
const PROGRAM_QUERIES = {
  // Healthcare
  'phlebotomy':                    'phlebotomy blood draw medical lab',
  'medical-assistant':             'medical assistant clinic healthcare',
  'pharmacy-technician':           'pharmacy technician medication dispensing',
  'home-health-aide':              'home health aide elderly care',
  'sanitation-infection-control':  'hospital sanitation cleaning healthcare',
  'emergency-health-safety':       'emergency first aid safety training',
  'cpr-first-aid':                 'cpr first aid training mannequin',
  'drug-collector':                'drug testing laboratory professional',
  'qma':                           'medication administration nursing care',
  // Beauty
  'cosmetology-apprenticeship':    'hairdresser cutting hair salon',
  'nail-technician-apprenticeship': 'nail technician manicure salon',
  'beauty':                        'beauty salon hair styling cosmetology',
  'esthetician':                   'esthetician facial skincare spa',
  'esthetician-apprenticeship':    'esthetician skincare beauty treatment',
  'culinary-apprenticeship':       'culinary chef cooking kitchen',
  // Skilled trades
  'welding':                       'welding sparks metal fabrication',
  'plumbing':                      'plumber pipe installation',
  'diesel-mechanic':               'diesel mechanic truck engine repair',
  'construction-trades-certification': 'construction worker building site',
  'forklift':                      'forklift warehouse logistics',
  'cad-drafting':                  'cad drafting blueprint design',
  // Business
  'bookkeeping':                   'bookkeeping accounting office finance',
  'entrepreneurship':              'entrepreneur startup business meeting',
  'office-administration':         'office administrator professional desk',
  'project-management':            'project management team planning',
  'hospitality':                   'hospitality hotel service industry',
  // IT
  'cybersecurity-analyst':         'cybersecurity network security computer',
  'graphic-design':                'graphic design creative studio',
  'network-administration':        'network server data center IT',
  'network-support-technician':    'IT support technician computer help',
  'software-development':          'software developer coding programming',
  'web-development':               'web developer coding laptop',
  // DSP/peer
  'peer-recovery-specialist':      'peer support counseling recovery community',
  'direct-support-professional':   'disability support caregiver community',
};

async function fetchPexelsVideo(query) {
  const url = new URL('https://api.pexels.com/videos/search');
  url.searchParams.set('query', query);
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('size', 'medium');
  url.searchParams.set('per_page', '15');

  const res = await fetch(url.toString(), {
    headers: { Authorization: API_KEY },
  });

  if (!res.ok) {
    console.warn(`  ⚠️  Pexels API error ${res.status} for "${query}"`);
    return null;
  }

  const data = await res.json();
  if (!data.videos?.length) {
    console.warn(`  ⚠️  No results for "${query}"`);
    return null;
  }

  // Prefer 10-30s clips that also have a real HD (>=1280w) file available.
  const hasHd = (v) => v.video_files?.some((f) => f.width >= 1280);
  const byDuration = data.videos.filter((v) => v.duration >= 8 && v.duration <= 35);
  const hdDuration = byDuration.filter(hasHd);
  const hdAny = data.videos.filter(hasHd);
  const pool = hdDuration.length ? hdDuration : hdAny.length ? hdAny : byDuration.length ? byDuration : data.videos;
  // Pick the first (highest quality) result
  const video = pool[0];

  const hdFile =
    video.video_files.find((f) => f.quality === 'hd' && f.width >= 1280) ??
    video.video_files.find((f) => f.width >= 640) ??
    video.video_files[0];

  return {
    url: hdFile?.link ?? null,
    id: video.id,
    duration: video.duration,
    width: hdFile?.width,
    height: hdFile?.height,
  };
}

async function main() {
  console.log(`[pexels-videos] ${DRY_RUN ? 'DRY RUN — ' : ''}Fetching program videos from Pexels\n`);

  const banners = JSON.parse(readFileSync(BANNERS_PATH, 'utf8'));
  const results = { updated: [], failed: [], skipped: [] };

  let slugs = Object.keys(PROGRAM_QUERIES);
  if (ONLY) {
    slugs = slugs.filter((s) => ONLY.includes(s));
    console.log(`[pexels-videos] --only filter active: ${slugs.join(', ')}\n`);
  }

  for (const slug of slugs) {
    const query = PROGRAM_QUERIES[slug];
    const banner = banners[slug];

    if (!banner) {
      console.log(`  ⚠️  ${slug} — no banner entry, skipping`);
      results.skipped.push(slug);
      continue;
    }

    process.stdout.write(`  Fetching ${slug} ("${query}") ... `);

    const clip = await fetchPexelsVideo(query);

    if (!clip?.url) {
      console.log('❌ no clip found');
      results.failed.push(slug);
      continue;
    }

    console.log(`✅ ${clip.width}x${clip.height} ${clip.duration}s (id:${clip.id})`);

    if (!DRY_RUN) {
      banners[slug].videoSrcDesktop = clip.url;
      banners[slug].videoSrcMobile = clip.url;
      // Store Pexels attribution metadata
      banners[slug]._pexelsVideoId = clip.id;
    }

    results.updated.push({ slug, url: clip.url, id: clip.id });

    // Respect Pexels rate limit (200 req/hour free tier = ~3.3/min)
    await new Promise((r) => setTimeout(r, 400));
  }

  if (!DRY_RUN) {
    writeFileSync(BANNERS_PATH, JSON.stringify(banners, null, 2) + '\n');
    console.log(`\n✅ Written to public/data/hero-banners.json`);
  }

  console.log(`\nSummary:`);
  console.log(`  Updated : ${results.updated.length}`);
  console.log(`  Failed  : ${results.failed.length}${results.failed.length ? ' — ' + results.failed.join(', ') : ''}`);
  console.log(`  Skipped : ${results.skipped.length}${results.skipped.length ? ' — ' + results.skipped.join(', ') : ''}`);

  if (results.failed.length) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
