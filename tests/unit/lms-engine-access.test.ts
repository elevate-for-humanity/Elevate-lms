/**
 * Unit tests for lib/lms/engine/access.ts
 *
 * canAccessLesson is a pure function (no DB calls, no server-only guard).
 * Imported directly.
 *
 * isPriorLessonBlocking and resolveState are private to the module, so their
 * logic is exercised indirectly through canAccessLesson, and also tested
 * directly via inline-extracted copies that mirror the source exactly.
 *
 * GATED_STEP_TYPES and REVIEW_STEP_TYPES constants are imported from types.ts
 * and tested for their contract (which step types they include/exclude).
 */

import { describe, it, expect } from 'vitest';
import { canAccessLesson } from '@/lib/lms/engine/access';
import { GATED_STEP_TYPES, REVIEW_STEP_TYPES } from '@/lib/lms/engine/types';
import type {
  EngineLesson,
  LearnerProgress,
  CheckpointScore,
  StepSubmission,
} from '@/lib/lms/engine/types';

// ─── Inline-extracted private helpers (mirrors source exactly) ────────────────
// These are private to access.ts. We copy them here so we can test them
// directly without exporting them from the source module.

function isPriorLessonBlocking(lesson: EngineLesson, progress: LearnerProgress): boolean {
  if (GATED_STEP_TYPES.includes(lesson.stepType)) {
    const score = progress.checkpointScores.get(lesson.id);
    return !score?.passed;
  }
  if (lesson.stepType === 'lab' || lesson.stepType === 'assignment') {
    const sub = progress.stepSubmissions.get(lesson.id);
    return sub?.status !== 'approved';
  }
  return !progress.completedLessonIds.has(lesson.id);
}

function resolveState(
  lesson: EngineLesson,
  progress: LearnerProgress,
): import('@/lib/lms/engine/types').LearnerState {
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

// ─── Fixture factories ────────────────────────────────────────────────────────

function makeLesson(overrides: Partial<EngineLesson> = {}): EngineLesson {
  return {
    id: 'lesson-1',
    lessonSlug: 'lesson-1',
    lessonTitle: 'Lesson 1',
    stepType: 'lesson',
    passingScore: 70,
    moduleOrder: 1,
    lessonOrder: 1,
    durationMinutes: null,
    status: 'published',
    moduleTitle: 'Module 1',
    videoFile: null,
    scriptText: null,
    ...overrides,
  };
}

function makeProgress(overrides: Partial<LearnerProgress> = {}): LearnerProgress {
  return {
    userId: 'user-1',
    courseId: 'course-1',
    completedLessonIds: new Set<string>(),
    checkpointScores: new Map<string, CheckpointScore>(),
    stepSubmissions: new Map<string, StepSubmission>(),
    progressPercent: 0,
    courseCompleted: false,
    certificateNumber: null,
    ...overrides,
  };
}

function makeCheckpointScore(overrides: Partial<CheckpointScore> = {}): CheckpointScore {
  return {
    lessonId: 'lesson-1',
    score: 80,
    passed: true,
    passingScore: 70,
    attemptNumber: 1,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeSubmission(
  lessonId: string,
  status: StepSubmission['status'],
): StepSubmission {
  return { id: 'sub-1', lessonId, status, createdAt: '2026-01-01T00:00:00Z' };
}

// ─── GATED_STEP_TYPES / REVIEW_STEP_TYPES constants ──────────────────────────

describe('GATED_STEP_TYPES', () => {
  it('contains quiz', () => expect(GATED_STEP_TYPES).toContain('quiz'));
  it('contains checkpoint', () => expect(GATED_STEP_TYPES).toContain('checkpoint'));
  it('contains exam', () => expect(GATED_STEP_TYPES).toContain('exam'));
  it('does not contain lesson', () => expect(GATED_STEP_TYPES).not.toContain('lesson'));
  it('does not contain lab', () => expect(GATED_STEP_TYPES).not.toContain('lab'));
  it('does not contain assignment', () => expect(GATED_STEP_TYPES).not.toContain('assignment'));
  it('does not contain certification', () => expect(GATED_STEP_TYPES).not.toContain('certification'));
});

describe('REVIEW_STEP_TYPES', () => {
  it('contains lab', () => expect(REVIEW_STEP_TYPES).toContain('lab'));
  it('contains assignment', () => expect(REVIEW_STEP_TYPES).toContain('assignment'));
  it('does not contain quiz', () => expect(REVIEW_STEP_TYPES).not.toContain('quiz'));
  it('does not contain checkpoint', () => expect(REVIEW_STEP_TYPES).not.toContain('checkpoint'));
  it('does not contain exam', () => expect(REVIEW_STEP_TYPES).not.toContain('exam'));
  it('does not contain lesson', () => expect(REVIEW_STEP_TYPES).not.toContain('lesson'));
});

// ─── canAccessLesson — published guard ───────────────────────────────────────

describe('canAccessLesson — published guard', () => {
  it('blocks an unpublished lesson', () => {
    const lesson = makeLesson({ status: 'draft' });
    const result = canAccessLesson(lesson, [lesson], makeProgress());
    expect(result.canAccess).toBe(false);
    expect(result.state).toBe('blocked');
  });

  it('blocks a lesson with status review', () => {
    const lesson = makeLesson({ status: 'review' });
    const result = canAccessLesson(lesson, [lesson], makeProgress());
    expect(result.canAccess).toBe(false);
    expect(result.state).toBe('blocked');
  });

  it('blocks a lesson with status archived', () => {
    const lesson = makeLesson({ status: 'archived' });
    const result = canAccessLesson(lesson, [lesson], makeProgress());
    expect(result.canAccess).toBe(false);
    expect(result.state).toBe('blocked');
  });

  it('allows a published lesson with no prior lessons', () => {
    const lesson = makeLesson({ status: 'published' });
    const result = canAccessLesson(lesson, [lesson], makeProgress());
    expect(result.canAccess).toBe(true);
    expect(result.reason).toBeNull();
  });
});

// ─── canAccessLesson — sequential lock ───────────────────────────────────────

describe('canAccessLesson — sequential lock', () => {
  const lesson1 = makeLesson({ id: 'l1', lessonOrder: 1, moduleOrder: 1, lessonTitle: 'Intro' });
  const lesson2 = makeLesson({ id: 'l2', lessonOrder: 2, moduleOrder: 1, lessonTitle: 'Part 2' });
  const lesson3 = makeLesson({ id: 'l3', lessonOrder: 3, moduleOrder: 1, lessonTitle: 'Part 3' });
  const all = [lesson1, lesson2, lesson3];

  it('first lesson is always accessible regardless of progress', () => {
    const result = canAccessLesson(lesson1, all, makeProgress());
    expect(result.canAccess).toBe(true);
  });

  it('second lesson is blocked when first is not complete', () => {
    const result = canAccessLesson(lesson2, all, makeProgress());
    expect(result.canAccess).toBe(false);
    expect(result.reason).toMatch(/Intro/);
  });

  it('second lesson is accessible when first is complete', () => {
    const progress = makeProgress({ completedLessonIds: new Set(['l1']) });
    const result = canAccessLesson(lesson2, all, progress);
    expect(result.canAccess).toBe(true);
  });

  it('third lesson is blocked when second is incomplete even if first is complete', () => {
    const progress = makeProgress({ completedLessonIds: new Set(['l1']) });
    const result = canAccessLesson(lesson3, all, progress);
    expect(result.canAccess).toBe(false);
    expect(result.reason).toMatch(/Part 2/);
  });

  it('last lesson is accessible when all prior lessons are complete', () => {
    const progress = makeProgress({ completedLessonIds: new Set(['l1', 'l2']) });
    const result = canAccessLesson(lesson3, all, progress);
    expect(result.canAccess).toBe(true);
  });

  it('unpublished lessons in the list are skipped in the sequential order', () => {
    const draftLesson = makeLesson({ id: 'l-draft', lessonOrder: 2, moduleOrder: 1, status: 'draft' });
    const lesson3b = makeLesson({ id: 'l3b', lessonOrder: 3, moduleOrder: 1 });
    // l-draft is between l1 and l3b but is unpublished — should not block l3b
    const progress = makeProgress({ completedLessonIds: new Set(['l1']) });
    const result = canAccessLesson(lesson3b, [lesson1, draftLesson, lesson3b], progress);
    // l-draft is filtered out; l3b is index 1 (after l1), l1 is complete → accessible
    expect(result.canAccess).toBe(true);
  });
});

// ─── canAccessLesson — gated step types ──────────────────────────────────────

describe('canAccessLesson — gated step types (quiz / checkpoint / exam)', () => {
  for (const stepType of ['quiz', 'checkpoint', 'exam'] as const) {
    describe(`stepType: ${stepType}`, () => {
      const gated = makeLesson({ id: 'gated', lessonOrder: 1, moduleOrder: 1, stepType });
      const next = makeLesson({ id: 'next', lessonOrder: 2, moduleOrder: 1 });
      const all = [gated, next];

      it(`blocks next lesson when ${stepType} has no score`, () => {
        const result = canAccessLesson(next, all, makeProgress());
        expect(result.canAccess).toBe(false);
      });

      it(`blocks next lesson when ${stepType} score is passed=false`, () => {
        const scores = new Map([
          ['gated', makeCheckpointScore({ lessonId: 'gated', passed: false, score: 55 })],
        ]);
        const progress = makeProgress({ checkpointScores: scores });
        const result = canAccessLesson(next, all, progress);
        expect(result.canAccess).toBe(false);
      });

      it(`allows next lesson when ${stepType} score is passed=true`, () => {
        const scores = new Map([
          ['gated', makeCheckpointScore({ lessonId: 'gated', passed: true, score: 80 })],
        ]);
        const progress = makeProgress({ checkpointScores: scores });
        const result = canAccessLesson(next, all, progress);
        expect(result.canAccess).toBe(true);
      });
    });
  }
});

// ─── canAccessLesson — review step types ─────────────────────────────────────

describe('canAccessLesson — review step types (lab / assignment)', () => {
  for (const stepType of ['lab', 'assignment'] as const) {
    describe(`stepType: ${stepType}`, () => {
      const review = makeLesson({ id: 'review', lessonOrder: 1, moduleOrder: 1, stepType });
      const next = makeLesson({ id: 'next', lessonOrder: 2, moduleOrder: 1 });
      const all = [review, next];

      it(`blocks next lesson when ${stepType} has no submission`, () => {
        const result = canAccessLesson(next, all, makeProgress());
        expect(result.canAccess).toBe(false);
      });

      it(`blocks next lesson when ${stepType} submission is submitted`, () => {
        const subs = new Map([['review', makeSubmission('review', 'submitted')]]);
        const result = canAccessLesson(next, all, makeProgress({ stepSubmissions: subs }));
        expect(result.canAccess).toBe(false);
      });

      it(`blocks next lesson when ${stepType} submission is under_review`, () => {
        const subs = new Map([['review', makeSubmission('review', 'under_review')]]);
        const result = canAccessLesson(next, all, makeProgress({ stepSubmissions: subs }));
        expect(result.canAccess).toBe(false);
      });

      it(`blocks next lesson when ${stepType} submission is rejected`, () => {
        const subs = new Map([['review', makeSubmission('review', 'rejected')]]);
        const result = canAccessLesson(next, all, makeProgress({ stepSubmissions: subs }));
        expect(result.canAccess).toBe(false);
      });

      it(`blocks next lesson when ${stepType} submission is revision_requested`, () => {
        const subs = new Map([['review', makeSubmission('review', 'revision_requested')]]);
        const result = canAccessLesson(next, all, makeProgress({ stepSubmissions: subs }));
        expect(result.canAccess).toBe(false);
      });

      it(`allows next lesson when ${stepType} submission is approved`, () => {
        const subs = new Map([['review', makeSubmission('review', 'approved')]]);
        const result = canAccessLesson(next, all, makeProgress({ stepSubmissions: subs }));
        expect(result.canAccess).toBe(true);
      });
    });
  }
});

// ─── resolveState — state derivation ─────────────────────────────────────────

describe('resolveState (inline-extracted)', () => {
  describe('gated step types', () => {
    for (const stepType of ['quiz', 'checkpoint', 'exam'] as const) {
      it(`${stepType} with no score → not_started`, () => {
        const lesson = makeLesson({ id: 'l1', stepType });
        expect(resolveState(lesson, makeProgress())).toBe('not_started');
      });

      it(`${stepType} with passed=true → passed`, () => {
        const lesson = makeLesson({ id: 'l1', stepType });
        const scores = new Map([['l1', makeCheckpointScore({ lessonId: 'l1', passed: true })]]);
        expect(resolveState(lesson, makeProgress({ checkpointScores: scores }))).toBe('passed');
      });

      it(`${stepType} with passed=false → failed`, () => {
        const lesson = makeLesson({ id: 'l1', stepType });
        const scores = new Map([['l1', makeCheckpointScore({ lessonId: 'l1', passed: false, score: 55 })]]);
        expect(resolveState(lesson, makeProgress({ checkpointScores: scores }))).toBe('failed');
      });
    }
  });

  describe('lab / assignment', () => {
    for (const stepType of ['lab', 'assignment'] as const) {
      it(`${stepType} with no submission → not_started`, () => {
        const lesson = makeLesson({ id: 'l1', stepType });
        expect(resolveState(lesson, makeProgress())).toBe('not_started');
      });

      it(`${stepType} with submitted → awaiting_review`, () => {
        const lesson = makeLesson({ id: 'l1', stepType });
        const subs = new Map([['l1', makeSubmission('l1', 'submitted')]]);
        expect(resolveState(lesson, makeProgress({ stepSubmissions: subs }))).toBe('awaiting_review');
      });

      it(`${stepType} with under_review → awaiting_review`, () => {
        const lesson = makeLesson({ id: 'l1', stepType });
        const subs = new Map([['l1', makeSubmission('l1', 'under_review')]]);
        expect(resolveState(lesson, makeProgress({ stepSubmissions: subs }))).toBe('awaiting_review');
      });

      it(`${stepType} with approved → completed`, () => {
        const lesson = makeLesson({ id: 'l1', stepType });
        const subs = new Map([['l1', makeSubmission('l1', 'approved')]]);
        expect(resolveState(lesson, makeProgress({ stepSubmissions: subs }))).toBe('completed');
      });

      it(`${stepType} with rejected → in_progress`, () => {
        const lesson = makeLesson({ id: 'l1', stepType });
        const subs = new Map([['l1', makeSubmission('l1', 'rejected')]]);
        expect(resolveState(lesson, makeProgress({ stepSubmissions: subs }))).toBe('in_progress');
      });

      it(`${stepType} with revision_requested → in_progress`, () => {
        const lesson = makeLesson({ id: 'l1', stepType });
        const subs = new Map([['l1', makeSubmission('l1', 'revision_requested')]]);
        expect(resolveState(lesson, makeProgress({ stepSubmissions: subs }))).toBe('in_progress');
      });
    }
  });

  describe('regular lesson / certification', () => {
    it('lesson not in completedLessonIds → not_started', () => {
      const lesson = makeLesson({ id: 'l1', stepType: 'lesson' });
      expect(resolveState(lesson, makeProgress())).toBe('not_started');
    });

    it('lesson in completedLessonIds → completed', () => {
      const lesson = makeLesson({ id: 'l1', stepType: 'lesson' });
      const progress = makeProgress({ completedLessonIds: new Set(['l1']) });
      expect(resolveState(lesson, progress)).toBe('completed');
    });

    it('certification not in completedLessonIds → not_started', () => {
      const lesson = makeLesson({ id: 'l1', stepType: 'certification' });
      expect(resolveState(lesson, makeProgress())).toBe('not_started');
    });

    it('certification in completedLessonIds → completed', () => {
      const lesson = makeLesson({ id: 'l1', stepType: 'certification' });
      const progress = makeProgress({ completedLessonIds: new Set(['l1']) });
      expect(resolveState(lesson, progress)).toBe('completed');
    });
  });
});

// ─── isPriorLessonBlocking (inline-extracted) ─────────────────────────────────

describe('isPriorLessonBlocking (inline-extracted)', () => {
  it('blocks a gated lesson with no score', () => {
    const lesson = makeLesson({ id: 'cp', stepType: 'checkpoint' });
    expect(isPriorLessonBlocking(lesson, makeProgress())).toBe(true);
  });

  it('blocks a gated lesson with passed=false', () => {
    const lesson = makeLesson({ id: 'cp', stepType: 'checkpoint' });
    const scores = new Map([['cp', makeCheckpointScore({ lessonId: 'cp', passed: false })]]);
    expect(isPriorLessonBlocking(lesson, makeProgress({ checkpointScores: scores }))).toBe(true);
  });

  it('does not block a gated lesson with passed=true', () => {
    const lesson = makeLesson({ id: 'cp', stepType: 'checkpoint' });
    const scores = new Map([['cp', makeCheckpointScore({ lessonId: 'cp', passed: true })]]);
    expect(isPriorLessonBlocking(lesson, makeProgress({ checkpointScores: scores }))).toBe(false);
  });

  it('blocks a lab with no submission', () => {
    const lesson = makeLesson({ id: 'lab1', stepType: 'lab' });
    expect(isPriorLessonBlocking(lesson, makeProgress())).toBe(true);
  });

  it('does not block a lab with approved submission', () => {
    const lesson = makeLesson({ id: 'lab1', stepType: 'lab' });
    const subs = new Map([['lab1', makeSubmission('lab1', 'approved')]]);
    expect(isPriorLessonBlocking(lesson, makeProgress({ stepSubmissions: subs }))).toBe(false);
  });

  it('blocks a regular lesson not yet completed', () => {
    const lesson = makeLesson({ id: 'l1', stepType: 'lesson' });
    expect(isPriorLessonBlocking(lesson, makeProgress())).toBe(true);
  });

  it('does not block a regular lesson that is completed', () => {
    const lesson = makeLesson({ id: 'l1', stepType: 'lesson' });
    const progress = makeProgress({ completedLessonIds: new Set(['l1']) });
    expect(isPriorLessonBlocking(lesson, progress)).toBe(false);
  });
});
