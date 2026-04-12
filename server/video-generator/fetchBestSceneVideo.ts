import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { SceneVideoAsset } from './types';

const CACHE_DIR = path.join(process.cwd(), 'public', 'videos', 'scene-video-cache');

// Narrow vague queries to concrete stock-video search terms
const QUERY_NORMALIZATIONS: [RegExp, string][] = [
  [/professionalism/i,       'barber client consultation barbershop'],
  [/sanitation|disinfect/i,  'barber disinfecting clippers workstation'],
  [/tools?\b/i,              'barber clippers combs scissors close up'],
  [/haircut/i,               'barber cutting hair with clippers'],
  [/beard/i,                 'barber trimming beard close up'],
  [/fade/i,                  'barber fade haircut clippers blending'],
  [/consultation/i,          'barber talking to client consultation'],
  [/neckline/i,              'barber trimming neckline clippers'],
  [/shav/i,                  'barber straight razor shave'],
  [/station|workstation/i,   'barbershop workstation tools organized'],
];

function normalizeQuery(query: string): string {
  for (const [pattern, replacement] of QUERY_NORMALIZATIONS) {
    if (pattern.test(query)) return replacement;
  }
  return query;
}

// Fallback queries tried in order when primary returns no results
const FALLBACK_QUERIES = [
  'barber cutting hair',
  'barbershop interior',
  'barber clippers close up',
  'barber client chair',
];

interface PexelsVideoFile {
  link: string;
  width: number;
  height: number;
  quality: string;
  file_type: string;
}

interface PexelsVideo {
  id: number;
  duration: number;
  url: string;
  video_files: PexelsVideoFile[];
}

async function searchPexelsVideos(
  query: string,
  minDuration: number,
  excludeIds: Set<number> = new Set(),
): Promise<PexelsVideo | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error('PEXELS_API_KEY not set');

  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape&size=medium`;
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);

  const data = await res.json() as { videos: PexelsVideo[] };
  const videos = (data.videos ?? []).filter(v => !excludeIds.has(v.id));

  // Prefer clips at least as long as the scene audio, fall back to longest available
  const long = videos.filter(v => v.duration >= minDuration);
  return long[0] ?? videos.sort((a, b) => b.duration - a.duration)[0] ?? null;
}

function pickBestFile(files: PexelsVideoFile[]): PexelsVideoFile | null {
  // Prefer HD (1280×720 or better), landscape, mp4
  const mp4 = files.filter(f => f.file_type === 'video/mp4' && f.width >= f.height);
  const hd  = mp4.filter(f => f.width >= 1280).sort((a, b) => b.width - a.width);
  return hd[0] ?? mp4.sort((a, b) => b.width - a.width)[0] ?? null;
}

async function downloadVideo(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  await fs.writeFile(destPath, Buffer.from(await res.arrayBuffer()));
}

export async function fetchBestSceneVideo(
  sceneId: string,
  rawQuery: string,
  minDurationSeconds: number,
  opts: {
    lessonId?: string;
    usedVideoIds?: Set<number>;
    visualFocus?: string;
  } = {},
): Promise<SceneVideoAsset> {
  await fs.mkdir(CACHE_DIR, { recursive: true });

  // Use visualFocus over rawQuery when available — it's more specific
  const query = normalizeQuery(opts.visualFocus ?? rawQuery);

  // Cache key scoped to lesson + scene so two scenes never share a file
  const cacheScope = opts.lessonId ? `${opts.lessonId}-${sceneId}` : sceneId;
  const cacheKey = crypto.createHash('md5').update(`${cacheScope}-${query}-${Math.floor(minDurationSeconds)}`).digest('hex');
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.mp4`);

  // Return cached clip only if it wasn't already used in this lesson render
  if (existsSync(cachePath) && !opts.usedVideoIds?.has(-1)) {
    // Read the stored video ID from a sidecar file if it exists
    const idFile = cachePath + '.id';
    if (existsSync(idFile)) {
      const storedId = parseInt(await fs.readFile(idFile, 'utf-8').catch(() => '0'));
      if (storedId && opts.usedVideoIds?.has(storedId)) {
        console.log(`  📹 ${sceneId}: cache hit but clip already used — fetching fresh`);
        // Fall through to fresh fetch
      } else {
        console.log(`  📹 ${sceneId}: cache hit (${query})`);
        if (storedId) opts.usedVideoIds?.add(storedId);
        return {
          sceneId, source: 'pexels', videoPath: cachePath,
          width: 1280, height: 720, durationSeconds: minDurationSeconds,
          queryUsed: query,
        };
      }
    } else {
      console.log(`  📹 ${sceneId}: cache hit (${query})`);
      return {
        sceneId, source: 'pexels', videoPath: cachePath,
        width: 1280, height: 720, durationSeconds: minDurationSeconds,
        queryUsed: query,
      };
    }
  }

  // Try primary query, then fallbacks — excluding already-used video IDs
  const queriesToTry = [query, ...FALLBACK_QUERIES.filter(q => q !== query)];
  let video: PexelsVideo | null = null;
  let usedQuery = query;

  for (const q of queriesToTry) {
    video = await searchPexelsVideos(q, minDurationSeconds, opts.usedVideoIds).catch(() => null);
    if (video) { usedQuery = q; break; }
  }

  if (!video) {
    throw new Error(`No Pexels video found for "${query}" (tried ${queriesToTry.length} queries)`);
  }

  const file = pickBestFile(video.video_files);
  if (!file) throw new Error(`No suitable video file for Pexels video ${video.id}`);

  console.log(`  📹 ${sceneId}: Pexels ${video.id} (${file.width}×${file.height}, ${video.duration}s) — "${usedQuery}"`);
  await downloadVideo(file.link, cachePath);

  // Store video ID in sidecar for future cache-hit dedup checks
  await fs.writeFile(cachePath + '.id', String(video.id));
  opts.usedVideoIds?.add(video.id);

  return {
    sceneId, source: 'pexels', videoPath: cachePath,
    width: file.width, height: file.height,
    durationSeconds: video.duration,
    attributionUrl: video.url,
    queryUsed: usedQuery,
  };
}
