/**
 * lib/curriculum/validate-lesson-save.ts
 *
 * Client-side validation before saving a lesson. Mirrors the DB constraints
 * in migration 20260503000019 so the builder rejects bad data before it
 * ever reaches the API or the DB constraint.
 *
 * Returns an array of error strings. Empty array = valid.
 */

import {
  ASSESSMENT_LESSON_TYPES,
  EVIDENCE_LESSON_TYPES,
  VIDEO_LESSON_TYPES,
  type LessonType,
} from '@/lib/curriculum/lesson-types';

export interface LessonSaveState {
  title:                string;
  lessonType:           LessonType;
  videoFile:            string;
  videoTranscript:      string;
  videoRuntime:         number;
  passingScore:         number;
  quizQuestions:        unknown[];
  requiresEvidence:     boolean;
  practicalInstructions: string;
  objectives:           string[];
}

export function validateLessonSave(state: LessonSaveState): string[] {
  const errors: string[] = [];

  // Title required for all types
  if (!state.title.trim()) {
    errors.push('Title is required.');
  }

  // Video lessons: file + transcript + runtime all required
  if (VIDEO_LESSON_TYPES.includes(state.lessonType)) {
    if (!state.videoFile.trim()) {
      errors.push('Video lessons require a video file path.');
    }
    if (!state.videoTranscript.trim()) {
      errors.push('Video lessons require a transcript.');
    }
    if (!state.videoRuntime || state.videoRuntime <= 0) {
      errors.push('Video lessons require runtime seconds > 0.');
    }
  }

  // Assessment lessons: passing score + at least one question
  if (ASSESSMENT_LESSON_TYPES.includes(state.lessonType)) {
    if (!state.passingScore || state.passingScore <= 0) {
      errors.push('Assessment lessons require a passing score > 0.');
    }
    if (!state.quizQuestions.length) {
      errors.push('Assessment lessons require at least one question.');
    }
  }

  // Practical lessons: requires_evidence must be true + instructions required
  if (EVIDENCE_LESSON_TYPES.includes(state.lessonType)) {
    if (!state.requiresEvidence) {
      errors.push('Practical lessons must have evidence submission enabled.');
    }
    if (!state.practicalInstructions.trim()) {
      errors.push('Practical lessons require activity instructions.');
    }
  }

  // All non-certification lessons: at least one objective
  if (state.lessonType !== 'certification' && state.objectives.filter(o => o.trim()).length === 0) {
    errors.push('At least one learning objective is required.');
  }

  return errors;
}

/** True when the lesson state is valid to save. */
export function isLessonSaveValid(state: LessonSaveState): boolean {
  return validateLessonSave(state).length === 0;
}
