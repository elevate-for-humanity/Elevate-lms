/** Ordinary continuation preserves completed lessons; explicit repair may revisit them. */
export function preservedCourseCursor(
  profile,
  payload,
  publishedLessons,
  completedLessons,
) {
  if (
    payload.competencyId ||
    payload.lessonBuildId ||
    payload.acceptance ||
    payload.ownerPreview ||
    payload.checkpointRepair
  )
    return payload;
  const done = new Set(
    completedLessons
      .filter((row) => row.status === "built" && publishedLessons.some(canonical =>
        canonical.id === profile.canonicalLessonIds?.[row.competency_id] &&
        canonical.video_status === 'complete' && canonical.video_url &&
        canonical.media_attachment?.sourceLessonBuildId === row.id &&
        row.render_source && canonical.film?.videoUrl === row.render_source &&
        row.captions_source && canonical.film?.captionsUrl === row.captions_source &&
        row.transcript_source && canonical.film?.transcriptUrl === row.transcript_source))
      .map((row) => row.competency_id),
  );
  for (const competency of profile.competencies) {
    const canonicalId = profile.canonicalLessonIds?.[competency.id];
    if (
      publishedLessons.some(
        (row) =>
          row.id === canonicalId &&
          row.status === "published" &&
          row.is_published === true &&
          row.approved === true &&
          row.video_status === "complete" &&
          row.media_quality_status === "approved" &&
          row.video_url &&
          row.video_job_id,
      )
    )
      done.add(competency.id);
  }
  let index = Number.isInteger(payload.nextCompetencyIndex)
    ? Math.max(0, payload.nextCompetencyIndex)
    : 0;
  while (
    index < profile.competencies.length - 1 &&
    done.has(profile.competencies[index].id)
  )
    index++;
  return {
    ...payload,
    nextCompetencyIndex: index,
    repairCompetencyId: undefined,
    repairCompetencyIds: (payload.repairCompetencyIds || []).filter(
      (id) => !done.has(id),
    ),
    unresolvedCompetencyIds: (payload.unresolvedCompetencyIds || []).filter(
      (id) => !done.has(id),
    ),
  };
}
