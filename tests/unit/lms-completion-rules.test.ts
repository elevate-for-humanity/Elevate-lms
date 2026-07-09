/**
 * Unit tests for the completion rule evaluator in lib/lms/completion-evaluator.ts
 *
 * evaluateCourseRule is a pure switch function with no DB calls, but the file
 * has `import 'server-only'' at the top (because evaluateCourseCompletion and
 * checkProgramCompletion call requireAdminClient). The pure helper is not
 * exported, so we inline-extract it here, mirroring the source exactly.
 *
 * Source: lib/lms/completion-evaluator.ts — evaluateCourseRule()
 * Keep this in sync if the source changes.
 */

import { describe, it, expect } from 'vitest';

// ─── Inline-extracted types (mirrors source) ──────────────────────────────────

interface CompletionRule {
  rule_type: string;
  config: Record<string, unknown>;
}

interface CourseCompletionContext {
  totalLessons: number;
  completedLessons: number;
  requiredLessons: number;
  completedRequiredLessons: number;
  minScore?: number;
  achievedScore?: number;
}

// ─── Inline-extracted function (mirrors source exactly) ───────────────────────

function evaluateCourseRule(rule: CompletionRule, ctx: CourseCompletionContext): boolean {
  switch (rule.rule_type) {
    case 'all_lessons':
      return ctx.totalLessons > 0 && ctx.completedLessons >= ctx.totalLessons;

    case 'required_lessons':
      return ctx.requiredLessons > 0 && ctx.completedRequiredLessons >= ctx.requiredLessons;

    case 'min_score': {
      const minScore = Number(rule.config.min_score ?? 70);
      return ctx.achievedScore !== undefined && ctx.achievedScore >= minScore;
    }

    default:
      // Unknown rule type — don't block completion
      return true;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<CourseCompletionContext> = {}): CourseCompletionContext {
  return {
    totalLessons: 10,
    completedLessons: 0,
    requiredLessons: 0,
    completedRequiredLessons: 0,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('evaluateCourseRule — all_lessons', () => {
  const rule: CompletionRule = { rule_type: 'all_lessons', config: {} };

  it('returns false when totalLessons is 0', () => {
    expect(evaluateCourseRule(rule, makeCtx({ totalLessons: 0, completedLessons: 0 }))).toBe(false);
  });

  it('returns false when completedLessons < totalLessons', () => {
    expect(evaluateCourseRule(rule, makeCtx({ totalLessons: 10, completedLessons: 9 }))).toBe(false);
  });

  it('returns false when completedLessons is 0', () => {
    expect(evaluateCourseRule(rule, makeCtx({ totalLessons: 10, completedLessons: 0 }))).toBe(false);
  });

  it('returns true when completedLessons equals totalLessons', () => {
    expect(evaluateCourseRule(rule, makeCtx({ totalLessons: 10, completedLessons: 10 }))).toBe(true);
  });

  it('returns true when completedLessons exceeds totalLessons', () => {
    // Over-completion: still considered complete
    expect(evaluateCourseRule(rule, makeCtx({ totalLessons: 10, completedLessons: 11 }))).toBe(true);
  });

  it('returns true for a single-lesson course that is complete', () => {
    expect(evaluateCourseRule(rule, makeCtx({ totalLessons: 1, completedLessons: 1 }))).toBe(true);
  });
});

describe('evaluateCourseRule — required_lessons', () => {
  const rule: CompletionRule = { rule_type: 'required_lessons', config: {} };

  it('returns false when requiredLessons is 0', () => {
    expect(
      evaluateCourseRule(rule, makeCtx({ requiredLessons: 0, completedRequiredLessons: 0 })),
    ).toBe(false);
  });

  it('returns false when completedRequiredLessons < requiredLessons', () => {
    expect(
      evaluateCourseRule(rule, makeCtx({ requiredLessons: 5, completedRequiredLessons: 4 })),
    ).toBe(false);
  });

  it('returns false when completedRequiredLessons is 0', () => {
    expect(
      evaluateCourseRule(rule, makeCtx({ requiredLessons: 5, completedRequiredLessons: 0 })),
    ).toBe(false);
  });

  it('returns true when completedRequiredLessons equals requiredLessons', () => {
    expect(
      evaluateCourseRule(rule, makeCtx({ requiredLessons: 5, completedRequiredLessons: 5 })),
    ).toBe(true);
  });

  it('returns true when completedRequiredLessons exceeds requiredLessons', () => {
    expect(
      evaluateCourseRule(rule, makeCtx({ requiredLessons: 5, completedRequiredLessons: 6 })),
    ).toBe(true);
  });
});

describe('evaluateCourseRule — min_score', () => {
  it('returns false when achievedScore is undefined', () => {
    const rule: CompletionRule = { rule_type: 'min_score', config: { min_score: 70 } };
    expect(evaluateCourseRule(rule, makeCtx({ achievedScore: undefined }))).toBe(false);
  });

  it('returns false when achievedScore is below min_score', () => {
    const rule: CompletionRule = { rule_type: 'min_score', config: { min_score: 70 } };
    expect(evaluateCourseRule(rule, makeCtx({ achievedScore: 69 }))).toBe(false);
  });

  it('returns true when achievedScore equals min_score (boundary)', () => {
    const rule: CompletionRule = { rule_type: 'min_score', config: { min_score: 70 } };
    expect(evaluateCourseRule(rule, makeCtx({ achievedScore: 70 }))).toBe(true);
  });

  it('returns true when achievedScore exceeds min_score', () => {
    const rule: CompletionRule = { rule_type: 'min_score', config: { min_score: 70 } };
    expect(evaluateCourseRule(rule, makeCtx({ achievedScore: 95 }))).toBe(true);
  });

  it('uses 70 as default min_score when config omits it', () => {
    const rule: CompletionRule = { rule_type: 'min_score', config: {} };
    // 69 should fail with default 70
    expect(evaluateCourseRule(rule, makeCtx({ achievedScore: 69 }))).toBe(false);
    // 70 should pass with default 70
    expect(evaluateCourseRule(rule, makeCtx({ achievedScore: 70 }))).toBe(true);
  });

  it('uses 70 as default when config.min_score is null', () => {
    const rule: CompletionRule = { rule_type: 'min_score', config: { min_score: null } };
    expect(evaluateCourseRule(rule, makeCtx({ achievedScore: 70 }))).toBe(true);
    expect(evaluateCourseRule(rule, makeCtx({ achievedScore: 69 }))).toBe(false);
  });
});

describe('evaluateCourseRule — unknown rule type', () => {
  it('returns true for an unrecognised rule_type (fail-open)', () => {
    const rule: CompletionRule = { rule_type: 'some_future_rule', config: {} };
    expect(evaluateCourseRule(rule, makeCtx())).toBe(true);
  });

  it('returns true for an empty rule_type string', () => {
    const rule: CompletionRule = { rule_type: '', config: {} };
    expect(evaluateCourseRule(rule, makeCtx())).toBe(true);
  });

  it('returns true for a rule_type that is close but not exact', () => {
    const rule: CompletionRule = { rule_type: 'ALL_LESSONS', config: {} };
    // Case-sensitive — 'ALL_LESSONS' !== 'all_lessons' → falls through to default
    expect(evaluateCourseRule(rule, makeCtx({ totalLessons: 10, completedLessons: 0 }))).toBe(true);
  });
});
