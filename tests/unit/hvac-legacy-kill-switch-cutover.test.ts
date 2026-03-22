/**
 * hvac-legacy-kill-switch-cutover
 *
 * Proves that with HVAC_LEGACY_RUNTIME_ALLOWED = false, calling
 * LessonContentRenderer with any lesson that routes to legacy_hvac
 * throws immediately with the expected error message.
 *
 * vi.mock is hoisted — the flag module is replaced before LessonContentRenderer
 * is imported, so the component sees the disabled value at module load time.
 *
 * Delete this file in the same retirement PR that removes case 'legacy_hvac'
 * from LessonContentRenderer.tsx.
 */

import { describe, expect, it, vi } from 'vitest';

// Hoisted mock — applied before any import resolves
vi.mock('@/lib/flags/hvacLegacyRetirement', () => ({
  HVAC_LEGACY_RUNTIME_ALLOWED: false,
  HVAC_LEGACY_RETIREMENT_TARGET: '2027-Q1',
}));

describe('HVAC legacy runtime cutover (kill switch off)', () => {
  it('throws when a training_source lesson is rendered with kill switch disabled', async () => {
    const { default: LessonContentRenderer } = await import(
      '@/components/lms/LessonContentRenderer'
    );

    const legacyLesson = {
      id: 'test-lesson-id',
      title: 'Test HVAC Lesson',
      lesson_source: 'training',
      lesson_type: 'lesson',
      course_id: 'some-course-id',
      content_structured: null,
      content: 'Some content',
      video_url: null,
    };

    // Call the component as a plain function — the throw is synchronous
    // inside the switch case, before any JSX evaluation
    expect(() =>
      LessonContentRenderer({
        lesson: legacyLesson,
        lessonId: 'test-lesson-id',
        courseId: 'some-course-id',
        isCompleted: false,
        onComplete: () => {},
        onQuizComplete: () => {},
      })
    ).toThrow(/legacy_hvac runtime path is disabled/i);
  });

  it('throws when an HVAC course reading with no content_structured is rendered', async () => {
    const { default: LessonContentRenderer } = await import(
      '@/components/lms/LessonContentRenderer'
    );

    const legacyLesson = {
      id: 'test-lesson-id',
      title: 'Test HVAC Lesson',
      lesson_source: 'curriculum',
      lesson_type: 'reading',
      course_id: 'f0593164-55be-5867-98e7-8a86770a8dd0', // HVAC course ID
      content_structured: null,
      content: 'Some content',
      video_url: null,
    };

    expect(() =>
      LessonContentRenderer({
        lesson: legacyLesson,
        lessonId: 'test-lesson-id',
        courseId: 'f0593164-55be-5867-98e7-8a86770a8dd0',
        isCompleted: false,
        onComplete: () => {},
        onQuizComplete: () => {},
      })
    ).toThrow(/legacy_hvac runtime path is disabled/i);
  });

  it('error message includes retirement target', async () => {
    const { default: LessonContentRenderer } = await import(
      '@/components/lms/LessonContentRenderer'
    );

    const legacyLesson = {
      lesson_source: 'training',
      lesson_type: 'lesson',
      course_id: 'any',
      content_structured: null,
      content: null,
      video_url: null,
    };

    expect(() =>
      LessonContentRenderer({
        lesson: legacyLesson,
        lessonId: 'x',
        courseId: 'any',
        isCompleted: false,
        onComplete: () => {},
        onQuizComplete: () => {},
      })
    ).toThrow('2027-Q1');
  });

  it('error message includes remediation command', async () => {
    const { default: LessonContentRenderer } = await import(
      '@/components/lms/LessonContentRenderer'
    );

    const legacyLesson = {
      lesson_source: 'training',
      lesson_type: 'lesson',
      course_id: 'any',
      content_structured: null,
      content: null,
      video_url: null,
    };

    expect(() =>
      LessonContentRenderer({
        lesson: legacyLesson,
        lessonId: 'x',
        courseId: 'any',
        isCompleted: false,
        onComplete: () => {},
        onQuizComplete: () => {},
      })
    ).toThrow('pnpm verify:hvac-legacy-retirement');
  });

  it('non-legacy lessons are NOT affected by the kill switch', async () => {
    const { default: LessonContentRenderer } = await import(
      '@/components/lms/LessonContentRenderer'
    );

    // A canonical reading lesson with content_structured set — routes to 'reading', not legacy_hvac
    const canonicalLesson = {
      lesson_source: 'curriculum',
      lesson_type: 'reading',
      course_id: 'non-hvac-course-id',
      content_structured: JSON.stringify({
        version: 1,
        instructionalContent: '<p>Hello world</p>',
      }),
      content: null,
      video_url: null,
    };

    // Should NOT throw — kill switch only affects legacy_hvac path
    expect(() =>
      LessonContentRenderer({
        lesson: canonicalLesson,
        lessonId: 'canonical-id',
        courseId: 'non-hvac-course-id',
        isCompleted: false,
        onComplete: () => {},
        onQuizComplete: () => {},
      })
    ).not.toThrow(/legacy_hvac runtime path is disabled/i);
  });
});
