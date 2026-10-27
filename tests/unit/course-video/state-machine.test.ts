import { describe, expect, it } from 'vitest';
import { canTransitionCourseVideoJob, courseVideoIdempotencyKey, requireCourseVideoJobTransition } from '@/lib/course-video/state-machine';

const request = {
  tenantId: 'tenant-1', courseId: 'course-1', moduleId: 'module-1', lessonId: 'lesson-1',
  credentialProfile: 'epa-608', learningObjectives: ['Explain refrigerant recovery'],
  sourceDocuments: ['epa-source-1'], videoStyle: 'technical' as const,
};

describe('course video production state machine', () => {
  it('allows retries and rejects unsafe lifecycle skips', () => {
    expect(canTransitionCourseVideoJob('requested', 'planning')).toBe(true);
    expect(canTransitionCourseVideoJob('rendering', 'quality_review')).toBe(true);
    expect(canTransitionCourseVideoJob('requested', 'published')).toBe(false);
    expect(() => requireCourseVideoJobTransition('quality_review', 'published')).toThrow(/Invalid/);
  });

  it('uses stable version-aware idempotency identities', () => {
    expect(courseVideoIdempotencyKey(request, 1)).toBe(courseVideoIdempotencyKey(request, 1));
    expect(courseVideoIdempotencyKey(request, 1)).not.toBe(courseVideoIdempotencyKey(request, 2));
  });
});
