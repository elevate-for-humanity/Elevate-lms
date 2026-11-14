/**
 * Unit tests for lib/lms/progress-calc.ts
 *
 * calcProgressPercent and isCourseComplete are pure math functions with no
 * DB calls. They are the single source of truth for all progress percentages
 * stored in program_enrollments.progress_percent.
 *
 * Imported directly — no server-only guard in this file.
 */

import { describe, it, expect } from 'vitest';
import { calcProgressPercent, isCourseComplete } from '@/lib/lms/progress-calc';

// ─── calcProgressPercent ──────────────────────────────────────────────────────

describe('calcProgressPercent', () => {
  it('returns 0 when totalLessons is 0 (division-by-zero guard)', () => {
    expect(calcProgressPercent(0, 0)).toBe(0);
  });

  it('returns 0 when completedLessons is 0', () => {
    expect(calcProgressPercent(0, 10)).toBe(0);
  });

  it('returns 100 when all lessons are complete', () => {
    expect(calcProgressPercent(10, 10)).toBe(100);
  });

  it('returns 50 for 5 of 10 lessons', () => {
    expect(calcProgressPercent(5, 10)).toBe(50);
  });

  it('returns 33 for 1 of 3 lessons (rounds down)', () => {
    expect(calcProgressPercent(1, 3)).toBe(33);
  });

  it('returns 67 for 2 of 3 lessons (rounds up)', () => {
    expect(calcProgressPercent(2, 3)).toBe(67);
  });

  it('clamps to 100 when completedLessons exceeds totalLessons', () => {
    // Over-completion guard: should never exceed 100
    expect(calcProgressPercent(12, 10)).toBe(100);
  });

  it('returns an integer with no decimal places', () => {
    const result = calcProgressPercent(1, 7);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('returns 1 for 1 of 100 lessons', () => {
    expect(calcProgressPercent(1, 100)).toBe(1);
  });

  it('returns 99 for 99 of 100 lessons', () => {
    expect(calcProgressPercent(99, 100)).toBe(99);
  });
});

// ─── isCourseComplete ─────────────────────────────────────────────────────────

describe('isCourseComplete', () => {
  it('returns false when totalLessons is 0 (no lessons → never complete)', () => {
    expect(isCourseComplete(100, 0)).toBe(false);
  });

  it('returns false when progressPercent is 99', () => {
    expect(isCourseComplete(99, 10)).toBe(false);
  });

  it('returns false when progressPercent is 0', () => {
    expect(isCourseComplete(0, 10)).toBe(false);
  });

  it('returns true when progressPercent is 100 and totalLessons > 0', () => {
    expect(isCourseComplete(100, 10)).toBe(true);
  });

  it('returns true for a single-lesson course that is complete', () => {
    expect(isCourseComplete(100, 1)).toBe(true);
  });

  it('returns false when progressPercent is 100 but totalLessons is 0', () => {
    // Edge case: 100% with no lessons is not a valid completion
    expect(isCourseComplete(100, 0)).toBe(false);
  });
});
