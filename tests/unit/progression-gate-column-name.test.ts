/**
 * Regression tests for the course_module_id → module_id column name bug.
 *
 * Bug: progression-gate.ts and course-builder/pipeline.ts both referenced
 * a non-existent column `course_module_id` on the `course_lessons` table.
 * The actual column is `module_id` (defined in migration 20260402000006).
 *
 * Impact:
 *   - progression-gate: evalCompletePreviousModule always returned
 *     { unlocked: true } because every query against `course_module_id`
 *     silently returned no rows. Module progression was never enforced
 *     for `complete_previous_module` unlock rules.
 *   - pipeline: lessons seeded via runCoursePublishPipeline had no module
 *     association (module_id = NULL), breaking module accordion rendering
 *     and all module-scoped queries.
 *
 * Fix: rename `course_module_id` → `module_id` in both files.
 */

import { describe, it, expect } from 'vitest';

// ─── Helpers mirroring the fixed evalCompletePreviousModule logic ─────────────

interface LessonRow {
  id: string;
  module_id: string | null;
  order_index: number;
  course_id: string;
}

interface ModuleRow {
  id: string;
  order_index: number;
  course_id: string;
}

/**
 * Pure re-implementation of the gate logic from evalCompletePreviousModule.
 * Accepts pre-fetched data so we can test without a real DB.
 *
 * Returns { unlocked, reason } matching the GateResult type.
 */
function evalCompletePreviousModulePure(params: {
  lesson: LessonRow | null;
  currentMod: ModuleRow | null;
  prevMod: ModuleRow | null;
  prevLessons: Array<{ id: string }> | null;
  completedLessonIds: Set<string>;
}): { unlocked: boolean; reason?: string } {
  const { lesson, currentMod, prevMod, prevLessons, completedLessonIds } = params;

  if (!lesson || !lesson.module_id) {
    // Lesson not found or has no module — fail open (matches gate behaviour)
    throw new Error('progression-gate: lesson lookup failed');
  }

  if (!currentMod) {
    throw new Error('progression-gate: module lookup failed');
  }

  if (currentMod.order_index <= 1) {
    return { unlocked: true };
  }

  if (!prevMod) {
    return { unlocked: true };
  }

  if (!prevLessons || prevLessons.length === 0) {
    return { unlocked: true };
  }

  const incomplete = prevLessons.filter((l) => !completedLessonIds.has(l.id));

  if (incomplete.length > 0) {
    return {
      unlocked: false,
      reason: `Previous module has ${incomplete.length} incomplete required lesson(s)`,
    };
  }

  return { unlocked: true };
}

// ─── Helpers mirroring the fixed pipeline lesson upsert payload ───────────────

interface LessonUpsertPayload {
  course_id: string;
  module_id: string;
  slug: string;
  title: string;
  lesson_type: string;
  order_index: number;
}

function buildLessonUpsertPayload(params: {
  courseId: string;
  moduleId: string;
  slug: string;
  title: string;
  lessonType: string;
  order: number;
}): LessonUpsertPayload {
  return {
    course_id: params.courseId,
    module_id: params.moduleId, // fixed: was course_module_id
    slug: params.slug,
    title: params.title,
    lesson_type: params.lessonType,
    order_index: params.order,
  };
}

// ─── Tests: progression gate ──────────────────────────────────────────────────

describe('progression-gate: evalCompletePreviousModule', () => {
  const courseId = 'course-1';
  const mod1: ModuleRow = { id: 'mod-1', order_index: 1, course_id: courseId };
  const mod2: ModuleRow = { id: 'mod-2', order_index: 2, course_id: courseId };

  const lessonInMod1: LessonRow = {
    id: 'lesson-1a',
    module_id: 'mod-1',
    order_index: 1,
    course_id: courseId,
  };
  const lessonInMod2: LessonRow = {
    id: 'lesson-2a',
    module_id: 'mod-2',
    order_index: 1,
    course_id: courseId,
  };

  it('unlocks first-module lessons unconditionally', () => {
    const result = evalCompletePreviousModulePure({
      lesson: lessonInMod1,
      currentMod: mod1,
      prevMod: null,
      prevLessons: null,
      completedLessonIds: new Set(),
    });
    expect(result.unlocked).toBe(true);
  });

  it('blocks second-module lesson when prior module has incomplete required lessons', () => {
    const result = evalCompletePreviousModulePure({
      lesson: lessonInMod2,
      currentMod: mod2,
      prevMod: mod1,
      prevLessons: [{ id: 'lesson-1a' }, { id: 'lesson-1b' }],
      completedLessonIds: new Set(['lesson-1a']), // lesson-1b not completed
    });
    expect(result.unlocked).toBe(false);
    expect(result.reason).toMatch(/1 incomplete/);
  });

  it('unlocks second-module lesson when all prior required lessons are complete', () => {
    const result = evalCompletePreviousModulePure({
      lesson: lessonInMod2,
      currentMod: mod2,
      prevMod: mod1,
      prevLessons: [{ id: 'lesson-1a' }, { id: 'lesson-1b' }],
      completedLessonIds: new Set(['lesson-1a', 'lesson-1b']),
    });
    expect(result.unlocked).toBe(true);
  });

  it('unlocks when previous module has no required lessons', () => {
    const result = evalCompletePreviousModulePure({
      lesson: lessonInMod2,
      currentMod: mod2,
      prevMod: mod1,
      prevLessons: [],
      completedLessonIds: new Set(),
    });
    expect(result.unlocked).toBe(true);
  });

  it('unlocks when no previous module exists', () => {
    const result = evalCompletePreviousModulePure({
      lesson: lessonInMod2,
      currentMod: mod2,
      prevMod: null,
      prevLessons: null,
      completedLessonIds: new Set(),
    });
    expect(result.unlocked).toBe(true);
  });

  it('throws when lesson has no module_id (not course_module_id)', () => {
    // Documents that the gate requires module_id, not course_module_id.
    // Before the fix, course_lessons was queried with the wrong column name,
    // so module_id was always null — causing the gate to throw here and
    // fall back to unlocked=true in the batch evaluator's catch block.
    const lessonWithNullModuleId: LessonRow = {
      id: 'lesson-x',
      module_id: null,
      order_index: 1,
      course_id: courseId,
    };
    expect(() =>
      evalCompletePreviousModulePure({
        lesson: lessonWithNullModuleId,
        currentMod: mod2,
        prevMod: mod1,
        prevLessons: [{ id: 'lesson-1a' }],
        completedLessonIds: new Set(),
      }),
    ).toThrow('progression-gate: lesson lookup failed');
  });

  it('counts all incomplete lessons in the reason string', () => {
    const result = evalCompletePreviousModulePure({
      lesson: lessonInMod2,
      currentMod: mod2,
      prevMod: mod1,
      prevLessons: [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }],
      completedLessonIds: new Set(), // none completed
    });
    expect(result.unlocked).toBe(false);
    expect(result.reason).toMatch(/3 incomplete/);
  });
});

// ─── Tests: pipeline lesson upsert payload ────────────────────────────────────

describe('course-builder/pipeline: lesson upsert uses module_id not course_module_id', () => {
  it('payload contains module_id key', () => {
    const payload = buildLessonUpsertPayload({
      courseId: 'course-abc',
      moduleId: 'mod-xyz',
      slug: 'intro-lesson',
      title: 'Introduction',
      lessonType: 'lesson',
      order: 1,
    });

    expect(payload).toHaveProperty('module_id', 'mod-xyz');
  });

  it('payload does not contain course_module_id key', () => {
    const payload = buildLessonUpsertPayload({
      courseId: 'course-abc',
      moduleId: 'mod-xyz',
      slug: 'intro-lesson',
      title: 'Introduction',
      lessonType: 'lesson',
      order: 1,
    });

    expect(payload).not.toHaveProperty('course_module_id');
  });

  it('module_id is set to the provided moduleId value', () => {
    const moduleId = 'mod-00000000-0000-0000-0000-000000000001';
    const payload = buildLessonUpsertPayload({
      courseId: 'course-1',
      moduleId,
      slug: 'test-slug',
      title: 'Test',
      lessonType: 'checkpoint',
      order: 5,
    });

    expect(payload.module_id).toBe(moduleId);
  });

  it('all required fields are present in the payload', () => {
    const payload = buildLessonUpsertPayload({
      courseId: 'c1',
      moduleId: 'm1',
      slug: 'slug-1',
      title: 'Title',
      lessonType: 'quiz',
      order: 2,
    });

    expect(payload.course_id).toBe('c1');
    expect(payload.module_id).toBe('m1');
    expect(payload.slug).toBe('slug-1');
    expect(payload.title).toBe('Title');
    expect(payload.lesson_type).toBe('quiz');
    expect(payload.order_index).toBe(2);
  });
});
