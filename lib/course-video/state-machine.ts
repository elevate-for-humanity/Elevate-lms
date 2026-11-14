import { createHash } from 'node:crypto';
import type { CourseVideoJobState, CourseVideoRequest } from './production-contract';

const transitions: Record<CourseVideoJobState, readonly CourseVideoJobState[]> = {
  requested: ['planning', 'cancelled'],
  planning: ['technical_review', 'retryable_failed', 'permanent_failed', 'cancelled'],
  technical_review: ['storyboard_ready', 'blocked', 'retryable_failed', 'permanent_failed', 'cancelled'],
  storyboard_ready: ['generating_assets', 'generating_narration', 'cancelled'],
  generating_assets: ['generating_narration', 'rendering', 'retryable_failed', 'permanent_failed', 'cancelled'],
  generating_narration: ['generating_assets', 'rendering', 'retryable_failed', 'permanent_failed', 'cancelled'],
  rendering: ['quality_review', 'retryable_failed', 'permanent_failed', 'cancelled'],
  quality_review: ['human_review', 'blocked', 'retryable_failed', 'permanent_failed', 'cancelled'],
  human_review: ['approved', 'blocked', 'cancelled'],
  approved: ['published', 'human_review', 'cancelled'],
  published: [],
  blocked: ['planning', 'technical_review', 'storyboard_ready', 'quality_review', 'human_review', 'cancelled'],
  retryable_failed: ['planning', 'generating_assets', 'generating_narration', 'rendering', 'quality_review', 'cancelled'],
  permanent_failed: [],
  cancelled: [],
};

export function canTransitionCourseVideoJob(from: CourseVideoJobState, to: CourseVideoJobState): boolean {
  return from === to || transitions[from].includes(to);
}

export function requireCourseVideoJobTransition(from: CourseVideoJobState, to: CourseVideoJobState): void {
  if (!canTransitionCourseVideoJob(from, to)) {
    throw new Error(`Invalid course-video job transition: ${from} -> ${to}`);
  }
}

/** Stable identity prevents retries from creating duplicate work or duplicate charges. */
export function courseVideoIdempotencyKey(request: CourseVideoRequest, renderVersion: number): string {
  const identity = JSON.stringify({
    tenantId: request.tenantId,
    courseId: request.courseId,
    moduleId: request.moduleId,
    lessonId: request.lessonId,
    credentialProfile: request.credentialProfile,
    learningObjectives: request.learningObjectives,
    sourceDocuments: request.sourceDocuments,
    videoStyle: request.videoStyle,
    renderVersion,
  });
  return createHash('sha256').update(identity).digest('hex');
}
