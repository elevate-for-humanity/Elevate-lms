const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Open the existing authorized lesson viewer; never dispatch an authoring job. */
export function coursePreviewTarget(courseId: unknown, lessonId: unknown): string | null {
  if (
    typeof courseId !== 'string' ||
    typeof lessonId !== 'string' ||
    !UUID.test(courseId) ||
    !UUID.test(lessonId)
  )
    return null;
  return `/api/admin/videos/lesson-preview?courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`;
}
