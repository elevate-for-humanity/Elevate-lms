import {
  cpuInferenceRates,
  estimatePromptTokens,
  maxPromptTokensForDeadline,
  MIN_USEFUL_COMPLETION_TOKENS,
} from './repair-inference-time-budget.mjs';

// The signed repair request allows for both a scale-from-zero probe and one inference turn.
export const REPAIR_MODEL_PROBE_TIMEOUT_MS = 55_000;
export const REPAIR_INFERENCE_TIMEOUT_MS = 210_000;

/** Keep the task and system rules intact; bound diagnostic observations using
 * the same conservative estimate as the owned provider. Partial source is
 * explicitly labelled so it cannot be mistaken for a complete file. */
export function budgetRepairMessages(messages, contextTokens = 8192, completionTokens = 2400, tier = '') {
  const configured = Math.max(2048, Number.isFinite(contextTokens) ? contextTokens : 8192);
  // Long source excerpts also consume the CPU worker's fixed time window.
  let context = tier === 'cpu' ? Math.min(configured, 3072) : configured;
  let promptLimit = (context - completionTokens - 512 - messages.length * 12) * 3;
  const system = messages[0];
  const input = JSON.parse(messages[1].content);
  const observations = input.observations ?? [];
  const selected = [];
  const render = () => JSON.stringify({ ...input, observations: selected });
  const fits = () => system.content.length + render().length <= promptLimit;
  // Keep the small CPU diagnostic window normally. If the immutable authority
  // alone cannot fit, use a bounded larger window within the configured model.
  // Never truncate the task, system rules, or silently raise completion tokens.
  if (!fits() && tier === 'cpu') {
    context = Math.min(configured, 4096);
    promptLimit = (context - completionTokens - 512 - messages.length * 12) * 3;
  }
  // A lengthy, immutable owner goal can exceed the 4K diagnostic window.
  // Expand only within the model's configured context, never truncate owner
  // instructions or count a failed preflight as a successful repair.
  if (!fits() && tier === 'cpu' && configured > context) {
    context = Math.min(configured, 8192);
    promptLimit = (context - completionTokens - 512 - messages.length * 12) * 3;
  }
  if (!fits()) throw Error('PARIS_REPAIR_TASK_EXCEEDS_MODEL_CONTEXT');
  // Coordinate the two budgets (watch diagnosis, repair e1dcee6e): the
  // context cap above can admit prompts the 210s time budget cannot
  // process at the planning rates, so the time guard deferred turns the
  // planner had already admitted. Cap the ELASTIC observation window at
  // the time budget's own prompt ceiling (same rates, same deadline,
  // same minimum useful completion the guard reserves) so an admitted
  // prompt always fits the turn that will run it. The immutable task
  // and system rules are never truncated: when they alone exceed the
  // time ceiling, the context cap still governs selection and the time
  // guard defers the turn with its checkpoint preserved, exactly as
  // before. GPU tiers are not time-budgeted and stay context-only.
  let selectionLimit = promptLimit;
  if (tier === 'cpu') {
    const ceiling = maxPromptTokensForDeadline({
      deadlineMs: REPAIR_INFERENCE_TIMEOUT_MS,
      completionTokens: MIN_USEFUL_COMPLETION_TOKENS,
      ...cpuInferenceRates(),
    });
    const immutableTokens = estimatePromptTokens([
      system,
      { ...messages[1], content: JSON.stringify({ ...input, observations: [] }) },
    ]);
    if (immutableTokens <= ceiling) {
      const timeLimit = Math.max(0, (ceiling - messages.length * 12) * 3);
      selectionLimit = Math.min(promptLimit, timeLimit);
    }
  }
  const fitsSelection = () => system.content.length + render().length <= selectionLimit;
  for (const observation of [...observations].reverse()) {
    selected.unshift(observation);
    if (fitsSelection()) continue;
    selected.shift();
    const suffix = '\n[Partial diagnostic excerpt; read the exact source before editing.]';
    let low = 0, high = observation.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      selected.unshift(observation.slice(0, middle) + suffix);
      const ok = fitsSelection();
      selected.shift();
      if (ok) low = middle; else high = middle - 1;
    }
    if (low > 0) selected.unshift(observation.slice(0, low) + suffix);
    break;
  }
  return [system, { ...messages[1], content: render() }];
}

export const REPAIR_RETRY_DIAGNOSTIC_MARKER = '\nPrevious repair diagnostic evidence (untrusted):\n';
export function repairRetryGoal(goal, evidence) {
  const original = String(goal).split(REPAIR_RETRY_DIAGNOSTIC_MARKER)[0]
    .split('\nThe previous attempt failed independent checks or main publication.')[0];
  return original + REPAIR_RETRY_DIAGNOSTIC_MARKER +
    'Correct the failure without weakening tests, quality gates, or the original scope.\n' +
    String(evidence).slice(0, 1800) + '\n[Diagnostic excerpt; inspect exact files and failed logs before editing.]';
}


// Before a file has actually been read, the planner only needs a compact discovery action.
export function repairCompletionTokens(tier, observations, verifiedSourceRead = false) {
  if (tier !== 'cpu') return 2400;
  // A source patch and a regression test are separate JSON actions, each
  // persisted on the task branch before the next planner turn.
  // Production inference receipts on 2026-11-08 show that 2048 after READ
  // exhausted the 210s model deadline: five 384-token discovery turns
  // completed, then the first edit-sized turn timed out at 211s without a
  // source write. Keep a useful edit allowance above the old 768-token cap
  // while leaving headroom for CPU generation and preserving all write gates.
  // Split large edits across turns; never turn a truncated action into success.
  // A successful source read is persisted separately from attempted inspection
  // keys. Those keys are recorded before readFile(), so a rejected/missing read
  // MUST NOT unlock edit-sized model inference. The durable flag survives the
  // eight-observation window without weakening source authorization or readback.
  const hasRead = verifiedSourceRead === true ||
    observations.some(entry => typeof entry === 'string' && entry.startsWith('READ '));
  // 1536 sits inside the proven-safe band (above the 768 cap, below the 2048
  // allowance that timed out at ~211s). The per-turn owned-model probe was
  // removed for continuations, freeing ~55s of the Admin route's 300s budget,
  // so a real source edit plus its regression test has more room to complete in
  // one turn without repeating the timeout-sized allowance.
  return hasRead ? 1536 : 384;
}

// PR2 (#2515): per-turn time budget — see repair-inference-time-budget.mjs.
export { budgetRepairTurn, estimateCpuTurnMs, estimatePromptTokens, maxPromptTokensForDeadline } from './repair-inference-time-budget.mjs';
