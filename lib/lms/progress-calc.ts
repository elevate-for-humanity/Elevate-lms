/**
 * LMS progress calculation — single source of truth.
 *
 * All progress percentages stored in program_enrollments.progress_percent
 * are computed by this module. Do not inline the formula elsewhere.
 *
 * Canonical read: program_enrollments.progress_percent (already written by the engine).
 * Canonical write: recordStepCompletion / recordStepUncompletion in lib/lms/engine/completion.ts.
 */

/**
 * Compute progress percentage from lesson counts.
 * Returns an integer 0–100. Safe when totalLessons is 0 (returns 0).
 */
export function calcProgressPercent(completedLessons: number, totalLessons: number): number {
  if (totalLessons <= 0) return 0;
  return Math.round((Math.min(completedLessons, totalLessons) / totalLessons) * 100);
}

/**
 * Determine whether a course is complete given a progress percentage and lesson count.
 * Requires at least one lesson to exist — a course with no lessons is never "complete".
 */
export function isCourseComplete(progressPercent: number, totalLessons: number): boolean {
  return progressPercent === 100 && totalLessons > 0;
}
