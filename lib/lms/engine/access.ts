/**
 * canAccessLesson
 *
 * Returns an AccessDecision for a learner attempting to view a lesson.
 *
 * Rules (evaluated in order):
 * 1. Lesson must be published.
 * 2. Sequential lock: all lessons with a lower lesson_order in the same
 *    module must be completed (or passed, for gated types).
 * 3. Gated types (quiz/checkpoint/exam): prior lesson in sequence must
 *    have a passing checkpoint_scores row before this lesson unlocks.
 * 4. Review types (lab/assignment): accessible immediately; instructor
 *    sign-off is required to advance past them, not to view them.
 */

import type {
  EngineLesson, LearnerProgress, AccessDecision, LearnerState,
} from './types';
import { GATED_STEP_TYPES } from './types';

export function canAccessLesson(
  lesson: EngineLesson,
  allLessonsInCourse: EngineLesson[],
  progress: LearnerProgress
): AccessDecision {
  // Unpublished lessons are never accessible to learners
  if (lesson.status !== 'published') {
    return { canAccess: false, state: 'blocked', reason: 'Lesson not yet published.' };
  }

  // Sort all lessons by module then lesson order for sequential check
  const ordered = [...allLessonsInCourse]
    .filter(l => l.status === 'published')
    .sort((a, b) =>
      a.moduleOrder !== b.moduleOrder
        ? a.moduleOrder - b.moduleOrder
        : a.lessonOrder - b.lessonOrder
    );

  const lessonIndex = ordered.findIndex(l => l.id === lesson.id);

  // First lesson is always accessible
  if (lessonIndex <= 0) {
    return { canAccess: true, state: resolveState(lesson, progress), reason: null };
  }

  // Check all prior lessons are unblocked
  for (let i = 0; i < lessonIndex; i++) {
    const prior = ordered[i];
    const priorBlocked = isPriorLessonBlocking(prior, progress);
    if (priorBlocked) {
      return {
        canAccess: false,
        state: 'blocked',
        reason: `Complete "${prior.lessonTitle}" before accessing this lesson.`,
      };
    }
  }

  return { canAccess: true, state: resolveState(lesson, progress), reason: null };
}

/**
 * Returns true if this lesson is blocking progression past it.
 * - Regular lessons: must be marked complete in lesson_progress.
 * - Gated types: must have a passing checkpoint_scores row.
 * - Review types: must have an approved step_submission.
 */
function isPriorLessonBlocking(lesson: EngineLesson, progress: LearnerProgress): boolean {
  if (GATED_STEP_TYPES.includes(lesson.stepType)) {
    const score = progress.checkpointScores.get(lesson.id);
    return !score?.passed;
  }

  if (lesson.stepType === 'lab' || lesson.stepType === 'assignment') {
    const sub = progress.stepSubmissions.get(lesson.id);
    return sub?.status !== 'approved';
  }

  // lesson / certification: must be marked complete
  return !progress.completedLessonIds.has(lesson.id);
}

/**
 * Derives the learner's current state for a specific lesson.
 */
function resolveState(lesson: EngineLesson, progress: LearnerProgress): LearnerState {
  if (GATED_STEP_TYPES.includes(lesson.stepType)) {
    const score = progress.checkpointScores.get(lesson.id);
    if (!score) return 'not_started';
    return score.passed ? 'passed' : 'failed';
  }

  if (lesson.stepType === 'lab' || lesson.stepType === 'assignment') {
    const sub = progress.stepSubmissions.get(lesson.id);
    if (!sub) return 'not_started';
    if (sub.status === 'approved') return 'completed';
    if (sub.status === 'submitted' || sub.status === 'under_review') return 'awaiting_review';
    if (sub.status === 'rejected' || sub.status === 'revision_requested') return 'in_progress';
    return 'in_progress';
  }

  if (progress.completedLessonIds.has(lesson.id)) return 'completed';
  return 'not_started';
}
