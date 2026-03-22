/**
 * lib/lms/get-lesson-render-mode.ts
 *
 * Determines the canonical render mode for a lesson based solely on its
 * lesson_type and structured content. No inference from video_url presence.
 *
 * The lesson page imports this and routes rendering entirely off the result.
 * Legacy HVAC fallback logic is isolated behind the 'legacy_hvac' mode.
 */

import { normalizeLessonType, type LessonType } from '@/lib/curriculum/lesson-types';
import { normalizeLessonContent, type LessonContent } from '@/lib/curriculum/normalize-lesson-content';

// ─── Render modes ─────────────────────────────────────────────────────────────

export type LessonRenderMode =
  | 'reading'       // rich text + objectives + materials
  | 'video'         // video player + transcript + completion threshold
  | 'quiz'          // quiz player
  | 'checkpoint'    // checkpoint quiz or reflection card
  | 'lab'           // lab instructions + evidence submission
  | 'assignment'    // assignment instructions + evidence submission
  | 'simulation'    // simulation block + evidence
  | 'practicum'     // hours/attempts/progress + evidence + signoff
  | 'externship'    // hours/progress/evidence/signoff
  | 'clinical'      // hours/progress/evidence/signoff
  | 'observation'   // observation log + evidence
  | 'final_exam'    // final exam player
  | 'capstone'      // project instructions + rubric + evidence + evaluator review
  | 'certification' // completion/certificate screen
  | 'legacy_hvac';  // HVAC legacy path — isolated adapter

export interface LessonRenderConfig {
  mode:                LessonRenderMode;
  lessonType:          LessonType;
  content:             LessonContent;
  /** True when the lesson requires evidence submission from the learner. */
  requiresEvidence:    boolean;
  /** True when the lesson requires evaluator/instructor review. */
  requiresEvaluator:   boolean;
  /** True when the lesson requires skill signoff. */
  requiresSignoff:     boolean;
  /** True when the lesson requires a passing score to complete. */
  requiresPass:        boolean;
  /** True when the lesson tracks hours/attempts (practical field training). */
  tracksPractical:     boolean;
  /** For video lessons: minimum watch percentage before completion is allowed. */
  videoCompletionThreshold: number;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Returns the canonical render config for a lesson row from the DB.
 * Pass the raw lesson object from lms_lessons or course_lessons.
 */
export function getLessonRenderMode(lesson: Record<string, unknown>): LessonRenderConfig {
  const rawType = (lesson.lesson_type ?? lesson.step_type ?? lesson.content_type) as string;
  const lessonType = normalizeLessonType(rawType);

  // HVAC legacy adapter — isolate before canonical path
  const isHvacLegacy =
    lesson.lesson_source === 'training' ||
    (lesson.course_id === 'f0593164-55be-5867-98e7-8a86770a8dd0' &&
      !lesson.content_structured &&
      lessonType === 'reading');

  if (isHvacLegacy) {
    return buildConfig('legacy_hvac', lessonType, lesson, false, false, false);
  }

  // Canonical path — route entirely by lesson type
  const content = normalizeLessonContent(lesson.content_structured ?? lesson.content);

  switch (lessonType) {
    case 'video':
      return buildConfig('video', lessonType, lesson, false, false, false, content);

    case 'quiz':
      return buildConfig('quiz', lessonType, lesson, false, false, false, content);

    case 'checkpoint':
      return buildConfig('checkpoint', lessonType, lesson, false, false, false, content);

    case 'final_exam':
      return buildConfig('final_exam', lessonType, lesson, false, false, false, content);

    case 'lab':
      return buildConfig('lab', lessonType, lesson, true, true, false, content);

    case 'assignment':
      return buildConfig('assignment', lessonType, lesson, true, true, false, content);

    case 'simulation':
      return buildConfig('simulation', lessonType, lesson, true, true, false, content);

    case 'practicum':
      return buildConfig('practicum', lessonType, lesson, true, true, true, content);

    case 'externship':
      return buildConfig('externship', lessonType, lesson, true, true, true, content);

    case 'clinical':
      return buildConfig('clinical', lessonType, lesson, true, true, true, content);

    case 'observation':
      return buildConfig('observation', lessonType, lesson, true, false, false, content);

    case 'capstone':
      return buildConfig('capstone', lessonType, lesson, true, true, true, content);

    case 'certification':
      return buildConfig('certification', lessonType, lesson, false, false, false, content);

    case 'reading':
    default:
      return buildConfig('reading', lessonType, lesson, false, false, false, content);
  }
}

// ─── Builder ──────────────────────────────────────────────────────────────────

function buildConfig(
  mode:          LessonRenderMode,
  lessonType:    LessonType,
  lesson:        Record<string, unknown>,
  requiresEvidence:  boolean,
  requiresEvaluator: boolean,
  requiresSignoff:   boolean,
  content?:      LessonContent
): LessonRenderConfig {
  // DB flags override defaults when explicitly set
  const dbRequiresEvidence  = lesson.requires_evidence  === true ? true : requiresEvidence;
  const dbRequiresEvaluator = lesson.requires_evaluator === true ? true : requiresEvaluator;
  const dbRequiresSignoff   = lesson.requires_signoff   === true ? true : requiresSignoff;

  const requiresPass = ['quiz', 'checkpoint', 'final_exam'].includes(lessonType);
  const tracksPractical = ['practicum', 'externship', 'clinical', 'observation'].includes(lessonType);

  const videoThreshold =
    content?.video?.completionThresholdPercent ??
    (lesson.video_completion_threshold as number | undefined) ??
    90;

  return {
    mode,
    lessonType,
    content:                  content ?? { version: 1, summary: '', objectives: [], instructionalContent: '', transcript: '', materials: [], activityInstructions: '', evidence: { enabled: false, submissionModes: [], minItems: 0, reviewerRequired: false, instructions: '' }, rubric: [], completionRule: { minMinutes: 0, requiresQuizPass: false, requiresEvidenceApproval: false, requiresSignoff: false, requiresHours: 0, requiresAttempts: 0 } },
    requiresEvidence:         dbRequiresEvidence,
    requiresEvaluator:        dbRequiresEvaluator,
    requiresSignoff:          dbRequiresSignoff,
    requiresPass,
    tracksPractical,
    videoCompletionThreshold: videoThreshold,
  };
}
