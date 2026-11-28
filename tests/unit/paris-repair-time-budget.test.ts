import { expect, it } from 'vitest';
import {
  budgetRepairTurn,
  estimateCpuTurnMs,
  estimatePromptTokens,
  maxPromptTokensForDeadline,
  MIN_USEFUL_COMPLETION_TOKENS,
  PARIS_REPAIR_TURN_EXCEEDS_TIME_BUDGET,
} from '@/lib/devstudio/repair-inference-time-budget.mjs';
import { elevateRequestTimeoutMs } from '@/lib/ai/providers/elevate';

// PR2 (#2515): PR #2708 (merged 2026-11-18) capped the provider request at
// 270s and stopped retrying 408/504/aborts. What remained was starting
// turns that cannot finish inside the 210s budget — turn 8 of repair
// ba7446c1 aborted at 211,039 ms with zero writes. These tests pin the
// estimator that now defers such turns before dispatch.

it('keeps the provider timeout budget the estimator plans against', () => {
  delete process.env.ELEVATE_LLM_TIMEOUT_MS;
  expect(elevateRequestTimeoutMs()).toBe(210_000);
  process.env.ELEVATE_LLM_TIMEOUT_MS = '900000';
  expect(elevateRequestTimeoutMs()).toBe(270_000);
  process.env.ELEVATE_LLM_TIMEOUT_MS = '1000';
  expect(elevateRequestTimeoutMs()).toBe(30_000);
  delete process.env.ELEVATE_LLM_TIMEOUT_MS;
});

it('estimates a small CPU turn inside the 210s budget, clamping the allowance to what fits', () => {
  const messages = [
    { role: 'system', content: 'Rules. '.repeat(100) },
    { role: 'user', content: JSON.stringify({ task: 'Fix the defect.', observations: ['READ lib/a.ts: exact source'] }) },
  ];
  const promptTokens = estimatePromptTokens(messages);
  expect(promptTokens).toBeGreaterThan(0);
  const result = budgetRepairTurn({ messages, maxTokens: 1536 });
  expect(result.fits).toBe(true);
  expect(result.reason).toBeNull();
  // 1536 tokens at the 4 tok/s planning decode rate alone needs 384s, so
  // the full allowance can never fit a 210s turn; the estimator clamps
  // it to the remaining time (still above the 384-token minimum).
  expect(result.maxCompletionTokens).toBeGreaterThanOrEqual(MIN_USEFUL_COMPLETION_TOKENS);
  expect(result.maxCompletionTokens).toBeLessThan(1536);
  expect(result.estimatedMs).toBeLessThanOrEqual(210_000);
  // Sanity: estimate math — prefill at 13 tok/s, decode at 4 tok/s.
  expect(estimateCpuTurnMs({ promptTokens: 1300, completionTokens: 400 })).toBe(
    Math.ceil((1300 / 13 + 400 / 4) * 1000),
  );
});

it('defers a turn whose prompt alone cannot fit, instead of burning the CPU slot', () => {
  const messages = [
    { role: 'system', content: 'Rules. '.repeat(400) },
    { role: 'user', content: JSON.stringify({ task: 'Fix the defect.', observations: ['READ lib/a.ts: ' + 'exact source '.repeat(2000)] }) },
  ];
  const result = budgetRepairTurn({ messages, maxTokens: 1536 });
  expect(result.fits).toBe(false);
  expect(result.reason).toBe(PARIS_REPAIR_TURN_EXCEEDS_TIME_BUDGET);
  expect(result.maxCompletionTokens).toBe(0);
  expect(result.estimatedMs).toBeGreaterThan(210_000);
});

it('clamps the allowance to what fits, never below the minimum useful size', () => {
  // Prompt ~1300 tokens: prefill ~100s, leaving ~110s -> ~440 tokens at
  // 4 tok/s, which is above the 384-token minimum, so the turn fits with
  // a reduced allowance instead of the full 1536.
  const prompt = 'x'.repeat(1300 * 3);
  const messages = [{ role: 'system', content: prompt }, { role: 'user', content: '{}' }];
  const result = budgetRepairTurn({ messages, maxTokens: 1536 });
  expect(result.fits).toBe(true);
  expect(result.maxCompletionTokens).toBeGreaterThanOrEqual(MIN_USEFUL_COMPLETION_TOKENS);
  expect(result.maxCompletionTokens).toBeLessThan(1536);
  expect(result.estimatedMs).toBeLessThanOrEqual(210_000);
});

it('does not budget non-CPU tiers', () => {
  const messages = [{ role: 'user', content: 'x'.repeat(100_000) }];
  const result = budgetRepairTurn({ messages, maxTokens: 2400, tier: 'gpu' });
  expect(result.fits).toBe(true);
  expect(result.maxCompletionTokens).toBe(2400);
});

it('rejects invalid budgets instead of guessing', () => {
  expect(() => budgetRepairTurn({ messages: [], maxTokens: 1536, deadlineMs: 0 })).toThrow('PARIS_TURN_DEADLINE_REQUIRED');
  expect(() => estimateCpuTurnMs({ promptTokens: -1, completionTokens: 100 })).toThrow('PARIS_TURN_PROMPT_TOKENS_REQUIRED');
  expect(() => estimateCpuTurnMs({ promptTokens: 100, completionTokens: 0 })).toThrow('PARIS_TURN_COMPLETION_TOKENS_REQUIRED');
});

it('derives the admitted prompt ceiling from the same budget the guard enforces', () => {
  // Planning rates: prefill 13 tok/s, decode 4 tok/s, 210s deadline,
  // reserving the 384-token minimum useful completion (96s of decode)
  // leaves 114s of prefill -> 1482 prompt tokens.
  delete process.env.PARIS_CPU_PREFILL_TOKENS_PER_SEC;
  delete process.env.PARIS_CPU_DECODE_TOKENS_PER_SEC;
  expect(maxPromptTokensForDeadline({})).toBe(1482);
  // The ceiling is exactly the guard's admission boundary.
  const atCeiling = [{ role: 'system', content: 'x'.repeat((1482 - 12) * 3) }];
  expect(estimatePromptTokens(atCeiling)).toBe(1482);
  expect(budgetRepairTurn({ messages: atCeiling, maxTokens: 1536 }).fits).toBe(true);
  const overCeiling = [{ role: 'system', content: 'x'.repeat((1483 - 12) * 3) }];
  expect(budgetRepairTurn({ messages: overCeiling, maxTokens: 1536 }).fits).toBe(false);
  // Recalibration moves the ceiling: measured rates are the env overrides.
  process.env.PARIS_CPU_PREFILL_TOKENS_PER_SEC = '40';
  process.env.PARIS_CPU_DECODE_TOKENS_PER_SEC = '12';
  expect(maxPromptTokensForDeadline({})).toBe(7120);
  delete process.env.PARIS_CPU_PREFILL_TOKENS_PER_SEC;
  delete process.env.PARIS_CPU_DECODE_TOKENS_PER_SEC;
  expect(() => maxPromptTokensForDeadline({ deadlineMs: 0 })).toThrow('PARIS_TURN_DEADLINE_REQUIRED');
  expect(() => maxPromptTokensForDeadline({ completionTokens: 0 })).toThrow('PARIS_TURN_COMPLETION_TOKENS_REQUIRED');
});
