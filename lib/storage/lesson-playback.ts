import 'server-only';
import { hydrateProcessEnv } from '@/lib/secrets';
import { resolveServerSupabaseRawEnv } from '@/lib/supabase/public-config';
import { getSignedElevateMediaUrl, getElevateMediaStorageConfig } from './elevate-media-storage';

function ownedB2ObjectKey(source: string, bucket: string): string | null {
  if (!bucket) return null;
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    let prefix = '';
    const virtual = url.hostname.match(/^(.+)\.s3\.([a-z0-9-]+)\.backblazeb2\.com$/);
    if (virtual?.[1] === bucket) prefix = `${url.origin}/`;
    else if (/^s3\.[a-z0-9-]+\.backblazeb2\.com$/.test(url.hostname)) prefix = `${url.origin}/${encodeURIComponent(bucket)}/`;
    else if (/^f[0-9]+\.backblazeb2\.com$/.test(url.hostname)) prefix = `${url.origin}/file/${encodeURIComponent(bucket)}/`;
    if (!prefix || !source.startsWith(prefix)) return null;
    return decodeURIComponent(source.slice(prefix.length).split(/[?#]/)[0]);
  } catch { return null; }
}

export function managedLessonPlaybackUrl(source: string, courseId: string, lessonId: string) {
  const supabase = resolveServerSupabaseRawEnv().url;
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
    (media && source.startsWith(`${media}/`)) || privatePrefixes.some(prefix => source.startsWith(prefix)) ||
    ownedB2ObjectKey(source, config.bucket || 'elevate-course-media') !== null
    ? `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/playback`
    : source;
}

/** Only server-owned lesson references are accepted. Never sign a user URL or
 * object key supplied in the playback request. Preserve existing immutable media.
 */
export async function signedLessonPlayback(db: any, source: string) {
  await hydrateProcessEnv();
  const validKey = (key: string) => key && !key.split('/').some(part => part === '..' || part === '.') &&
    ![...key].some(character => character.charCodeAt(0) < 32 || character === '\\');
  const supabase = resolveServerSupabaseRawEnv().url;
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
  // The B2 bucket name is globally unique. Renew older regional/native
  // references against the currently verified connection to this exact bucket.
  const b2 = config.provider === 'backblaze-b2' || /\.backblazeb2\.com\/?$/.test(config.endpoint || '');
  const b2Key = b2 ? ownedB2ObjectKey(source, config.bucket) : null;
  if (b2Key !== null) {
    if (!validKey(b2Key)) throw new Error('LESSON_MEDIA_REFERENCE_INVALID');
    const url = await getSignedElevateMediaUrl(b2Key, 3600);
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
