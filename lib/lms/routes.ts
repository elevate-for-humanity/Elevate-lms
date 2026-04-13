/**
 * Canonical LMS route helpers.
 *
 * Use these instead of hardcoded strings so that when the programs/courses
 * path is canonicalized, only this file needs to change.
 *
 * Current canonical paths:
 *   Authenticated learner experience → /lms/courses/[courseId]
 *   Public program catalog           → /lms/programs
 *
 * When the rename is complete, update COURSE_BASE to '/lms/programs'
 * and all callers will follow automatically.
 */

const COURSE_BASE = '/lms/courses';
const PROGRAM_BASE = '/lms/programs';

/** Authenticated course landing page */
export function getCoursePath(courseId: string): string {
  return `${COURSE_BASE}/${courseId}`;
}

/** Authenticated lesson page */
export function getLessonPath(courseId: string, lessonId: string): string {
  return `${COURSE_BASE}/${courseId}/lessons/${lessonId}`;
}

/** Authenticated lesson page with activity tab */
export function getLessonActivityPath(
  courseId: string,
  lessonId: string,
  activity: 'video' | 'reading' | 'flashcards' | 'lab' | 'practice' | 'checkpoint' | 'notes' | 'resources',
): string {
  return `${COURSE_BASE}/${courseId}/lessons/${lessonId}?activity=${activity}`;
}

/** Public program catalog */
export function getProgramCatalogPath(): string {
  return PROGRAM_BASE;
}

/** Public program detail page */
export function getProgramPath(slug: string): string {
  return `${PROGRAM_BASE}/${slug}`;
}
