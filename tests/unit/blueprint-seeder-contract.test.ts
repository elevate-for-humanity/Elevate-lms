/**
 * Blueprint seeder production-content contract tests.
 *
 * Verifies that validateProductionContent() enforces the rule:
 * production-complete row or no row at all.
 *
 * These tests do not touch the DB. They exercise the validation
 * function directly to prove the gate works before any insert.
 */

import { describe, it, expect } from 'vitest';
import {
  validateProductionContent,
  inferStepType,
  visibleTextLength,
} from '@/lib/curriculum/builders/buildCanonicalCourseFromBlueprint';
import type { BlueprintLessonRef } from '@/lib/curriculum/blueprints/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const GOOD_CONTENT = '<p>' + 'A'.repeat(250) + '</p>';

const GOOD_QUESTIONS = Array.from({ length: 5 }, (_, i) => ({
  id:            `q${i + 1}`,
  question:      `Question ${i + 1}?`,
  options:       ['A', 'B', 'C', 'D'],
  correctAnswer: 0,
  explanation:   'Because A.',
}));

function lessonRef(overrides: Partial<BlueprintLessonRef> = {}): BlueprintLessonRef {
  return {
    slug:      'intro-to-hvac',
    title:     'Intro to HVAC',
    order:     1,
    domainKey: 'foundations',
    ...overrides,
  };
}

// ── inferStepType ─────────────────────────────────────────────────────────────

describe('inferStepType', () => {
  it('returns lesson for plain slugs', () => {
    expect(inferStepType('intro-to-hvac')).toBe('lesson');
    expect(inferStepType('refrigerant-basics')).toBe('lesson');
  });

  it('returns checkpoint for -checkpoint suffix', () => {
    expect(inferStepType('module-1-checkpoint')).toBe('checkpoint');
  });

  it('returns exam for -exam suffix', () => {
    expect(inferStepType('epa-608-final-exam')).toBe('exam');
  });

  it('returns exam for -practice-exam suffix', () => {
    expect(inferStepType('type-i-practice-exam')).toBe('exam');
  });

  it('returns quiz for -quiz suffix', () => {
    expect(inferStepType('safety-quiz')).toBe('quiz');
  });

  it('returns lab for -lab suffix', () => {
    expect(inferStepType('refrigerant-recovery-lab')).toBe('lab');
  });

  it('returns assignment for -assignment suffix', () => {
    expect(inferStepType('field-report-assignment')).toBe('assignment');
  });
});

// ── visibleTextLength ─────────────────────────────────────────────────────────

describe('visibleTextLength', () => {
  it('strips HTML tags before measuring', () => {
    expect(visibleTextLength('<p>Hello world</p>')).toBe(11);
  });

  it('counts only visible characters', () => {
    const html = '<h1>Title</h1><p>' + 'x'.repeat(200) + '</p>';
    expect(visibleTextLength(html)).toBe(205); // "Title" + 200 x's
  });
});

// ── lesson step_type ──────────────────────────────────────────────────────────

describe('validateProductionContent — lesson', () => {
  it('passes when content and objective are present', () => {
    const violations = validateProductionContent(
      lessonRef({ content: GOOD_CONTENT, objective: 'Understand HVAC basics.' }),
      'lesson',
    );
    expect(violations).toHaveLength(0);
  });

  it('fails when content is missing', () => {
    const violations = validateProductionContent(
      lessonRef({ objective: 'Understand HVAC basics.' }),
      'lesson',
    );
    expect(violations.some(v => v.field === 'content')).toBe(true);
  });

  it('fails when content is too short', () => {
    const violations = validateProductionContent(
      lessonRef({ content: '<p>Short.</p>', objective: 'Learn something.' }),
      'lesson',
    );
    expect(violations.some(v => v.field === 'content' && v.reason.includes('too short'))).toBe(true);
  });

  it('fails when objective is missing', () => {
    const violations = validateProductionContent(
      lessonRef({ content: GOOD_CONTENT }),
      'lesson',
    );
    expect(violations.some(v => v.field === 'objective')).toBe(true);
  });

  it('fails with multiple violations when both fields are missing', () => {
    const violations = validateProductionContent(lessonRef(), 'lesson');
    expect(violations.length).toBeGreaterThanOrEqual(2);
    const fields = violations.map(v => v.field);
    expect(fields).toContain('objective');
    expect(fields).toContain('content');
  });
});

// ── checkpoint step_type ──────────────────────────────────────────────────────

describe('validateProductionContent — checkpoint', () => {
  it('passes when all required fields are present', () => {
    const violations = validateProductionContent(
      lessonRef({
        content:       GOOD_CONTENT,
        objective:     'Demonstrate refrigerant handling.',
        quizQuestions: GOOD_QUESTIONS,
        passingScore:  70,
      }),
      'checkpoint',
    );
    expect(violations).toHaveLength(0);
  });

  it('fails when quizQuestions is missing', () => {
    const violations = validateProductionContent(
      lessonRef({ content: GOOD_CONTENT, objective: 'Learn.', passingScore: 70 }),
      'checkpoint',
    );
    expect(violations.some(v => v.field === 'quizQuestions')).toBe(true);
  });

  it('fails when quizQuestions has fewer than 5 questions', () => {
    const violations = validateProductionContent(
      lessonRef({
        content:       GOOD_CONTENT,
        objective:     'Learn.',
        quizQuestions: GOOD_QUESTIONS.slice(0, 3),
        passingScore:  70,
      }),
      'checkpoint',
    );
    expect(violations.some(v => v.field === 'quizQuestions' && v.reason.includes('only 3'))).toBe(true);
  });

  it('fails when passingScore is missing', () => {
    const violations = validateProductionContent(
      lessonRef({ content: GOOD_CONTENT, objective: 'Learn.', quizQuestions: GOOD_QUESTIONS }),
      'checkpoint',
    );
    expect(violations.some(v => v.field === 'passingScore')).toBe(true);
  });

  it('fails when passingScore is out of range', () => {
    const violations = validateProductionContent(
      lessonRef({
        content:       GOOD_CONTENT,
        objective:     'Learn.',
        quizQuestions: GOOD_QUESTIONS,
        passingScore:  0,
      }),
      'checkpoint',
    );
    expect(violations.some(v => v.field === 'passingScore' && v.reason.includes('out of range'))).toBe(true);
  });
});

// ── quiz / exam step_type ─────────────────────────────────────────────────────

describe('validateProductionContent — quiz/exam', () => {
  it('passes with quizQuestions and passingScore only (no content required)', () => {
    const violations = validateProductionContent(
      lessonRef({ quizQuestions: GOOD_QUESTIONS, passingScore: 70 }),
      'quiz',
    );
    expect(violations).toHaveLength(0);
  });

  it('passes for exam type with same fields', () => {
    const violations = validateProductionContent(
      lessonRef({ quizQuestions: GOOD_QUESTIONS, passingScore: 80 }),
      'exam',
    );
    expect(violations).toHaveLength(0);
  });

  it('fails when quizQuestions is missing for quiz', () => {
    const violations = validateProductionContent(
      lessonRef({ passingScore: 70 }),
      'quiz',
    );
    expect(violations.some(v => v.field === 'quizQuestions')).toBe(true);
  });

  it('does not require content for quiz type', () => {
    const violations = validateProductionContent(
      lessonRef({ quizQuestions: GOOD_QUESTIONS, passingScore: 70 }),
      'quiz',
    );
    expect(violations.some(v => v.field === 'content')).toBe(false);
  });
});

// ── lab / assignment step_type ────────────────────────────────────────────────

describe('validateProductionContent — lab/assignment', () => {
  it('passes with content and objective', () => {
    const violations = validateProductionContent(
      lessonRef({ content: GOOD_CONTENT, objective: 'Complete the lab.' }),
      'lab',
    );
    expect(violations).toHaveLength(0);
  });

  it('does not require quizQuestions for lab', () => {
    const violations = validateProductionContent(
      lessonRef({ content: GOOD_CONTENT, objective: 'Complete the lab.' }),
      'lab',
    );
    expect(violations.some(v => v.field === 'quizQuestions')).toBe(false);
  });

  it('fails when content is missing for assignment', () => {
    const violations = validateProductionContent(
      lessonRef({ objective: 'Write a report.' }),
      'assignment',
    );
    expect(violations.some(v => v.field === 'content')).toBe(true);
  });
});

// ── empty blueprint lesson ref (the old broken state) ────────────────────────

describe('validateProductionContent — empty ref (old broken state)', () => {
  it('rejects a bare lesson ref with only slug/title/order/domainKey', () => {
    // This is exactly what PRS and bookkeeping blueprints currently have.
    // Every one of these would have been inserted as a draft shell before the fix.
    const violations = validateProductionContent(lessonRef(), 'lesson');
    expect(violations.length).toBeGreaterThan(0);
  });

  it('rejects a bare checkpoint ref', () => {
    const violations = validateProductionContent(
      lessonRef({ slug: 'module-1-checkpoint' }),
      'checkpoint',
    );
    expect(violations.length).toBeGreaterThanOrEqual(3); // objective, content, quizQuestions, passingScore
  });
});
