/**
 * lib/video/pexels.ts
 *
 * Free background images from Pexels API.
 * API key is free at pexels.com/api — no credit card required.
 * Falls back to Pollinations.ai (zero-key AI images) if Pexels is unavailable.
 */

import { logger } from '@/lib/logger';

const DEFAULT_TOPIC_QUERY = 'professional learning education';
const TOPIC_QUERIES: Record<string, string> = {
  foundations: 'community support people helping',
  ethics: 'professional meeting office trust',
  advocacy: 'people talking support community',
  cultural_competency: 'diverse people community culture',
  documentation: 'writing notes professional workspace',
  career_readiness: 'professional career success workplace',
  hvac: 'hvac technician air conditioning',
  electrical: 'electrical wiring professional',
  barber: 'barbershop professional grooming',
  business: 'diverse small business owners planning marketing finance customer service',
  default: DEFAULT_TOPIC_QUERY,
};

interface PexelsPhoto {
  id: number;
  src: { landscape: string; large2x: string; original: string };
  alt: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
  total_results: number;
}

export async function getPexelsImage(
  domainKey: string,
  options: {
    orientation?: 'landscape' | 'portrait' | 'square';
    perPage?: number;
    query?: string;
  } = {},
): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    logger.warn('[pexels] PEXELS_API_KEY not set — falling back to Pollinations');
    return getPollinationsImage(domainKey, options.query);
  }

  const query = options.query?.trim() || TOPIC_QUERIES[domainKey] || DEFAULT_TOPIC_QUERY;
  const { orientation = 'landscape', perPage = 10 } = options;

  try {
    const url = new URL('https://api.pexels.com/v1/search');
    url.searchParams.set('query', query);
    url.searchParams.set('orientation', orientation);
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('size', 'large');

    const res = await fetch(url.toString(), {
      headers: { Authorization: apiKey },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      logger.warn('[pexels] API error', { status: res.status });
      return getPollinationsImage(domainKey, options.query);
    }

    const data: PexelsResponse = await res.json();
    if (!data.photos?.length) return getPollinationsImage(domainKey, options.query);

    const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
    if (!photo) return getPollinationsImage(domainKey, options.query);
    return photo.src.large2x ?? photo.src.landscape;
  } catch (err) {
    logger.warn('[pexels] fetch error', { err });
    return getPollinationsImage(domainKey, options.query);
  }
}

export function getPollinationsImage(domainKey: string, customPrompt?: string): string {
  const prompt = customPrompt?.trim() || TOPIC_QUERIES[domainKey] || DEFAULT_TOPIC_QUERY;
  const encoded = encodeURIComponent(
    `${prompt}, professional, cinematic lighting, high quality, 16:9`,
  );
  return `https://image.pollinations.ai/prompt/${encoded}?width=1920&height=1080&nologo=true`;
}

interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  link: string;
  width: number;
  height: number;
}

interface PexelsVideo {
  id: number;
  duration: number;
  video_files: PexelsVideoFile[];
}

interface PexelsVideoResponse {
  videos: PexelsVideo[];
  total_results: number;
}

/**
 * Fetch a stock video clip URL from Pexels for a given keyword.
 * Requests media in the target orientation so vertical/square exports do not
 * begin by cropping a landscape composition. Falls back to any usable file.
 */
export async function getPexelsVideoClip(
  keyword: string,
  options: {
    minDuration?: number;
    maxDuration?: number;
    perPage?: number;
    orientation?: 'landscape' | 'portrait' | 'square';
  } = {},
): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    logger.warn('[pexels] PEXELS_API_KEY not set — no video clip available');
    return null;
  }

  const { minDuration = 5, maxDuration = 30, perPage = 10, orientation = 'landscape' } = options;

  try {
    const url = new URL('https://api.pexels.com/videos/search');
    url.searchParams.set('query', keyword);
    url.searchParams.set('orientation', orientation);
    url.searchParams.set('size', 'medium');
    url.searchParams.set('per_page', String(perPage));

    const res = await fetch(url.toString(), {
      headers: { Authorization: apiKey },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      logger.warn('[pexels] Video API error', { status: res.status });
      return null;
    }

    const data: PexelsVideoResponse = await res.json();
    if (!data.videos?.length) return null;

    const suitable = data.videos.filter(
      (v) => v.duration >= minDuration && v.duration <= maxDuration,
    );
    const pool = suitable.length ? suitable : data.videos;
    const video = pool[Math.floor(Math.random() * pool.length)];
    if (!video) return null;

    const orientationMatches = (file: PexelsVideoFile) => {
      if (orientation === 'portrait') return file.height > file.width;
      if (orientation === 'square')
        return Math.abs(file.width - file.height) <= Math.max(file.width, file.height) * 0.12;
      return file.width >= file.height;
    };

    const hdFile =
      video.video_files.find(
        (f) => orientationMatches(f) && f.quality === 'hd' && Math.max(f.width, f.height) >= 1280,
      ) ??
      video.video_files.find(
        (f) => orientationMatches(f) && f.quality === 'sd' && Math.max(f.width, f.height) >= 640,
      ) ??
      video.video_files.find(orientationMatches) ??
      video.video_files.find((f) => f.quality === 'hd' && f.width >= 1280) ??
      video.video_files.find((f) => f.quality === 'sd' && f.width >= 640) ??
      video.video_files[0];

    return hdFile?.link ?? null;
  } catch (err) {
    logger.warn('[pexels] video fetch error', { err });
    return null;
  }
}

export async function getSceneVideoClips(
  keywords: string[],
): Promise<Record<string, string | null>> {
  const unique = [...new Set(keywords)];
  const results: Record<string, string | null> = {};

  for (const keyword of unique) {
    results[keyword] = await getPexelsVideoClip(keyword);
    await new Promise((r) => setTimeout(r, 200));
  }

  return results;
}

export async function getCourseBackgroundImages(
  domainKeys: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(domainKeys)];
  const results: Record<string, string> = {};

  await Promise.all(
    unique.map(async (key) => {
      const url = await getPexelsImage(key);
      results[key] = url ?? getPollinationsImage(key);
    }),
  );

  return results;
}
