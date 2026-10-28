import 'server-only';
import { getSignedElevateMediaUrl, getElevateMediaStorageConfig } from './elevate-media-storage';

export function managedLessonPlaybackUrl(source: string, courseId: string, lessonId: string) {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const config = getElevateMediaStorageConfig();
  const media = config.publicUrl.replace(/\/$/, '');
  const privatePrefixes: string[] = [];
  if (config.endpoint && config.bucket) {
    const endpoint = new URL(config.endpoint);
    const virtual = new URL(endpoint);
    virtual.hostname = `${config.bucket}.${endpoint.hostname}`;
    privatePrefixes.push(`${virtual.origin}/`, `${endpoint.origin}/${encodeURIComponent(config.bucket)}/`);
  }
  return (supabase && ['course-videos', 'course_videos'].some(bucket =>
    ['public', 'sign', 'authenticated'].some(mode => source.startsWith(`${supabase}/storage/v1/object/${mode}/${bucket}/`)))) ||
    (media && source.startsWith(`${media}/`)) || privatePrefixes.some(prefix => source.startsWith(prefix))
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
  const reference = supabase ? ['course-videos', 'course_videos'].flatMap(bucket =>
    ['public', 'sign', 'authenticated'].map(mode => ({ bucket, prefix: `${supabase}/storage/v1/object/${mode}/${bucket}/` })))
    .find(value => source.startsWith(value.prefix)) : undefined;
  const bucket = reference?.bucket;
  const prefix = reference?.prefix;
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
  // Saved private renders may use the configured S3 endpoint rather than a
  // public delivery host. Renew that exact bucket reference, never an input URL.
  if (config.endpoint && config.bucket) {
    const endpoint = new URL(config.endpoint);
    const virtual = new URL(endpoint);
    virtual.hostname = `${config.bucket}.${endpoint.hostname}`;
    const prefixes = [virtual.origin + '/', endpoint.origin + '/' + encodeURIComponent(config.bucket) + '/'];
    const prefix = prefixes.find(value => source.startsWith(value));
    if (prefix) {
      const key = decodeURIComponent(source.slice(prefix.length).split('?')[0]);
      if (!validKey(key)) throw new Error('LESSON_MEDIA_REFERENCE_INVALID');
      const url = await getSignedElevateMediaUrl(key, 3600);
      if (!url) throw new Error('LESSON_MEDIA_SIGNING_FAILED');
      return url;
    }
  }
  throw new Error('LESSON_MEDIA_STORAGE_REFERENCE_REQUIRED');
}
