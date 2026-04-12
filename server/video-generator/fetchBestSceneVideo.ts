import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { SceneVideoAsset } from './types';

const CACHE_DIR = path.join(process.cwd(), 'public', 'videos', 'scene-video-cache');

// ── Visual intent system ──────────────────────────────────────────────────────
//
// Each narration line is classified into one or more VisualIntents.
// Intents drive exact Pexels search queries and clip scoring.
// Replaces the old single-regex QUERY_NORMALIZATIONS which collapsed all
// sanitation content into one generic query string.

type VisualIntent =
  | 'barbicide_submersion'
  | 'hand_washing'
  | 'surface_disinfection'
  | 'sweeping_hair'
  | 'tool_cleaning'
  | 'glove_use'
  | 'station_setup'
  | 'client_consultation'
  | 'haircut_closeup'
  | 'barber_tools_display'
  | 'beard_trim'
  | 'razor_shave'
  | 'neckline_trim'
  | 'fade_blend'
  | 'barbershop_interior';

function detectVisualIntent(text: string): VisualIntent[] {
  const t = text.toLowerCase();
  const intents: VisualIntent[] = [];

  if (/(barbicide|disinfectant jar|immerse|submerge|implements in disinfectant|dip.*tool|tool.*dip)/.test(t))
    intents.push('barbicide_submersion');
  if (/(wash.*hand|hand.*wash|clean.*hand|soap.*water|sanitize.*hand|hand.*sanitiz|hand hygiene)/.test(t))
    intents.push('hand_washing');
  if (/(disinfect.*surface|wipe.*down|sanitize.*station|clean.*chair|clean.*counter|spray.*disinfect)/.test(t))
    intents.push('surface_disinfection');
  if (/(sweep|hair.*floor|floor.*hair|broom|clean.*floor)/.test(t))
    intents.push('sweeping_hair');
  if (/(clean.*tool|brush.*clean|comb.*clean|clipper.*clean|shear.*clean|implement.*clean|sanitize.*tool|tool.*sanitize)/.test(t))
    intents.push('tool_cleaning');
  if (/(glove|put.*on.*glove|wear.*glove|disposable glove)/.test(t))
    intents.push('glove_use');
  if (/(set.*up.*station|prepare.*workstation|station.*setup|workstation.*setup|arrange.*tool)/.test(t))
    intents.push('station_setup');
  if (/(consultation|talk.*client|client.*assessment|discuss.*style|client.*preference|mirror.*client)/.test(t))
    intents.push('client_consultation');
  if (/(cutting.*hair|clipper.*over.*comb|trim.*hair|haircut|taper|blend.*hair)/.test(t))
    intents.push('haircut_closeup');
  if (/(tools.*display|barber.*tools|implements.*ready|tools.*arranged|tools.*counter)/.test(t))
    intents.push('barber_tools_display');
  if (/(beard.*trim|trim.*beard|beard.*shape|shape.*beard|beard.*line)/.test(t))
    intents.push('beard_trim');
  if (/(straight.*razor|razor.*shave|hot.*towel|shave.*face|facial.*shave)/.test(t))
    intents.push('razor_shave');
  if (/(neckline|neck.*trim|trim.*neck|outline.*neck)/.test(t))
    intents.push('neckline_trim');
  if (/(fade|blend|taper|skin.*fade|high.*fade|low.*fade|mid.*fade)/.test(t) && !intents.includes('haircut_closeup'))
    intents.push('fade_blend');
  if (/(barbershop|barber.*shop|salon.*interior|shop.*interior)/.test(t))
    intents.push('barbershop_interior');

  return intents;
}

const INTENT_QUERIES: Record<VisualIntent, string[]> = {
  barbicide_submersion: [
    'barber tools disinfectant jar',
    'comb scissors disinfectant solution',
    'barber implements sanitizing solution',
    'barber tool sterilization',
  ],
  hand_washing: [
    'hands washing soap sink close up',
    'barber washing hands sink',
    'hand hygiene soap water close up',
    'washing hands running water',
  ],
  surface_disinfection: [
    'barber disinfecting chair spray',
    'cleaning barber station spray cloth',
    'wiping salon counter disinfectant',
    'sanitizing salon surface',
  ],
  sweeping_hair: [
    'barber sweeping hair floor broom',
    'salon sweeping floor hair',
    'sweeping barbershop floor',
  ],
  tool_cleaning: [
    'cleaning barber clippers brush',
    'barber sanitizing clippers',
    'barber brushes combs cleaning',
    'cleaning hair cutting tools',
  ],
  glove_use: [
    'putting on disposable gloves close up',
    'barber wearing latex gloves',
    'disposable gloves hands close up',
  ],
  station_setup: [
    'barber station setup tools organized',
    'preparing barber workstation',
    'barbershop tools arranged counter',
  ],
  client_consultation: [
    'barber talking to client mirror',
    'barber consultation chair discussion',
    'barber client conversation barbershop',
  ],
  haircut_closeup: [
    'barber cutting hair clippers close up',
    'clipper haircut close up',
    'barber fade haircut blending',
    'barber trimming hair close up',
  ],
  barber_tools_display: [
    'barber tools on counter arranged',
    'clippers comb scissors barbershop',
    'barber equipment display',
  ],
  beard_trim: [
    'barber trimming beard close up',
    'beard shaping barber',
    'barber beard line up',
  ],
  razor_shave: [
    'barber straight razor shave',
    'hot towel shave barber',
    'barber razor face shave close up',
  ],
  neckline_trim: [
    'barber trimming neckline clippers',
    'barber neck outline clippers',
    'haircut neckline close up',
  ],
  fade_blend: [
    'barber fade haircut clippers blending',
    'skin fade barber close up',
    'barber taper fade clippers',
  ],
  barbershop_interior: [
    'barbershop interior professional',
    'barber shop chairs mirrors',
    'barbershop atmosphere',
  ],
};

const GENERIC_FALLBACKS = [
  'barber cutting hair',
  'barbershop interior',
  'barber clippers close up',
  'barber client chair',
];

// ── Clip scoring ──────────────────────────────────────────────────────────────

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
  width: number;
  height: number;
  video_files: PexelsVideoFile[];
  tags?: Array<{ name: string }>;
}

function scoreClip(
  video: PexelsVideo,
  intent: VisualIntent | null,
  usedIds: Set<number>,
): number {
  if (usedIds.has(video.id)) return -1000;

  let score = 0;
  if (video.width >= video.height) score += 20;
  if (video.duration >= 3 && video.duration <= 10) score += 15;
  else if (video.duration > 10 && video.duration <= 20) score += 5;

  if (!intent) return score;

  const hay = (video.tags ?? []).map((t) => t.name).join(' ').toLowerCase();

  switch (intent) {
    case 'barbicide_submersion':
      if (/disinfect|barber|tool|comb|scissor|jar|solution|sanitize|implement/.test(hay)) score += 60;
      if (/sweep|floor|broom/.test(hay)) score -= 80;
      if (/wash.*hand|sink|soap/.test(hay)) score -= 50;
      if (/haircut|cutting|fade|blend/.test(hay)) score -= 40;
      break;
    case 'hand_washing':
      if (/wash|hand|soap|sink|hygiene|water/.test(hay)) score += 60;
      if (/sweep|floor|hair/.test(hay)) score -= 80;
      if (/clipper|cutting|fade/.test(hay)) score -= 40;
      if (/disinfect|jar|barbicide/.test(hay)) score -= 30;
      break;
    case 'surface_disinfection':
      if (/disinfect|wipe|spray|clean|sanitize|surface|chair|counter/.test(hay)) score += 60;
      if (/hand|soap|sink/.test(hay)) score -= 30;
      if (/sweep|floor/.test(hay)) score -= 50;
      break;
    case 'sweeping_hair':
      if (/sweep|broom|floor|hair/.test(hay)) score += 60;
      if (/disinfect|wash|sink/.test(hay)) score -= 50;
      break;
    case 'tool_cleaning':
      if (/clean|brush|clipper|comb|tool|sanitize|implement/.test(hay)) score += 60;
      if (/sweep|floor/.test(hay)) score -= 60;
      if (/wash.*hand|sink/.test(hay)) score -= 30;
      break;
    case 'glove_use':
      if (/glove|disposable|latex|protective/.test(hay)) score += 60;
      break;
    case 'station_setup':
      if (/station|workstation|setup|arrange|tool|counter|organized/.test(hay)) score += 60;
      break;
    case 'client_consultation':
      if (/consult|client|talk|mirror|discuss/.test(hay)) score += 60;
      if (/sweep|floor|disinfect/.test(hay)) score -= 40;
      break;
    case 'haircut_closeup':
      if (/haircut|clipper|cutting|trim|fade|taper|blend/.test(hay)) score += 60;
      if (/sweep|floor|disinfect|wash/.test(hay)) score -= 60;
      break;
    case 'barber_tools_display':
      if (/tool|clipper|comb|scissor|display|arranged/.test(hay)) score += 60;
      break;
    case 'beard_trim':
      if (/beard|trim|shape|line/.test(hay)) score += 60;
      if (/sweep|floor|disinfect/.test(hay)) score -= 50;
      break;
    case 'razor_shave':
      if (/razor|shave|straight|hot.*towel/.test(hay)) score += 60;
      break;
    case 'neckline_trim':
      if (/neckline|neck|outline|trim/.test(hay)) score += 60;
      break;
    case 'fade_blend':
      if (/fade|blend|taper|skin.*fade/.test(hay)) score += 60;
      break;
    case 'barbershop_interior':
      if (/barbershop|salon|interior|chair|mirror/.test(hay)) score += 60;
      break;
  }

  return score;
}

// ── Pexels API ────────────────────────────────────────────────────────────────

async function searchPexelsVideos(
  query: string,
  minDuration: number,
  excludeIds: Set<number>,
  intent: VisualIntent | null,
): Promise<PexelsVideo | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error('PEXELS_API_KEY not set');

  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape&size=medium`;
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);

  const data = await res.json() as { videos: PexelsVideo[] };
  const candidates = (data.videos ?? []).filter((v) => !excludeIds.has(v.id));
  if (candidates.length === 0) return null;

  const ranked = candidates
    .map((v) => ({ video: v, score: scoreClip(v, intent, excludeIds) }))
    .filter((x) => x.score > -100)
    .sort((a, b) => b.score - a.score);

  const meetsLength = ranked.filter((x) => x.video.duration >= minDuration);
  const best = meetsLength[0] ?? ranked.sort((a, b) => b.video.duration - a.video.duration)[0];
  return best?.video ?? null;
}

function pickBestFile(files: PexelsVideoFile[]): PexelsVideoFile | null {
  const mp4 = files.filter((f) => f.file_type === 'video/mp4' && f.width >= f.height);
  const hd = mp4.filter((f) => f.width >= 1280).sort((a, b) => b.width - a.width);
  return hd[0] ?? mp4.sort((a, b) => b.width - a.width)[0] ?? null;
}

async function downloadVideo(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  await fs.writeFile(destPath, Buffer.from(await res.arrayBuffer()));
}

// ── Public API ────────────────────────────────────────────────────────────────

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

  const intentSource = opts.visualFocus ?? rawQuery;
  const intents = detectVisualIntent(intentSource);
  const primaryIntent = intents[0] ?? null;

  const intentQueries = primaryIntent ? INTENT_QUERIES[primaryIntent] : [];
  const allQueries = [
    ...intentQueries,
    ...GENERIC_FALLBACKS.filter((q) => !intentQueries.includes(q)),
  ];

  const cacheScope = opts.lessonId ? `${opts.lessonId}-${sceneId}` : sceneId;
  const intentTag = primaryIntent ?? 'generic';
  const cacheKey = crypto
    .createHash('md5')
    .update(`${cacheScope}-${intentTag}-${Math.floor(minDurationSeconds)}`)
    .digest('hex');
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.mp4`);
  const idFile = cachePath + '.id';

  if (existsSync(cachePath)) {
    const storedId = existsSync(idFile)
      ? parseInt(await fs.readFile(idFile, 'utf-8').catch(() => '0'))
      : 0;

    if (storedId && opts.usedVideoIds?.has(storedId)) {
      console.log(`  📹 ${sceneId}: cache hit but clip already used — fetching fresh`);
    } else {
      console.log(`  📹 ${sceneId}: cache hit [${intentTag}]`);
      if (storedId) opts.usedVideoIds?.add(storedId);
      return {
        sceneId, source: 'pexels', videoPath: cachePath,
        width: 1280, height: 720, durationSeconds: minDurationSeconds,
        queryUsed: intentQueries[0] ?? rawQuery,
      };
    }
  }

  let video: PexelsVideo | null = null;
  let usedQuery = allQueries[0] ?? rawQuery;

  for (const q of allQueries) {
    video = await searchPexelsVideos(
      q, minDurationSeconds, opts.usedVideoIds ?? new Set(), primaryIntent,
    ).catch(() => null);
    if (video) { usedQuery = q; break; }
  }

  if (!video) {
    throw new Error(
      `No Pexels video found for intent "${intentTag}" — tried ${allQueries.length} queries`,
    );
  }

  const file = pickBestFile(video.video_files);
  if (!file) throw new Error(`No suitable video file for Pexels video ${video.id}`);

  console.log(
    `  📹 ${sceneId}: Pexels ${video.id} [${intentTag}] (${file.width}x${file.height}, ${video.duration}s) — "${usedQuery}"`,
  );

  await downloadVideo(file.link, cachePath);
  await fs.writeFile(idFile, String(video.id));
  opts.usedVideoIds?.add(video.id);

  return {
    sceneId, source: 'pexels', videoPath: cachePath,
    width: file.width, height: file.height,
    durationSeconds: video.duration,
    attributionUrl: video.url,
    queryUsed: usedQuery,
  };
}
