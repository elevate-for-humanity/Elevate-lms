/**
 * Unit tests for checkpoint score deduplication in getLearnerProgress.
 *
 * Bug: checkpoint_scores were ordered by attempt_number DESC (most recent first).
 * When a learner passed attempt 2 then retook and failed attempt 3, the most
 * recent row (failed) was returned as the "best" score. The lesson page UI read
 * this and showed the learner as blocked, even though the server-side gate
 * (enforceCheckpointGate) correctly queries for passed=true and would let them
 * through.
 *
 * Fix: order by passed DESC, score DESC so the best attempt (passing, then
 * highest score) is always the first row per lesson_id.
 *
 * These tests exercise the deduplication logic extracted from getLearnerProgress
 * as a pure function, matching the pattern used in lesson-page-checkpoint-gating.test.ts.
 */

import { describe, it, expect } from 'vitest';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawCheckpointRow {
  lesson_id: string;
  score: number;
  passed: boolean;
  passing_score: number;
  attempt_number: number;
  created_at: string;
}

interface CheckpointScore {
  lessonId: string;
  score: number;
  passed: boolean;
  passingScore: number;
  attemptNumber: number;
  createdAt: string;
}

// ─── Pure helpers mirroring getLearnerProgress ────────────────────────────────

/**
 * Sorts checkpoint rows the way the fixed getLearnerProgress query does:
 * passed DESC (true before false), then score DESC.
 *
 * In production this ordering is applied by Supabase (.order('passed', { ascending: false })
 * .order('score', { ascending: false })). This helper lets us test the deduplication
 * logic without a live DB connection.
 */
function sortCheckpointRows(rows: RawCheckpointRow[]): RawCheckpointRow[] {
  return [...rows].sort((a, b) => {
    // passed DESC: true (1) before false (0)
    if (a.passed !== b.passed) return a.passed ? -1 : 1;
    // score DESC
    return b.score - a.score;
  });
}

/**
 * Deduplicates sorted checkpoint rows, keeping the first row per lesson_id.
 * Mirrors the Map-building loop in getLearnerProgress.
 */
function deduplicateCheckpoints(rows: RawCheckpointRow[]): Map<string, CheckpointScore> {
  const checkpointScores = new Map<string, CheckpointScore>();
  for (const row of rows) {
    if (!checkpointScores.has(row.lesson_id)) {
      checkpointScores.set(row.lesson_id, {
        lessonId: row.lesson_id,
        score: row.score,
        passed: row.passed,
        passingScore: row.passing_score,
        attemptNumber: row.attempt_number,
        createdAt: row.created_at,
      });
    }
  }
  return checkpointScores;
}

/** Convenience: sort then deduplicate. */
function getBestCheckpointScores(rows: RawCheckpointRow[]): Map<string, CheckpointScore> {
  return deduplicateCheckpoints(sortCheckpointRows(rows));
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LESSON_ID = 'cp-lesson-1';
const BASE = { lesson_id: LESSON_ID, passing_score: 70, created_at: '2026-01-01T00:00:00Z' };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getLearnerProgress — checkpoint score deduplication', () => {
  describe('core bug: pass then fail scenario', () => {
    it('returns the passing attempt when a later attempt fails', () => {
      // Learner passes attempt 2 (80%), then retakes and fails attempt 3 (65%).
      // The old code (order by attempt_number DESC) returned attempt 3 → passed=false.
      // The fixed code (order by passed DESC, score DESC) returns attempt 2 → passed=true.
      const rows: RawCheckpointRow[] = [
        { ...BASE, attempt_number: 1, score: 55, passed: false },
        { ...BASE, attempt_number: 2, score: 80, passed: true },
        { ...BASE, attempt_number: 3, score: 65, passed: false },
      ];

      const scores = getBestCheckpointScores(rows);
      const best = scores.get(LESSON_ID)!;

      expect(best.passed).toBe(true);
      expect(best.score).toBe(80);
    });

    it('returns passed=false when the learner has never passed', () => {
      const rows: RawCheckpointRow[] = [
        { ...BASE, attempt_number: 1, score: 50, passed: false },
        { ...BASE, attempt_number: 2, score: 60, passed: false },
      ];

      const scores = getBestCheckpointScores(rows);
      const best = scores.get(LESSON_ID)!;

      expect(best.passed).toBe(false);
      // Highest failing score is returned
      expect(best.score).toBe(60);
    });
  });

  describe('ordering: passed DESC, score DESC', () => {
    it('prefers a passing attempt over a higher-scored failing attempt', () => {
      // Edge case: a passing attempt at 70% beats a failing attempt at 95%
      // (passing_score is 70, so 95% with passed=false is impossible in practice,
      // but the sort must be stable regardless of score magnitude)
      const rows: RawCheckpointRow[] = [
        { ...BASE, attempt_number: 1, score: 95, passed: false },
        { ...BASE, attempt_number: 2, score: 70, passed: true },
      ];

      const scores = getBestCheckpointScores(rows);
      expect(scores.get(LESSON_ID)!.passed).toBe(true);
      expect(scores.get(LESSON_ID)!.score).toBe(70);
    });

    it('returns the highest score when all attempts pass', () => {
      const rows: RawCheckpointRow[] = [
        { ...BASE, attempt_number: 1, score: 72, passed: true },
        { ...BASE, attempt_number: 2, score: 95, passed: true },
        { ...BASE, attempt_number: 3, score: 80, passed: true },
      ];

      const scores = getBestCheckpointScores(rows);
      expect(scores.get(LESSON_ID)!.score).toBe(95);
    });

    it('returns the highest score when all attempts fail', () => {
      const rows: RawCheckpointRow[] = [
        { ...BASE, attempt_number: 1, score: 40, passed: false },
        { ...BASE, attempt_number: 2, score: 65, passed: false },
        { ...BASE, attempt_number: 3, score: 55, passed: false },
      ];

      const scores = getBestCheckpointScores(rows);
      expect(scores.get(LESSON_ID)!.score).toBe(65);
      expect(scores.get(LESSON_ID)!.passed).toBe(false);
    });
  });

  describe('single attempt', () => {
    it('returns the only attempt when it passes', () => {
      const rows: RawCheckpointRow[] = [{ ...BASE, attempt_number: 1, score: 85, passed: true }];

      const scores = getBestCheckpointScores(rows);
      expect(scores.get(LESSON_ID)!.passed).toBe(true);
      expect(scores.get(LESSON_ID)!.score).toBe(85);
    });

    it('returns the only attempt when it fails', () => {
      const rows: RawCheckpointRow[] = [{ ...BASE, attempt_number: 1, score: 55, passed: false }];

      const scores = getBestCheckpointScores(rows);
      expect(scores.get(LESSON_ID)!.passed).toBe(false);
      expect(scores.get(LESSON_ID)!.score).toBe(55);
    });
  });

  describe('multiple lessons', () => {
    it('tracks best score independently per lesson_id', () => {
      const rows: RawCheckpointRow[] = [
        { ...BASE, lesson_id: 'cp-1', attempt_number: 1, score: 60, passed: false },
        { ...BASE, lesson_id: 'cp-1', attempt_number: 2, score: 80, passed: true },
        { ...BASE, lesson_id: 'cp-1', attempt_number: 3, score: 55, passed: false },
        { ...BASE, lesson_id: 'cp-2', attempt_number: 1, score: 45, passed: false },
        { ...BASE, lesson_id: 'cp-2', attempt_number: 2, score: 50, passed: false },
      ];

      const scores = getBestCheckpointScores(rows);

      // cp-1: has a passing attempt → should be unblocked
      expect(scores.get('cp-1')!.passed).toBe(true);
      expect(scores.get('cp-1')!.score).toBe(80);

      // cp-2: never passed → should remain blocked
      expect(scores.get('cp-2')!.passed).toBe(false);
      expect(scores.get('cp-2')!.score).toBe(50);
    });
  });

  describe('empty input', () => {
    it('returns an empty map when there are no checkpoint rows', () => {
      const scores = getBestCheckpointScores([]);
      expect(scores.size).toBe(0);
    });
  });

  describe('regression: old attempt_number DESC ordering', () => {
    it('demonstrates why attempt_number DESC was wrong', () => {
      // This test documents the exact failure mode of the old code.
      // Old sort: attempt_number DESC → attempt 3 (failed) is first.
      const rows: RawCheckpointRow[] = [
        { ...BASE, attempt_number: 1, score: 55, passed: false },
        { ...BASE, attempt_number: 2, score: 80, passed: true },
        { ...BASE, attempt_number: 3, score: 65, passed: false },
      ];

      // Simulate the OLD (broken) ordering: attempt_number DESC
      const oldOrdered = [...rows].sort((a, b) => b.attempt_number - a.attempt_number);
      const oldScores = deduplicateCheckpoints(oldOrdered);
      // Old code returned attempt 3 (failed) — this is the bug
      expect(oldScores.get(LESSON_ID)!.passed).toBe(false);
      expect(oldScores.get(LESSON_ID)!.attemptNumber).toBe(3);

      // Fixed ordering: passed DESC, score DESC
      const newScores = getBestCheckpointScores(rows);
      // New code returns attempt 2 (passed) — correct
      expect(newScores.get(LESSON_ID)!.passed).toBe(true);
      expect(newScores.get(LESSON_ID)!.score).toBe(80);
    });
  });
});
