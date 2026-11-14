/** Stable URL avoids restarting playback whenever status polling refreshes. */
export function adminPreviewPlaybackUrl(buildId, lessonBuildId, source) {
  return '/api/admin/ultimate-course-builder/preview?' + new URLSearchParams({
    buildId, lessonBuildId, revision: source.split('?')[0],
  });
}
