import { describe, expect, it } from 'vitest';
import { validateCourseTemplate } from '@/lib/course-builder/validate';
import type { CourseLesson, CourseTemplate } from '@/lib/course-builder/schema';

/**
 * Self-serve guarantee: the synchronous template validator must accept ANY
 * program slug. Program/course identity is resolved from the database by the
 * canonical Course Builder authority (program-resolver), never from the
 * deprecated static slug map in schema.ts — a course for a program that only
 * exists in the DB (e.g. esthetician) or a brand-new program must validate
 * exactly like the two legacy slugs that used to be hardcoded.
 */

const CONTENT =
  '<p>' +
  'Hands-on instruction with supervised practice, guided demonstration, and review. '.repeat(6) +
  '</p>';

const question = (n: number) => ({
  question: `Question ${n}: which step comes first in the procedure?`,
  options: ['Prepare the workstation', 'Skip the safety check'],
  correctAnswer: 0,
});

const readingLesson = {
  title: 'Foundations of the Trade',
  slug: 'foundations-of-the-trade',
  type: 'reading',
  order: 1,
  content: CONTENT,
  learningObjectives: ['Identify the core tools used in the trade'],
  durationMinutes: 45,
} as CourseLesson;

const quizLesson = {
  title: 'Foundations Check',
  slug: 'foundations-check',
  type: 'quiz',
  order: 2,
  learningObjectives: ['Demonstrate the foundational procedure'],
  durationMinutes: 15,
  passingScore: 80,
  quizQuestions: [1, 2, 3, 4, 5].map(question),
} as CourseLesson;

const template = (programSlug: string): CourseTemplate =>
  ({
    title: 'Underwater Basket Weaving',
    slug: programSlug,
    programSlug,
    courseSlug: 'underwater-basket-weaving',
    credentialTarget: 'STATE',
    requiresFinalExam: false,
    modules: [
      { title: 'Core', slug: 'core', order: 1, lessons: [readingLesson, quizLesson] },
    ],
  }) as CourseTemplate;

describe('validateCourseTemplate — self-serve program slugs', () => {
  it('accepts a DB-registered program that was never in the static map (esthetician)', () => {
    const result = validateCourseTemplate(template('esthetician-apprenticeship'));
    expect(result.errors.filter((e) => e.field === 'programSlug')).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('accepts a brand-new program slug with no code registration anywhere', () => {
    const result = validateCourseTemplate(template('underwater-basket-weaving'));
    expect(result.errors.filter((e) => e.field === 'programSlug')).toEqual([]);
    expect(
      result.errors.some((e) => e.message.includes('static compatibility map')),
    ).toBe(false);
    expect(result.valid).toBe(true);
  });

  it('still accepts the legacy hardcoded slugs', () => {
    const result = validateCourseTemplate(template('barber-apprenticeship'));
    expect(result.errors.filter((e) => e.field === 'programSlug')).toEqual([]);
    expect(
      result.errors.some((e) => e.message.includes('static compatibility map')),
    ).toBe(false);
  });

  it('keeps structural validation: a missing title still fails', () => {
    const broken = { ...template('esthetician-apprenticeship'), title: '' };
    const result = validateCourseTemplate(broken as CourseTemplate);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'title')).toBe(true);
  });

  it('keeps structural validation: a malformed course slug still fails', () => {
    const broken = {
      ...template('esthetician-apprenticeship'),
      courseSlug: 'Not A Slug',
    };
    const result = validateCourseTemplate(broken as CourseTemplate);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'courseSlug')).toBe(true);
  });
});
