/** Resolve review playback from durable media identity, never a saved expiring URL. */
export async function resolveCourseVideoPlayback(video, { signExternal, signLegacy }) {
  const key = String(video.storage_path ?? '');
  if (key.startsWith('course-videos/manual-lessons/')) {
    const prefix = `course-videos/manual-lessons/${video.course_id}/${video.lesson_id}/`;
    if (!key.startsWith(prefix) || !/^[a-f0-9-]+\.(mp4|webm|mov)$/i.test(key.slice(prefix.length))) {
      throw new Error('MANUAL_LESSON_STORAGE_IDENTITY_MISMATCH');
    }
    // A failed renewal must not return the stale URL or use another bucket.
    const url = await signExternal(key);
    if (!url) throw new Error('MANUAL_LESSON_PLAYBACK_RENEWAL_FAILED');
    return url;
  }
  if (video.video_url) return video.video_url;
  return key ? await signLegacy(key) : '';
}
