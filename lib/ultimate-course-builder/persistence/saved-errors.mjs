/**
 * The authoritative current finding for a failed lesson lives on the failing
 * step (`ultimate_lesson_steps.findings`). `ultimate_lesson_builds.findings` is
 * frequently empty. Reading only the latter meant the caption-coverage and
 * teaching-visibility recoveries never fired, so a media role repeated the same
 * unchanged producer until its attempts ran out. Merge both, step first, and
 * de-duplicate by code+message+step.
 */
export function deriveSavedErrors(steps, lesson) {
  const fromSteps = Array.isArray(steps)
    ? steps.flatMap((row) =>
        row?.state === 'failed' && Array.isArray(row.findings)
          ? row.findings.filter((finding) => finding?.severity === 'error')
          : [],
      )
    : [];
  const fromLesson = Array.isArray(lesson?.findings)
    ? lesson.findings.filter((finding) => finding?.severity === 'error')
    : [];
  return [...fromSteps, ...fromLesson].filter(
    (finding, index, all) =>
      all.findIndex(
        (other) =>
          other?.code === finding?.code &&
          other?.message === finding?.message &&
          other?.step === finding?.step,
      ) === index,
  );
}
