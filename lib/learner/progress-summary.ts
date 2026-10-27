export type ProgressEnrollment = { course_id: string | null; course_title: string | null; status: string; continue_url: string };
export type PublishedProgressLesson = { id: string; course_id: string; title: string };
export type RecordedLessonProgress = { lesson_id: string; course_id: string; completed: boolean; completed_at: string | null; updated_at: string | null; time_spent_seconds: number | null };

/** All totals are derived from published lesson identities, never imported percentages. */
export function summarizeLearnerProgress(enrollments: ProgressEnrollment[], lessons: PublishedProgressLesson[], rows: RecordedLessonProgress[], scores: number[], now = new Date()) {
  const published = new Map(lessons.map(lesson => [lesson.id, lesson]));
  const recorded = new Map<string, RecordedLessonProgress>();
  for (const row of rows) {
    const lesson = published.get(row.lesson_id);
    if (!lesson || lesson.course_id !== row.course_id) continue;
    const prior = recorded.get(row.lesson_id);
    const timestamp = Date.parse(row.updated_at || row.completed_at || '') || 0;
    const priorTimestamp = prior ? Date.parse(prior.updated_at || prior.completed_at || '') || 0 : 0;
    if (!prior || timestamp > priorTimestamp) recorded.set(row.lesson_id, row);
  }
  const completed = new Set([...recorded.values()].filter(row => row.completed).map(row => row.lesson_id));
  const distinctCourses = new Map(enrollments.filter(row => row.course_id).map(row => [row.course_id!, row]));
  const courses = [...distinctCourses].map(([id, enrollment]) => {
    const courseLessons = [...published.values()].filter(lesson => lesson.course_id === id);
    const done = courseLessons.filter(lesson => completed.has(lesson.id)).length;
    const timestamps = [...recorded.values()].filter(row => row.course_id === id).map(row => row.updated_at || row.completed_at).filter((value): value is string => Boolean(value)).sort();
    const next = courseLessons.find(lesson => !completed.has(lesson.id));
    return { id, title: enrollment.course_title || 'Assigned course', progress: courseLessons.length ? Math.round(done / courseLessons.length * 100) : 0,
      lessonsCompleted: done, totalLessons: courseLessons.length, lastActivity: timestamps.at(-1) || 'No recorded activity',
      nextMilestone: next?.title || (courseLessons.length ? 'Review your completion requirements' : 'Contact staff about published lessons'), continueUrl: enrollment.continue_url };
  });
  const activityDates = new Set([...recorded.values()].filter(row => row.completed && row.completed_at).map(row => row.completed_at!.slice(0, 10)));
  let streak = 0;
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (!activityDates.has(day.toISOString().slice(0, 10))) day.setUTCDate(day.getUTCDate() - 1);
  while (activityDates.has(day.toISOString().slice(0, 10))) { streak++; day.setUTCDate(day.getUTCDate() - 1); }
  const validScores = scores.filter(score => Number.isFinite(score) && score >= 0 && score <= 100);
  return { courses, overallProgress: {
    completionRate: published.size ? Math.round(completed.size / published.size * 100) : 0,
    studyHours: Math.round([...recorded.values()].reduce((sum, row) => sum + Math.max(0, Number(row.time_spent_seconds) || 0), 0) / 3600 * 10) / 10,
    coursesInProgress: courses.filter(course => course.progress < 100).length,
    coursesCompleted: courses.filter(course => course.totalLessons > 0 && course.progress === 100).length,
    streak, averageScore: validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0,
  } };
}
