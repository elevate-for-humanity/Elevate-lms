const SIGNATURE_PARAM = /^(?:x-amz-|x-goog-)|^(?:token|expires|signature|key-pair-id|policy|authorization)$/i;

/** Compare media identity, not the short-lived delivery signature on it. */
export function canonicalMediaUrl(value) {
  if (typeof value !== 'string' || !value) return value;
  let url;
  try { url = new URL(value); } catch { return value; }
  for (const name of [...url.searchParams.keys()]) if (SIGNATURE_PARAM.test(name)) url.searchParams.delete(name);
  url.hash = '';
  return url.toString();
}

export function reconcileCanonicalReleases(releases, lessons) {
  const byCourse = new Map();
  for (const lesson of lessons) {
    const key = String(lesson.course_id);
    if (!byCourse.has(key)) byCourse.set(key, new Map());
    byCourse.get(key).set(String(lesson.id), lesson);
  }
  const findings = [];
  const releaseCourses = new Set();
  for (const release of releases) {
    if (release.status !== 'released') continue;
    const courseId = String(release.course_id);
    releaseCourses.add(courseId);
    const entries = release.package?.lessons;
    if (!Array.isArray(entries) || !entries.length) {
      findings.push({code:'RELEASE_PACKAGE_LESSONS_MISSING',courseId,releaseId:release.id}); continue;
    }
    const seen = new Set();
    const canonical = byCourse.get(courseId) ?? new Map();
    for (const entry of entries) {
      const lessonId = entry?.canonicalLessonId;
      if (!lessonId) {
        findings.push({code:'RELEASE_CANONICAL_ID_MISSING',courseId,releaseId:release.id}); continue;
      }
      if (seen.has(lessonId)) {
        findings.push({code:'RELEASE_DUPLICATE_LESSON_ID',courseId,releaseId:release.id,lessonId}); continue;
      }
      seen.add(lessonId);
      const lesson = canonical.get(String(lessonId));
      if (!lesson) {
        findings.push({code:'RELEASE_CANONICAL_LESSON_MISSING',courseId,releaseId:release.id,lessonId}); continue;
      }
      if (lesson.status !== 'published' || lesson.is_published !== true || lesson.video_status !== 'complete' || !lesson.video_url)
        findings.push({code:'RELEASE_CANONICAL_NOT_READY',courseId,releaseId:release.id,lessonId});
      if (!entry.videoUrl || canonicalMediaUrl(entry.videoUrl) !== canonicalMediaUrl(lesson.video_url))
        findings.push({code:'RELEASE_CANONICAL_VIDEO_DRIFT',courseId,releaseId:release.id,lessonId});
    }
  }
  return {checkedReleases:releases.filter(r=>r.status==='released').length,checkedCourses:releaseCourses.size,findings,ok:findings.length===0};
}
