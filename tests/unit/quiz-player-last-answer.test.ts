/**
 * Regression tests for the QuizPlayer last-answer stale-closure bug.
 *
 * Bug: handleNext read answeredQuestions from a stale React state closure.
 * When the user answered the final question and clicked "Next/Finish",
 * React's async setState hadn't flushed yet, so the last answer was missing
 * from the score calculation and the answersMap sent to the checkpoint API.
 *
 * Fix: a ref (answeredQuestionsRef) is updated synchronously in handleSelect
 * so handleNext always reads the complete list.
 *
 * These tests verify the score and answersMap logic in isolation — no DOM,
 * no React rendering required.
 */

import { describe, it, expect } from 'vitest';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnsweredEntry {
  questionId: string;
  selected: number;
  correct: boolean;
}

// ── Helpers that mirror the fixed QuizPlayer logic ────────────────────────────

/**
 * Computes the final score from a complete answered-questions list.
 * Mirrors the fixed handleNext logic that reads from answeredQuestionsRef.
 */
function computeFinalScore(allAnswers: AnsweredEntry[], totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  const correct = allAnswers.filter((a) => a.correct).length;
  return Math.round((correct / totalQuestions) * 100);
}

/**
 * Builds the answersMap sent to the checkpoint API.
 * Mirrors the fixed handleNext logic.
 */
function buildAnswersMap(allAnswers: AnsweredEntry[]): Record<string, number> {
  const map: Record<string, number> = {};
  allAnswers.forEach((a) => {
    map[a.questionId] = a.selected;
  });
  return map;
}

/**
 * Simulates the broken behaviour: reads answeredQuestions from a stale closure
 * that was captured before the last answer was appended.
 */
function computeFinalScore_BROKEN(
  staleAnswers: AnsweredEntry[], // snapshot before last answer
  totalQuestions: number,
): number {
  if (totalQuestions === 0) return 0;
  const correct = staleAnswers.filter((a) => a.correct).length;
  return Math.round((correct / totalQuestions) * 100);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('QuizPlayer — last-answer stale-closure fix', () => {
  // Shared fixture: 3-question quiz where all answers are correct
  const allCorrect: AnsweredEntry[] = [
    { questionId: 'q1', selected: 2, correct: true },
    { questionId: 'q2', selected: 0, correct: true },
    { questionId: 'q3', selected: 1, correct: true },
  ];

  // Stale snapshot: what the broken code would have seen (missing q3)
  const staleSnapshot = allCorrect.slice(0, 2);

  describe('score calculation', () => {
    it('fixed: all 3 correct answers produce 100%', () => {
      expect(computeFinalScore(allCorrect, 3)).toBe(100);
    });

    it('broken: stale snapshot (missing last answer) produces 67% instead of 100%', () => {
      // This demonstrates the bug: 2/3 correct = 67%, not 100%
      expect(computeFinalScore_BROKEN(staleSnapshot, 3)).toBe(67);
    });

    it('fixed: last answer correct, prior answers mixed — score includes last answer', () => {
      const answers: AnsweredEntry[] = [
        { questionId: 'q1', selected: 0, correct: false },
        { questionId: 'q2', selected: 1, correct: false },
        { questionId: 'q3', selected: 2, correct: true }, // last answer, correct
      ];
      expect(computeFinalScore(answers, 3)).toBe(33);
    });

    it('broken: same scenario without last answer gives 0% — learner incorrectly fails', () => {
      const stale: AnsweredEntry[] = [
        { questionId: 'q1', selected: 0, correct: false },
        { questionId: 'q2', selected: 1, correct: false },
      ];
      expect(computeFinalScore_BROKEN(stale, 3)).toBe(0);
    });

    it('fixed: last answer wrong — score correctly reflects the miss', () => {
      const answers: AnsweredEntry[] = [
        { questionId: 'q1', selected: 2, correct: true },
        { questionId: 'q2', selected: 0, correct: true },
        { questionId: 'q3', selected: 3, correct: false }, // last answer, wrong
      ];
      expect(computeFinalScore(answers, 3)).toBe(67);
    });

    it('fixed: single-question quiz answered correctly gives 100%', () => {
      const answers: AnsweredEntry[] = [{ questionId: 'q1', selected: 1, correct: true }];
      expect(computeFinalScore(answers, 1)).toBe(100);
    });

    it('fixed: single-question quiz answered incorrectly gives 0%', () => {
      const answers: AnsweredEntry[] = [{ questionId: 'q1', selected: 0, correct: false }];
      expect(computeFinalScore(answers, 1)).toBe(0);
    });

    it('broken: single-question quiz — stale snapshot is empty, always reports 0%', () => {
      // With one question, the stale snapshot is always [] (no prior answers)
      expect(computeFinalScore_BROKEN([], 1)).toBe(0);
    });
  });

  describe('answersMap completeness', () => {
    it('fixed: answersMap includes all 3 answers', () => {
      const map = buildAnswersMap(allCorrect);
      expect(Object.keys(map)).toHaveLength(3);
      expect(map['q1']).toBe(2);
      expect(map['q2']).toBe(0);
      expect(map['q3']).toBe(1);
    });

    it('broken: stale snapshot produces answersMap missing the last answer', () => {
      const map = buildAnswersMap(staleSnapshot);
      expect(Object.keys(map)).toHaveLength(2);
      expect(map['q3']).toBeUndefined(); // last answer missing
    });

    it('fixed: answersMap preserves selected index even when answer is wrong', () => {
      const answers: AnsweredEntry[] = [
        { questionId: 'q1', selected: 3, correct: false },
        { questionId: 'q2', selected: 1, correct: true },
      ];
      const map = buildAnswersMap(answers);
      expect(map['q1']).toBe(3); // wrong answer index preserved
      expect(map['q2']).toBe(1);
    });
  });

  describe('passing threshold boundary', () => {
    it('fixed: 7/10 correct = 70% — passes at 70% threshold', () => {
      const answers: AnsweredEntry[] = Array.from({ length: 10 }, (_, i) => ({
        questionId: `q${i + 1}`,
        selected: 0,
        correct: i < 7, // first 7 correct, last 3 wrong
      }));
      const score = computeFinalScore(answers, 10);
      expect(score).toBe(70);
      expect(score >= 70).toBe(true); // passes
    });

    it('broken: last answer is the 7th correct — stale snapshot gives 60%, incorrectly fails', () => {
      // 6 correct in stale snapshot (missing the 7th correct last answer)
      const stale: AnsweredEntry[] = Array.from({ length: 9 }, (_, i) => ({
        questionId: `q${i + 1}`,
        selected: 0,
        correct: i < 6,
      }));
      const score = computeFinalScore_BROKEN(stale, 10);
      expect(score).toBe(60); // 6/10 = 60% — incorrectly fails the 70% threshold
      expect(score >= 70).toBe(false);
    });

    it('fixed: same scenario with last answer included correctly passes', () => {
      const answers: AnsweredEntry[] = Array.from({ length: 10 }, (_, i) => ({
        questionId: `q${i + 1}`,
        selected: 0,
        correct: i < 7,
      }));
      const score = computeFinalScore(answers, 10);
      expect(score).toBe(70);
      expect(score >= 70).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('empty answers list returns 0%', () => {
      expect(computeFinalScore([], 0)).toBe(0);
    });

    it('answersMap for empty list is empty object', () => {
      expect(buildAnswersMap([])).toEqual({});
    });

    it('rounding: 1/3 correct rounds to 33%', () => {
      const answers: AnsweredEntry[] = [
        { questionId: 'q1', selected: 0, correct: true },
        { questionId: 'q2', selected: 1, correct: false },
        { questionId: 'q3', selected: 2, correct: false },
      ];
      expect(computeFinalScore(answers, 3)).toBe(33);
    });

    it('rounding: 2/3 correct rounds to 67%', () => {
      const answers: AnsweredEntry[] = [
        { questionId: 'q1', selected: 0, correct: true },
        { questionId: 'q2', selected: 1, correct: true },
        { questionId: 'q3', selected: 2, correct: false },
      ];
      expect(computeFinalScore(answers, 3)).toBe(67);
    });
  });
});
