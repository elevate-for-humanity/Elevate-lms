const LOCAL_BARBER_PREFIX = '/videos/barber-lessons/';

function supabaseBarberCdnUrl(slug: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/course-videos/barber/${slug}.mp4`;
}

const AUDIO_FALLBACK_MAP: Record<string, string> = {
  '/videos/barber-client-experience.mp4': '/videos/barber-client-experience.mp3',
  '/videos/barber-shop-culture.mp4': '/videos/barber-shop-culture.mp3',
};

function withAudioFallback(url: string | null | undefined): string | null {
  if (!url) return null;
  return AUDIO_FALLBACK_MAP[url] ?? url;
}

function mapLocalBarberPath(url: string, slug: string | null | undefined): string {
  if (!url.includes(LOCAL_BARBER_PREFIX)) return url;
  const derivedSlug =
    slug ?? url.replace(LOCAL_BARBER_PREFIX, '').replace(/\.mp4$/i, '').split('/').pop();
  if (!derivedSlug) return url;
  const cdn = supabaseBarberCdnUrl(derivedSlug);
  return cdn ?? url;
}

export function resolveBarberLessonVideoUrl(
  slug: string | null | undefined,
  videoConfig?: Record<string, string> | null,
  videoUrl?: string | null,
): string | null {
  if (!slug && !videoUrl && !videoConfig?.videoFile) return null;
  if (videoUrl) return withAudioFallback(mapLocalBarberPath(videoUrl, slug ?? null));
  if (videoConfig?.videoFile) {
    return withAudioFallback(mapLocalBarberPath(videoConfig.videoFile, slug ?? null));
  }
  if (slug) {
    const cdn = supabaseBarberCdnUrl(slug);
    if (cdn) return cdn;
  }
  return null;
}
