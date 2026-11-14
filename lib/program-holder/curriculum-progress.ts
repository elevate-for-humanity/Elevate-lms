/** Persisted build state is independent of assignment, review, and publication. */
export function curriculumProgress(course: any, delivery?: any) {
  const published = delivery
    ? delivery.is_published === true &&
      delivery.status === 'published' &&
      delivery.is_active !== false
    : course?.status === 'published' && course?.is_active !== false;
  if (!course)
    return {
      status: 'Build record unavailable',
      percent: null,
      published,
      review: delivery?.review_status || 'Not recorded',
    };
  const percent =
    typeof course.generation_progress === 'number' && Number.isFinite(course.generation_progress)
      ? Math.max(0, Math.min(100, course.generation_progress))
      : null;
  return {
    status: course.generation_paused ? 'Paused' : String(course.generation_status || 'Not started'),
    percent,
    published,
    review: course.review_status || 'Not recorded',
    updatedAt: course.updated_at || null,
  };
}
