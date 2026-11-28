// Time budget for one owned-CPU PARIS inference turn (#2515).
//
// PR #2708 (merged 2026-11-18) already did the cheap half of this fix: the
// Elevate provider request is capped at 270s (30s inside the 300s Cloud Run
// deadline) and HTTP 408/504 / abort / timeout errors are no longer retried
// by the shared AI resilience wrapper. What it did NOT do — and what still
// timed out turn 8 of repair ba7446c1 at 211,039 ms — is stop the planner
// from *starting* a turn whose prompt + completion cannot possibly finish
// inside the 210s inference budget. A timed-out turn burns the single CPU
// slot for the full 211s and writes nothing.
//
// This module estimates a turn before it is dispatched. If even the minimum
// useful completion allowance cannot fit, the caller must defer the turn
// (checkpoint preserved, 503) instead of starting it. It never truncates a
// turn's content to fit: a smaller cap is used only when it stays at or
// above MIN_USEFUL_COMPLETION_TOKENS; below that the turn is deferred.
//
// Calibration — read before tuning the rates:
// - Prefill ~13-14 tokens/s and decode 1-4 tokens/s were measured on the
//   owned CPU worker (PR #2708 body / handoff 2026-11-18). The planning
//   rates below use prefill 13/s and decode 4/s (the fast end of the
//   measured decode range). Using the slow end (1 token/s) would defer
//   nearly every edit turn and contradicts the repo's own proven-safe
//   1536-token edit band (tests/worker/paris-cpu-edit-timeout-regression).
//   These are planning estimates, not guarantees: live verification must
//   measure real turn durations and tune via the env overrides.
// - Prompt tokens use the same conservative estimator as
//   elevateCompletionBudget (characters / 3 + 12 per message).
// - The 210s deadline is REPAIR_INFERENCE_TIMEOUT_MS, the same budget
//   retryRepairInference enforces per turn.

export const PARIS_CPU_PREFILL_TOKENS_PER_SEC = 13;
export const PARIS_CPU_DECODE_TOKENS_PER_SEC = 4;
// Smallest completion allowance that has actually completed on CPU:
// 384-token discovery turns finished in 25-59s (#2515). Below this, an
// edit-sized JSON action cannot be produced, so defer instead of shrinking.
export const MIN_USEFUL_COMPLETION_TOKENS = 384;
export const PARIS_REPAIR_TURN_EXCEEDS_TIME_BUDGET = 'PARIS_REPAIR_TURN_EXCEEDS_TIME_BUDGET';

function configuredRate(envName, fallback) {
  const configured = Number.parseFloat(process.env[envName] ?? '');
  if (!Number.isFinite(configured) || configured <= 0) return fallback;
  return configured;
}

export function cpuInferenceRates() {
  return {
    prefillTokensPerSec: configuredRate(
      'PARIS_CPU_PREFILL_TOKENS_PER_SEC',
      PARIS_CPU_PREFILL_TOKENS_PER_SEC,
    ),
    decodeTokensPerSec: configuredRate(
      'PARIS_CPU_DECODE_TOKENS_PER_SEC',
      PARIS_CPU_DECODE_TOKENS_PER_SEC,
    ),
  };
}

export function estimatePromptTokens(messages) {
  return (messages ?? []).reduce(
    (total, message) => total + Math.ceil(String(message?.content ?? '').length / 3) + 12,
    0,
  );
}

/** Estimated wall time (ms) for one CPU turn at the planning rates. */
export function estimateCpuTurnMs({ promptTokens, completionTokens, prefillTokensPerSec, decodeTokensPerSec }) {
  const rates = {
    prefillTokensPerSec: prefillTokensPerSec ?? cpuInferenceRates().prefillTokensPerSec,
    decodeTokensPerSec: decodeTokensPerSec ?? cpuInferenceRates().decodeTokensPerSec,
  };
  if (!Number.isFinite(promptTokens) || promptTokens < 0) throw Error('PARIS_TURN_PROMPT_TOKENS_REQUIRED');
  if (!Number.isFinite(completionTokens) || completionTokens <= 0) throw Error('PARIS_TURN_COMPLETION_TOKENS_REQUIRED');
  const prefillMs = (promptTokens / rates.prefillTokensPerSec) * 1000;
  const decodeMs = (completionTokens / rates.decodeTokensPerSec) * 1000;
  return Math.ceil(prefillMs + decodeMs);
}

/**
 * The largest prompt (tokens) a CPU turn may carry and still be admitted
 * under `deadlineMs` while reserving `completionTokens` of decode time at
 * the planning rates. This inverts budgetRepairTurn's admission predicate
 * (estimated time with the minimum useful completion <= deadline) so the
 * message budgeting in repair-inference-budget.mjs can cap admitted
 * prompts at exactly the boundary the time guard will enforce — one
 * source of truth for both budgets. Rates resolve through
 * cpuInferenceRates(), so recalibrating the env overrides after a
 * capacity change moves both budgets together.
 */
export function maxPromptTokensForDeadline({
  deadlineMs = 210_000,
  completionTokens = MIN_USEFUL_COMPLETION_TOKENS,
  prefillTokensPerSec,
  decodeTokensPerSec,
} = {}) {
  const rates = {
    prefillTokensPerSec: prefillTokensPerSec ?? cpuInferenceRates().prefillTokensPerSec,
    decodeTokensPerSec: decodeTokensPerSec ?? cpuInferenceRates().decodeTokensPerSec,
  };
  if (!Number.isSafeInteger(deadlineMs) || deadlineMs <= 0) throw Error('PARIS_TURN_DEADLINE_REQUIRED');
  if (!Number.isFinite(completionTokens) || completionTokens <= 0) throw Error('PARIS_TURN_COMPLETION_TOKENS_REQUIRED');
  const decodeMs = (completionTokens / rates.decodeTokensPerSec) * 1000;
  if (decodeMs >= deadlineMs) return 0;
  return Math.floor(((deadlineMs - decodeMs) / 1000) * rates.prefillTokensPerSec);
}

/**
 * Budget one CPU turn against `deadlineMs` (default REPAIR_INFERENCE_TIMEOUT_MS).
 * Returns { fits, estimatedMs, promptTokens, maxCompletionTokens, reason }.
 * - fits: the turn may start; maxCompletionTokens is the allowance to use
 *   (the requested allowance, clamped down only to what fits, never below
 *   MIN_USEFUL_COMPLETION_TOKENS).
 * - !fits: even the minimum useful allowance exceeds the deadline; the
 *   caller must defer (checkpoint + 503), never start the inference call.
 * Non-CPU tiers always fit: this budget is for the owned CPU worker only.
 */
export function budgetRepairTurn({ messages, maxTokens, deadlineMs = 210_000, tier = 'cpu' }) {
  if (tier === 'gpu') return { fits: true, estimatedMs: 0, promptTokens: 0, maxCompletionTokens: maxTokens, reason: null };
  if (!Number.isSafeInteger(deadlineMs) || deadlineMs <= 0) throw Error('PARIS_TURN_DEADLINE_REQUIRED');
  const promptTokens = estimatePromptTokens(messages);
  const rates = cpuInferenceRates();
  const prefillMs = (promptTokens / rates.prefillTokensPerSec) * 1000;
  const minMs = estimateCpuTurnMs({ promptTokens, completionTokens: MIN_USEFUL_COMPLETION_TOKENS, ...rates });
  if (minMs > deadlineMs) {
    return {
      fits: false,
      estimatedMs: minMs,
      promptTokens,
      maxCompletionTokens: 0,
      reason: PARIS_REPAIR_TURN_EXCEEDS_TIME_BUDGET,
    };
  }
  const remainingMs = deadlineMs - prefillMs;
  const fitsTokens = Math.floor((remainingMs / 1000) * rates.decodeTokensPerSec);
  const maxCompletionTokens = Math.max(
    MIN_USEFUL_COMPLETION_TOKENS,
    Math.min(maxTokens, fitsTokens),
  );
  return {
    fits: true,
    estimatedMs: estimateCpuTurnMs({ promptTokens, completionTokens: maxCompletionTokens, ...rates }),
    promptTokens,
    maxCompletionTokens,
    reason: null,
  };
}
