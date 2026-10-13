import 'server-only';
import { getSignedElevateMediaUrl, getElevateMediaStorageConfig } from './elevate-media-storage';

export function managedLessonPlaybackUrl(source: string, courseId: string, lessonId: string) {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const media = getElevateMediaStorageConfig().publicUrl.replace(/\/$/, '');
  return (supabase && ['course-videos', 'course_videos'].some(bucket => source.startsWith(`${supabase}/storage/v1/object/public/${bucket}/`))) ||
    (media && source.startsWith(`${media}/`))
    ? `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/playback`
    : source;
}

/** Only server-owned lesson references are accepted. Never sign a user URL or
 * object key supplied in the playback request. Preserve existing immutable media.
 */
export async function signedLessonPlayback(db: any, source: string) {
  const validKey = (key: string) => key && !key.split('/').some(part => part === '..' || part === '.') &&
    ![...key].some(character => character.charCodeAt(0) < 32 || character === '\\');
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const bucket = supabase ? ['course-videos', 'course_videos'].find(value => source.startsWith(`${supabase}/storage/v1/object/public/${value}/`)) : undefined;
  const prefix = bucket ? `${supabase}/storage/v1/object/public/${bucket}/` : '';
  if (prefix && bucket) {
    const key = decodeURIComponent(source.slice(prefix.length).split('?')[0]);
    if (!validKey(key)) throw new Error('LESSON_MEDIA_REFERENCE_INVALID');
    const { data, error } = await db.storage.from(bucket).createSignedUrl(key, 3600);
    if (error || !data?.signedUrl) throw new Error('LESSON_MEDIA_SIGNING_FAILED');
    return data.signedUrl;
  }
  const config = getElevateMediaStorageConfig();
  const base = config.publicUrl.replace(/\/$/, '');
  if (base && source.startsWith(`${base}/`)) {
    const key = decodeURIComponent(source.slice(base.length + 1).split('?')[0]);
    if (!validKey(key)) throw new Error('LESSON_MEDIA_REFERENCE_INVALID');
    const url = await getSignedElevateMediaUrl(key, 3600);
    if (!url) throw new Error('LESSON_MEDIA_SIGNING_FAILED');
    return url;
  }
  throw new Error('LESSON_MEDIA_STORAGE_REFERENCE_REQUIRED');
}
