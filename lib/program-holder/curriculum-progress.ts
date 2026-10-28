/** Persisted build state is independent of assignment, review, and publication. */
export function curriculumProgress(course: any) {
  if (!course) return { status: 'Build record unavailable', percent: null, published: false };
  const percent =
    typeof course.generation_progress === 'number' && Number.isFinite(course.generation_progress)
      ? Math.max(0, Math.min(100, course.generation_progress))
      : null;
  return {
    status: course.generation_paused ? 'Paused' : String(course.generation_status || 'Not started'),
    percent,
    published: course.status === 'published' && course.is_active !== false,
    review: course.review_status || 'Not recorded',
    updatedAt: course.updated_at || null,
  };
}
