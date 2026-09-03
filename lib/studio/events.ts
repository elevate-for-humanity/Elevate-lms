/**
 * lib/studio/events.ts
 *
 * Typed event constants for the Course Studio.
 * All studio actions emit via lib/events/emit.ts using these constants.
 *
 * Consumers (automation rules, AI agents, analytics) subscribe to these
 * event types to react automatically — this is the event-driven orchestration layer.
 */

// ─── Event type constants ─────────────────────────────────────────────────────

export const STUDIO_EVENTS = {
  // Course lifecycle
  COURSE_CREATED:        'course.created',
  COURSE_UPDATED:        'course.updated',
  COURSE_PUBLISHED:      'course.published',
  COURSE_ARCHIVED:       'course.archived',

  // Module events
  MODULE_CREATED:        'course.module_created',
  MODULE_UPDATED:        'course.module_updated',
  MODULE_DELETED:        'course.module_deleted',
  MODULE_REORDERED:      'course.module_reordered',

  // Lesson events
  LESSON_CREATED:        'course.lesson_created',
  LESSON_UPDATED:        'course.lesson_updated',
  LESSON_DELETED:        'course.lesson_deleted',
  LESSON_APPROVED:       'course.lesson_approved',
  LESSON_PUBLISHED:      'course.lesson_published',

  // Quiz / assessment events
  QUIZ_GENERATED:        'course.quiz_generated',
  QUIZ_UPDATED:          'course.quiz_updated',
  ASSESSMENT_CREATED:    'course.assessment_created',

  // Media events
  VIDEO_ADDED:           'course.video_added',
  VIDEO_ATTACHED:        'course.video_attached',
  MEDIA_UPLOADED:        'course.media_uploaded',

  // AI events
  AI_CONTENT_GENERATED:  'course.ai_content_generated',
  AI_QUIZ_GENERATED:     'course.ai_quiz_generated',
  AI_REVIEW_COMPLETED:   'course.ai_review_completed',

  // Generation pipeline
  GENERATION_STARTED:    'course.generation_started',
  GENERATION_COMPLETED:  'course.generation_completed',
  GENERATION_FAILED:     'course.generation_failed',

  // Embedding / memory
  EMBEDDING_CREATED:     'course.embedding_created',
  EMBEDDING_UPDATED:     'course.embedding_updated',
} as const;

export type StudioEventType = typeof STUDIO_EVENTS[keyof typeof STUDIO_EVENTS];

// ─── Event payload shapes ─────────────────────────────────────────────────────

export interface StudioEventPayload {
  courseId: string;
  actorId?: string;
  [key: string]: unknown;
}

export interface LessonEventPayload extends StudioEventPayload {
  lessonId: string;
  lessonTitle?: string;
  lessonType?: string;
  moduleId?: string;
}

export interface QuizEventPayload extends StudioEventPayload {
  lessonId: string;
  questionCount: number;
  passingScore?: number;
}

export interface VideoEventPayload extends StudioEventPayload {
  videoId?: string;
  videoUrl: string;
  lessonId?: string;
}

export interface AIEventPayload extends StudioEventPayload {
  model?: string;
  panel?: string;
  tokensUsed?: number;
  contentType?: 'lesson' | 'quiz' | 'objectives' | 'review';
}

// ─── Typed emit helper ────────────────────────────────────────────────────────

import { emitEvent } from '@/lib/events/emit';

export function emitStudioEvent(
  eventType: StudioEventType,
  payload: StudioEventPayload,
): void {
  void emitEvent(eventType, 'lms', {
    subject_id: payload.courseId,
    actor_type: 'user',
    actor_id: payload.actorId,
    payload,
  });
}
