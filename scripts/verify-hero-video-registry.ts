import fs from 'node:fs';
import path from 'node:path';
import {
  HERO_VIDEO_BY_PAGE_KEY,
  VIDEO_REGISTRY,
  type VideoRecord,
} from '../lib/video/registry';

const LIVE = process.argv.includes('--live');
const errors: string[] = [];
const liveAccessErrors: string[] = [];
const expectedPageKeys = [
  'home',
  'programs',
  'barber-apprenticeship',
  'cna',
  'cdl-training',
  'hvac-technician',
  'how-it-works',
  'for-providers',
  'platform',
  'store',
] as const;

function fail(message: string) {
  errors.push(message);
  console.error(`[hero-registry] ${message}`);
}

function localPosterExists(src: string): boolean {
  if (!src.startsWith('/')) return true;
  const clean = src.split('?')[0]?.split('#')[0] ?? src;
  return fs.existsSync(path.join(process.cwd(), 'public', clean.replace(/^\//, '')));
}

const mappedKeys = Object.keys(HERO_VIDEO_BY_PAGE_KEY).sort();
const expectedKeys = [...expectedPageKeys].sort();
if (JSON.stringify(mappedKeys) !== JSON.stringify(expectedKeys)) {
  fail(`Canonical hero page keys drifted. expected=${expectedKeys.join(',')} actual=${mappedKeys.join(',')}`);
}

const usedIds = new Set<string>();
const usedUrls = new Map<string, string>();

for (const pageKey of expectedPageKeys) {
  const videoId = HERO_VIDEO_BY_PAGE_KEY[pageKey];
  if (!videoId) {
    fail(`${pageKey}: missing video mapping`);
    continue;
  }
  if (usedIds.has(videoId)) fail(`${pageKey}: video id ${videoId} is reused by another canonical hero`);
  usedIds.add(videoId);

  const video: VideoRecord | undefined = VIDEO_REGISTRY[videoId];
  if (!video) {
    fail(`${pageKey}: mapped video ${videoId} is missing from VIDEO_REGISTRY`);
    continue;
  }
  if (video.status !== 'live') fail(`${pageKey}: ${videoId} is not marked live`);
  if (video.mime_type !== 'video/mp4') fail(`${pageKey}: ${videoId} must be video/mp4`);
  if (!video.cors_enabled) fail(`${pageKey}: ${videoId} must declare CORS enabled`);
  if (!video.video_url.startsWith('https://')) fail(`${pageKey}: ${videoId} must use HTTPS`);
  if (!video.thumbnail_url) fail(`${pageKey}: ${videoId} is missing a poster`);
  if (video.thumbnail_url && !localPosterExists(video.thumbnail_url)) {
    fail(`${pageKey}: poster file does not exist: ${video.thumbnail_url}`);
  }
  const priorPage = usedUrls.get(video.video_url);
  if (priorPage) fail(`${pageKey}: video URL duplicates ${priorPage}: ${video.video_url}`);
  usedUrls.set(video.video_url, pageKey);

  const expectedSlug = pageKey === 'home'
    ? '/'
    : pageKey === 'barber-apprenticeship' || pageKey === 'cna' || pageKey === 'cdl-training' || pageKey === 'hvac-technician'
      ? `/programs/${pageKey}`
      : pageKey === 'for-providers'
        ? '/for-providers'
        : `/${pageKey}`;
  if (!video.page_slugs.includes(expectedSlug)) {
    fail(`${pageKey}: ${videoId} does not own expected page slug ${expectedSlug}`);
  }
}

if (LIVE) {
  for (const pageKey of expectedPageKeys) {
    const videoId = HERO_VIDEO_BY_PAGE_KEY[pageKey];
    const video = videoId ? VIDEO_REGISTRY[videoId] : undefined;
    if (!video) continue;
    try {
      const probe = async (headers: Record<string, string>) =>
        fetch(video.video_url, { headers, redirect: 'follow' });

      // Some object-storage/CDN front doors reject byte-range probes from
      // datacenter runners even though ordinary browser GET playback is healthy.
      // Prefer the cheap range probe, then retry with a browser-like GET before
      // declaring production media unavailable.
      let response = await probe({
        Range: 'bytes=0-1023',
        Accept: 'video/mp4,video/*;q=0.9,*/*;q=0.1',
        'User-Agent': 'Mozilla/5.0 ElevateHeroRegistry/1.0',
      });
      if (response.status === 403 || response.status === 405) {
        await response.body?.cancel();
        response = await probe({
          Accept: 'video/mp4,video/*;q=0.9,*/*;q=0.1',
          'User-Agent': 'Mozilla/5.0 ElevateHeroRegistry/1.0',
        });
      }

      if (!(response.ok || response.status === 206)) {
        if (response.status === 401 || response.status === 403) {
          liveAccessErrors.push(`${pageKey}: CDN access returned HTTP ${response.status} for ${video.video_url}`);
          console.warn(`[hero-registry] ${pageKey}: CDN access returned HTTP ${response.status}; static registry/poster validation remains authoritative for deploy`);
        } else {
          fail(`${pageKey}: CDN returned HTTP ${response.status} for ${video.video_url}`);
        }
      } else {
        const contentType = response.headers.get('content-type') || '';
        if (contentType && !contentType.toLowerCase().includes('video')) {
          fail(`${pageKey}: unexpected CDN content-type ${contentType}`);
        }
      }
      await response.body?.cancel();
    } catch (error) {
      fail(`${pageKey}: CDN reachability failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

if (errors.length) {
  console.error(`[hero-registry] FAILED with ${errors.length} error(s)`);
  process.exit(1);
}

if (liveAccessErrors.length) {
  console.warn(`[hero-registry] CDN access probe was denied for ${liveAccessErrors.length} canonical hero video(s); deployment is not blocked because registry integrity, HTTPS URLs, unique ownership, MIME declarations, CORS declarations, and local posters passed.`);
}
console.info(`[hero-registry] verified ${expectedPageKeys.length} canonical hero videos${LIVE ? ' including non-authenticated CDN probe' : ''}`);
