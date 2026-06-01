/**
 * Resolve barber lesson video URLs for LMS playback.
 *
 * course_lessons often store `/videos/barber-lessons/{slug}.mp4` after local generation.
 * Those files are not deployed to ECS (gitignored). Canonical playback uses Supabase
 * Storage: course-videos/barber/{slug}.mp4
 */

const BARBER_LOCAL_PREFIX = '/videos/barber-lessons/';
const BARBER_STORAGE_PREFIX = 'barber/';

export function resolveBarberLessonVideoUrl(
  slug: string | null | undefined,
  videoUrl?: string | null,
  videoConfig?: Record<string, string> | null,
): string | null {
  const fromConfig = videoConfig?.videoFile?.trim() || null;
  const raw = (videoUrl?.trim() || fromConfig) ?? null;

  if (raw?.startsWith('http://') || raw?.startsWith('https://')) {
    return raw;
  }

  const lessonSlug =
    slug ||
    (raw?.startsWith(BARBER_LOCAL_PREFIX)
      ? raw.slice(BARBER_LOCAL_PREFIX.length).replace(/\.mp4$/i, '')
      : null);

  if (!lessonSlug) {
    return raw;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const shouldUseCdn =
    supabaseUrl && (!raw || raw.startsWith(BARBER_LOCAL_PREFIX) || raw.startsWith('/videos/'));

  if (shouldUseCdn) {
    return `${supabaseUrl}/storage/v1/object/public/course-videos/${BARBER_STORAGE_PREFIX}${lessonSlug}.mp4`;
  }

  if (raw) {
    return raw;
  }

  return `${BARBER_LOCAL_PREFIX}${lessonSlug}.mp4`;
}

/** Local dev URL — works as soon as MP4 is written under public/ */
export function localBarberLessonVideoPath(slug: string): string {
  return `${BARBER_LOCAL_PREFIX}${slug}.mp4`;
}
