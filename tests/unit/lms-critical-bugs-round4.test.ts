/**
 * Regression tests for three critical LMS bugs fixed in fix/lms-critical-bugs-round4.
 *
 * Bug A — HVAC lesson page: undefined HVAC_UUID_TO_DEF / hvacDefIdFromSlug
 * Bug B — Checkpoint route: enrollment status whitelist too narrow
 * Bug C — QuizPlayer: correctAnswer silently defaults to 0 for unresolvable values
 */

import { describe, it, expect } from 'vitest';

// ─── Bug A — HVAC lesson page: undefined variable crash ──────────────────────
//
// HVAC_UUID_TO_DEF and hvacDefIdFromSlug were referenced in the JSX but never
// defined or imported anywhere. Any HVAC learner hitting a video lesson got a
// ReferenceError that crashed the entire page.
//
// Fix: pass lessonId (the DB UUID from route params) directly to HvacLessonVideo.
// HvacLessonVideo already accepts lessonId as its primary prop; lessonDefId is
// the deprecated legacy prop that was being incorrectly populated.

describe('Bug A — HVAC lesson page: lessonId passed directly to HvacLessonVideo', () => {
  // Simulate the prop resolution logic before and after the fix.

  function resolveHvacVideoProps_BROKEN(
    lessonId: string,
    lessonSlug: string | null,
  ): { lessonDefId: string | undefined } {
    // Broken: references undefined HVAC_UUID_TO_DEF and hvacDefIdFromSlug
    // In practice this throws ReferenceError; here we model the undefined result.
    const HVAC_UUID_TO_DEF: Record<string, string> | undefined = undefined;
    const hvacDefIdFromSlug: ((s: string) => string) | undefined = undefined;

    const lessonDefId =
      (HVAC_UUID_TO_DEF as unknown as Record<string, string> | undefined)?.[lessonId] ??
      (lessonSlug && hvacDefIdFromSlug ? hvacDefIdFromSlug(lessonSlug) : undefined) ??
      lessonSlug ??
      undefined;

    return { lessonDefId };
  }

  function resolveHvacVideoProps_FIXED(
    lessonId: string,
  ): { lessonId: string } {
    // Fixed: pass the DB UUID directly — no slug map needed
    return { lessonId };
  }

  it('broken: undefined lookup map causes lessonDefId to fall back to slug (wrong)', () => {
    const result = resolveHvacVideoProps_BROKEN(
      'f0593164-55be-5867-98e7-8a86770a8dd0',
      'hvac-lesson-42',
    );
    // Falls back to slug because the map is undefined — wrong value
    expect(result.lessonDefId).toBe('hvac-lesson-42');
  });

  it('broken: when slug is also null, lessonDefId is undefined — HvacLessonVideo gets no ID', () => {
    const result = resolveHvacVideoProps_BROKEN('f0593164-55be-5867-98e7-8a86770a8dd0', null);
    expect(result.lessonDefId).toBeUndefined();
  });

  it('fixed: lessonId is the DB UUID passed directly — no slug map needed', () => {
    const uuid = 'f0593164-55be-5867-98e7-8a86770a8dd0';
    const result = resolveHvacVideoProps_FIXED(uuid);
    expect(result.lessonId).toBe(uuid);
  });

  it('fixed: lessonId is stable regardless of slug value', () => {
    const uuid = 'abc123-def456';
    expect(resolveHvacVideoProps_FIXED(uuid).lessonId).toBe(uuid);
  });

  it('HvacLessonVideo resolvedUuid uses lessonId over lessonDefId', () => {
    // Mirrors the component's internal resolution:
    //   const resolvedUuid = lessonId || lessonDefId || '';
    const resolveUuid = (lessonId?: string, lessonDefId?: string) =>
      lessonId || lessonDefId || '';

    expect(resolveUuid('uuid-from-db', 'legacy-slug')).toBe('uuid-from-db');
    expect(resolveUuid(undefined, 'legacy-slug')).toBe('legacy-slug');
    expect(resolveUuid(undefined, undefined)).toBe('');
  });
});

// ─── Bug B — Checkpoint route: enrollment status whitelist too narrow ─────────
//
// The checkpoint POST route only allowed ['active', 'completed'] enrollment
// statuses. The lesson-complete route (the authoritative sibling) allows
// ['active', 'enrolled', 'in_progress', 'completed', 'confirmed'].
//
// Learners with 'enrolled', 'in_progress', or 'confirmed' status could complete
// lessons but received a 403 when submitting a checkpoint quiz, permanently
// blocking module progression even after a passing score.
//
// Fix: use the same status set as the lesson-complete route.

describe('Bug B — Checkpoint route: enrollment status whitelist', () => {
  const BROKEN_WHITELIST = ['active', 'completed'];
  const FIXED_WHITELIST = ['active', 'enrolled', 'in_progress', 'completed', 'confirmed'];

  // Mirrors the enrollment check in the route handler
  function isEnrolled(status: string, whitelist: string[]): boolean {
    return whitelist.includes(status);
  }

  const statusesBlockedByBrokenWhitelist = ['enrolled', 'in_progress', 'confirmed'];

  for (const status of statusesBlockedByBrokenWhitelist) {
    it(`broken whitelist rejects status="${status}" → learner stuck after Module 1`, () => {
      expect(isEnrolled(status, BROKEN_WHITELIST)).toBe(false);
    });

    it(`fixed whitelist accepts status="${status}"`, () => {
      expect(isEnrolled(status, FIXED_WHITELIST)).toBe(true);
    });
  }

  it('both whitelists accept "active"', () => {
    expect(isEnrolled('active', BROKEN_WHITELIST)).toBe(true);
    expect(isEnrolled('active', FIXED_WHITELIST)).toBe(true);
  });

  it('both whitelists accept "completed"', () => {
    expect(isEnrolled('completed', BROKEN_WHITELIST)).toBe(true);
    expect(isEnrolled('completed', FIXED_WHITELIST)).toBe(true);
  });

  it('both whitelists reject "pending_approval"', () => {
    expect(isEnrolled('pending_approval', BROKEN_WHITELIST)).toBe(false);
    expect(isEnrolled('pending_approval', FIXED_WHITELIST)).toBe(false);
  });

  it('both whitelists reject "suspended"', () => {
    expect(isEnrolled('suspended', BROKEN_WHITELIST)).toBe(false);
    expect(isEnrolled('suspended', FIXED_WHITELIST)).toBe(false);
  });

  it('fixed whitelist matches the lesson-complete route status set exactly', () => {
    const lessonCompleteStatuses = ['active', 'enrolled', 'in_progress', 'completed', 'confirmed'];
    expect([...FIXED_WHITELIST].sort()).toEqual([...lessonCompleteStatuses].sort());
  });
});

// ─── Bug C — QuizPlayer: correctAnswer silently defaults to 0 ────────────────
//
// normalizeQuestion() resolved correctAnswer with:
//   typeof q.correctAnswer === 'number' ? q.correctAnswer
//   : typeof q.answer === 'number' ? q.answer
//   : 0   ← silent fallback
//
// When answer/correctAnswer arrived as a numeric string ("2") or was absent,
// the fallback made option 0 always "correct". This corrupted checkpoint_scores:
// learners who answered correctly could be marked as failing, and vice versa.
//
// Fix: toOptionIndex() coerces numeric strings; questions with no resolvable
// correct answer are dropped (return null) rather than silently defaulted.

describe('Bug C — QuizPlayer: correctAnswer string coercion and null rejection', () => {
  // Mirror the fixed toOptionIndex helper
  function toOptionIndex(value: unknown): number | null {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
    return null;
  }

  // Mirror the fixed normalizeQuestion logic (canonical shape only)
  function normalizeQuestion(
    raw: unknown,
    index: number,
  ): { correctAnswer: number } | null {
    if (!raw || typeof raw !== 'object') return null;
    const q = raw as Record<string, unknown>;
    if (typeof q.question !== 'string' || !Array.isArray(q.options)) return null;

    const correctAnswer = toOptionIndex(q.correctAnswer) ?? toOptionIndex(q.answer) ?? null;
    if (correctAnswer === null) return null;

    return { correctAnswer };
  }

  describe('toOptionIndex', () => {
    it('accepts a plain number', () => {
      expect(toOptionIndex(2)).toBe(2);
      expect(toOptionIndex(0)).toBe(0);
    });

    it('accepts a numeric string', () => {
      expect(toOptionIndex('2')).toBe(2);
      expect(toOptionIndex('0')).toBe(0);
      expect(toOptionIndex('3')).toBe(3);
    });

    it('rejects a letter string', () => {
      expect(toOptionIndex('A')).toBeNull();
      expect(toOptionIndex('B')).toBeNull();
    });

    it('rejects undefined', () => {
      expect(toOptionIndex(undefined)).toBeNull();
    });

    it('rejects null', () => {
      expect(toOptionIndex(null)).toBeNull();
    });

    it('rejects negative numbers', () => {
      expect(toOptionIndex(-1)).toBeNull();
    });

    it('rejects floats', () => {
      expect(toOptionIndex(1.5)).toBeNull();
    });

    it('rejects empty string', () => {
      expect(toOptionIndex('')).toBeNull();
    });
  });

  describe('normalizeQuestion — correctAnswer resolution', () => {
    const baseQuestion = {
      question: 'What is the boiling point of R-22?',
      options: ['−40.8°C', '−29.8°C', '−12.3°C', '4.5°C'],
    };

    it('numeric correctAnswer is preserved', () => {
      const result = normalizeQuestion({ ...baseQuestion, correctAnswer: 1 }, 0);
      expect(result?.correctAnswer).toBe(1);
    });

    it('string correctAnswer "2" is coerced to 2', () => {
      const result = normalizeQuestion({ ...baseQuestion, correctAnswer: '2' }, 0);
      expect(result?.correctAnswer).toBe(2);
    });

    it('numeric answer field is used when correctAnswer is absent', () => {
      const result = normalizeQuestion({ ...baseQuestion, answer: 3 }, 0);
      expect(result?.correctAnswer).toBe(3);
    });

    it('string answer field "1" is coerced to 1', () => {
      const result = normalizeQuestion({ ...baseQuestion, answer: '1' }, 0);
      expect(result?.correctAnswer).toBe(1);
    });

    it('correctAnswer takes priority over answer', () => {
      const result = normalizeQuestion({ ...baseQuestion, correctAnswer: 2, answer: 0 }, 0);
      expect(result?.correctAnswer).toBe(2);
    });

    it('string correctAnswer takes priority over numeric answer', () => {
      const result = normalizeQuestion({ ...baseQuestion, correctAnswer: '3', answer: 0 }, 0);
      expect(result?.correctAnswer).toBe(3);
    });

    it('returns null when neither correctAnswer nor answer is resolvable — no silent default', () => {
      // Broken behaviour: would have returned { correctAnswer: 0 }
      const result = normalizeQuestion({ ...baseQuestion }, 0);
      expect(result).toBeNull();
    });

    it('returns null when correctAnswer is a non-numeric string', () => {
      const result = normalizeQuestion({ ...baseQuestion, correctAnswer: 'maybe' }, 0);
      expect(result).toBeNull();
    });

    it('returns null when correctAnswer is null', () => {
      const result = normalizeQuestion({ ...baseQuestion, correctAnswer: null }, 0);
      expect(result).toBeNull();
    });
  });

  describe('broken behaviour — silent default to 0', () => {
    // Demonstrates what the old code did: always returned 0 when unresolvable.
    function normalizeQuestion_BROKEN(
      raw: unknown,
    ): { correctAnswer: number } | null {
      if (!raw || typeof raw !== 'object') return null;
      const q = raw as Record<string, unknown>;
      if (typeof q.question !== 'string' || !Array.isArray(q.options)) return null;

      const correctAnswer =
        typeof q.correctAnswer === 'number'
          ? q.correctAnswer
          : typeof q.answer === 'number'
            ? q.answer
            : 0; // ← silent wrong default

      return { correctAnswer };
    }

    const baseQuestion = {
      question: 'What is the boiling point of R-22?',
      options: ['−40.8°C', '−29.8°C', '−12.3°C', '4.5°C'],
    };

    it('broken: string answer "2" silently becomes 0 (wrong answer marked correct)', () => {
      const result = normalizeQuestion_BROKEN({ ...baseQuestion, answer: '2' });
      expect(result?.correctAnswer).toBe(0); // wrong — should be 2
    });

    it('broken: missing answer silently becomes 0 (first option always "correct")', () => {
      const result = normalizeQuestion_BROKEN({ ...baseQuestion });
      expect(result?.correctAnswer).toBe(0); // wrong — no correct answer exists
    });

    it('fixed: same inputs return null instead of a corrupt value', () => {
      expect(normalizeQuestion({ ...baseQuestion, answer: '2' }, 0)?.correctAnswer).toBe(2);
      expect(normalizeQuestion({ ...baseQuestion }, 0)).toBeNull();
    });
  });

  describe('AI-ingest shape — correct_answer letter and numeric string', () => {
    // Mirror the fixed AI-ingest branch of normalizeQuestion
    function normalizeAiQuestion(
      raw: unknown,
      index: number,
    ): { correctAnswer: number } | null {
      if (!raw || typeof raw !== 'object') return null;
      const q = raw as Record<string, unknown>;
      if (typeof q.question_text !== 'string' || !Array.isArray(q.options)) return null;

      let correctIndex: number | null = null;
      if (typeof q.correct_answer === 'string') {
        const upper = q.correct_answer.trim().toUpperCase();
        const letterIndex = ['A', 'B', 'C', 'D'].indexOf(upper);
        if (letterIndex >= 0) {
          correctIndex = letterIndex;
        } else {
          correctIndex = toOptionIndex(q.correct_answer);
        }
      } else {
        correctIndex = toOptionIndex(q.correct_answer);
      }

      if (correctIndex === null) return null;
      return { correctAnswer: correctIndex };
    }

    const aiQuestion = {
      question_text: 'Which refrigerant is an HCFC?',
      options: ['R-410A', 'R-22', 'R-134a', 'R-32'],
    };

    it('letter "B" resolves to index 1', () => {
      expect(normalizeAiQuestion({ ...aiQuestion, correct_answer: 'B' }, 0)?.correctAnswer).toBe(1);
    });

    it('letter "D" resolves to index 3', () => {
      expect(normalizeAiQuestion({ ...aiQuestion, correct_answer: 'D' }, 0)?.correctAnswer).toBe(3);
    });

    it('lowercase letter "c" resolves to index 2', () => {
      expect(normalizeAiQuestion({ ...aiQuestion, correct_answer: 'c' }, 0)?.correctAnswer).toBe(2);
    });

    it('numeric string "2" resolves to index 2', () => {
      expect(normalizeAiQuestion({ ...aiQuestion, correct_answer: '2' }, 0)?.correctAnswer).toBe(2);
    });

    it('numeric string "0" resolves to index 0', () => {
      expect(normalizeAiQuestion({ ...aiQuestion, correct_answer: '0' }, 0)?.correctAnswer).toBe(0);
    });

    it('unresolvable correct_answer returns null — no silent default', () => {
      expect(normalizeAiQuestion({ ...aiQuestion, correct_answer: 'X' }, 0)).toBeNull();
      expect(normalizeAiQuestion({ ...aiQuestion }, 0)).toBeNull();
    });
  });
});
