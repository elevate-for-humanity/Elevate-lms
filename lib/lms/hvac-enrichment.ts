/**
 * HVAC-specific enrichment layer.
 *
 * Adds key terms, diagrams, job applications, watch-for items,
 * captions, quick checks, and recaps to generic lesson data.
 *
 * This is the ONLY file that should import HVAC-specific TS data.
 * All other LMS code should use the generic program-curriculum loader.
 */

import { HVAC_LESSON_CONTENT } from '@/lib/courses/hvac-lesson-content';
import '@/lib/courses/hvac-epa608-lessons'; // Side-effect: populates HVAC_LESSON_CONTENT
import { HVAC_LESSON_UUID, HVAC_COURSE_ID } from '@/lib/courses/hvac-uuids';
import { HVAC_LESSON_NUMBER_TO_DEF_ID } from '@/lib/courses/hvac-lesson-number-map';

export { HVAC_COURSE_ID };

export interface HvacEnrichment {
  keyTerms: { term: string; definition: string }[];
  jobApplication: string;
  watchFor: string[];
  diagramRef: string | null;
  concept: string;
}

/**
 * Check if a course is the HVAC course.
 */
export function isHvacCourse(courseId: string): boolean {
  return courseId === HVAC_COURSE_ID;
}

/**
 * Get HVAC enrichment data for a lesson.
 * Returns null if the lesson has no HVAC enrichment.
 */
export function getHvacEnrichment(lessonId: string, lessonNumber?: number): HvacEnrichment | null {
  // Try by lesson number → defId → content
  const defId = lessonNumber
    ? HVAC_LESSON_NUMBER_TO_DEF_ID[lessonNumber]
    : Object.entries(HVAC_LESSON_UUID).find(([, uuid]) => uuid === lessonId)?.[0];

  if (!defId) return null;

  const content = HVAC_LESSON_CONTENT[defId];
  if (!content) return null;

  return {
    keyTerms: content.keyTerms || [],
    jobApplication: content.jobApplication || '',
    watchFor: content.watchFor || [],
    diagramRef: content.diagramRef || null,
    concept: content.concept || '',
  };
}

/**
 * Get the defId for a lesson number (e.g., 1 → 'hvac-01-01').
 */
export function getDefIdForLessonNumber(lessonNumber: number): string | null {
  return HVAC_LESSON_NUMBER_TO_DEF_ID[lessonNumber] || null;
}
