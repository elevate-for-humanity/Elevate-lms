/**
 * lib/devstudio/own-engine/agent-loop.ts
 *
 * The owned engine's agent loop: prompt -> tool calls (model) -> verify ->
 * retry -> hands (muse-loop: branch -> commit -> draft PR -> CI check).
 *
 * Brain:  Qwen2.5-7B-Instruct (Q4_K_M) behind the owned worker, served as
 *         `elevate-local` through ElevateProvider.
 * Router: lib/ai/orchestrator.ts runAITask({ task: 'code_repair' }), which is
 *         pinned to providerPolicy 'owned-only' for this task — any other
 *         provider, or a missing model URL/secret, fails closed.
 * Gate:   PARIS approval — a paris_code_repairs row in a workable status,
 *         owned by the requesting admin, with the paris_autopilot_policy
 *         enabled. Every attempt is recorded on that ledger row.
 * Hands:  lib/devstudio/muse-loop.ts runMuseLoop — draft PR only, never merges.
 * Verify: in-loop verification is structural (paths, size, shape, JSON
 *         validity). Semantic verification is CI on the draft PR, which the
 *         hands half reports back. Do not claim a fix is verified before CI.
 *
 * The loop never imports the orchestrator, the muse-loop, or Supabase at
 * module scope: those are injected as dependencies so this module stays
 * unit-testable without the server graph. The admin route wires the real
 * implementations. `server-only` is deliberately NOT imported here for the
 * same reason; callers must only invoke this from server code.
 *
 * Limits, stated honestly: the 7B CPU model is small for code work (8 GiB,
 * 4 CPU threads, 1 slot, 8192-token context, 210s per call) and has timed
 * out repairs at 210s before. Keep goals narrow and repo context small.
 * Retries are bounded (default 3, route default 2); a timed-out attempt is
 * retried, then the repair is recorded blocked on the ledger.
 */

import { resolveOwnedModelConnection } from '@/lib/ai/providers/owned-model-config.mjs';
import type { AITaskResult, runAITask } from '@/lib/ai/orchestrator';
import type {
  MuseLoopFileChange,
  MuseLoopInput,
  MuseLoopResult,
} from '@/lib/devstudio/muse-loop';

export const OWN_ENGINE_MAX_ATTEMPTS = 3;
export const OWN_ENGINE_MAX_CHANGED_FILES = 6;
export const OWN_ENGINE_MAX_FILE_CHARS = 200_000;

/**
 * Repair boundary, mirroring the PARIS repair prompt: the model may only
 * change source under these roots. Keep in sync with
 * lib/devstudio/paris-openhands-repair.mjs (openHandsRepairPrompt) and
 * lib/devstudio/muse-loop.ts (blocked paths).
 */
const ALLOWED_PATH_PREFIXES = [
  'lib/',
  'components/',
  'apps/',
  'remotion-src/',
  'workers/',
  'tests/',
  'scripts/gcp/',
  '.github/workflows/',
];
const ALLOWED_ROOT_FILES = ['Dockerfile.admin', 'Dockerfile.lms', 'Dockerfile.marketing'];

const BLOCKED_PATH_SEGMENTS = [
  '.env',
  'credentials',
  'secrets',
  '.pem',
  '.key',
  'id_rsa',
];

export function isOwnEngineBlockedPath(path: string): boolean {
  const lower = path.toLowerCase();
  if (lower.startsWith('/') || lower.includes('..')) return true;
  return BLOCKED_PATH_SEGMENTS.some((segment) => lower.includes(segment));
}

export function isOwnEngineAllowedPath(path: string): boolean {
  if (isOwnEngineBlockedPath(path)) return false;
  if (ALLOWED_ROOT_FILES.includes(path)) return true;
  return ALLOWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export type OwnEngineTaskInput = {
  /** What to fix, in plain language. */
  goal: string;
  /** PARIS ledger row this repair is recorded against. Required. */
  repairId: string;
  /** Admin user id authorizing the repair (must own the ledger row). */
  actorId: string;
  /** Branch to create, e.g. `studio/own-engine/fix-login-bounce`. Never `main`. */
  branch: string;
  /** PR title. */
  title: string;
  /** PR body. Defaults to the goal. */
  body?: string;
  /** Commit message. Defaults to the title. */
  message?: string;
  /** Base branch. Defaults to `main`. */
  base?: string;
  /** Small excerpts of relevant source, to fit the 7B / 8k-token window. */
  repoContext?: string;
  /** Bounded retries. Default 3, clamped to 1..3. */
  maxAttempts?: number;
};

export type OwnEngineAttempt = {
  attempt: number;
  provider?: string;
  files?: MuseLoopFileChange[];
  summary?: string;
  error?: string;
};

export type OwnEngineResult = {
  engine: 'own-engine';
  provider: 'elevate';
  model: 'elevate-local';
  repairId: string;
  branch: string;
  prNumber: number;
  prUrl: string;
  checks: MuseLoopResult['checks'];
  files: MuseLoopFileChange[];
  summary?: string;
  attempts: OwnEngineAttempt[];
};

export type OwnEngineLedger = {
  /** Fail closed with OWN_ENGINE_APPROVAL_REQUIRED unless the repair row
   * exists, belongs to actorId, is in a workable status, and the PARIS
   * autopilot policy is enabled. */
  verifyApproval(input: { repairId: string; actorId: string }): Promise<void>;
  /** Record one attempt on the ledger row. */
  recordAttempt(input: {
    repairId: string;
    attempt: number;
    outcome: 'started' | 'succeeded' | 'failed';
    files?: MuseLoopFileChange[];
    summary?: string;
    provider?: string;
    prNumber?: number;
    prUrl?: string;
    checks?: MuseLoopResult['checks'];
    errorCode?: string;
    /** True when no retries remain — only a terminal failure blocks the row. */
    terminal?: boolean;
  }): Promise<void>;
};

export type OwnEngineDeps = {
  /** Defaults to runAITask. Injected so tests can drive the loop without a model. */
  runTask: typeof runAITask;
  /** Defaults to runMuseLoop. Injected so tests can drive the loop without GitHub. */
  executeHands: (input: MuseLoopInput) => Promise<MuseLoopResult>;
  /** PARIS ledger. Required — a repair without a ledger row is refused. */
  ledger: OwnEngineLedger;
  /** Defaults to resolveOwnedModelConnection. */
  modelConnection?: () => { configured: boolean; tier?: string };
};

export function planOwnEngineLoop(input: OwnEngineTaskInput): { order: number; step: string; detail: string }[] {
  validateOwnEngineInput(input);
  return [
    { order: 1, step: 'check-model', detail: 'Fail closed unless the owned model (ELEVATE_LLM_CPU_URL / ELEVATE_LLM_SECRET) is configured.' },
    { order: 2, step: 'check-approval', detail: `Verify PARIS approval for repair ${input.repairId} and record the attempt on the ledger.` },
    { order: 3, step: 'prompt-model', detail: 'Ask the owned model (elevate-local, owned-only) for file changes as JSON.' },
    { order: 4, step: 'verify-changes', detail: `Validate paths (repair boundary, max ${OWN_ENGINE_MAX_CHANGED_FILES} files), shape, and JSON validity. Retry on failure, at most ${OWN_ENGINE_MAX_ATTEMPTS} attempts.` },
    { order: 5, step: 'hands', detail: `Hand the changes to the muse-loop: branch ${input.branch} -> commit -> draft PR -> CI check. Never merges.` },
  ];
}

function validateOwnEngineInput(input: OwnEngineTaskInput): void {
  if (!input.goal?.trim()) throw new Error('OWN_ENGINE_GOAL_REQUIRED');
  if (!input.repairId?.trim()) throw new Error('OWN_ENGINE_REPAIR_ID_REQUIRED');
  if (!input.actorId?.trim()) throw new Error('OWN_ENGINE_ACTOR_REQUIRED');
  if (!input.branch || !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,120}$/.test(input.branch)) {
    throw new Error('OWN_ENGINE_INVALID_BRANCH');
  }
  if (input.branch === 'main' || input.branch === (input.base ?? 'main')) {
    throw new Error('OWN_ENGINE_BRANCH_MUST_NOT_BE_BASE');
  }
  if (!input.title?.trim()) throw new Error('OWN_ENGINE_TITLE_REQUIRED');
}

function buildPrompt(input: OwnEngineTaskInput, failures: string[]): string {
  const parts = [
    `Repair goal: ${input.goal.trim()}`,
    input.repoContext?.trim()
      ? `Relevant source (excerpts; do not assume anything beyond this):\n${input.repoContext.trim().slice(0, 6000)}`
      : '',
    `Constraints: change at most ${OWN_ENGINE_MAX_CHANGED_FILES} files under lib/, components/, apps/, workers/, tests/, scripts/gcp/, .github/workflows/, or the root Dockerfiles. Include a regression test under tests/ when the fix changes behavior. Never touch .env, credentials, secrets, keys, or main. Never invent an API, key, URL, or credential.`,
    failures.length > 0
      ? `Previous attempt(s) failed — fix exactly this and nothing else:\n${failures.map((f, i) => `${i + 1}. ${f}`).join('\n')}`
      : '',
  ];
  return parts.filter(Boolean).join('\n\n');
}

function extractJsonObject(content: string): unknown {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall back to the first balanced JSON object in the reply.
    const start = trimmed.indexOf('{');
    if (start < 0) throw new Error('OWN_ENGINE_INVALID_MODEL_OUTPUT');
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < trimmed.length; index += 1) {
      const char = trimmed[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === '{') depth += 1;
      else if (char === '}') {
        depth -= 1;
        if (depth === 0) return JSON.parse(trimmed.slice(start, index + 1));
      }
    }
    throw new Error('OWN_ENGINE_INVALID_MODEL_OUTPUT');
  }
}

/**
 * Parse + structurally verify one model reply. Throws on anything invalid.
 * A blocked path is a hard stop (never retried); other failures are
 * retryable and their message is fed back to the model.
 */
export function parseModelFileChanges(content: string): { files: MuseLoopFileChange[]; summary?: string } {
  const parsed = extractJsonObject(content) as Record<string, unknown>;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('OWN_ENGINE_INVALID_MODEL_OUTPUT');
  }
  const files = parsed.files as unknown;
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('OWN_ENGINE_INVALID_MODEL_OUTPUT');
  }
  if (files.length > OWN_ENGINE_MAX_CHANGED_FILES) {
    throw new Error(`OWN_ENGINE_TOO_MANY_FILES:${files.length}`);
  }
  const seen = new Set<string>();
  const changes: MuseLoopFileChange[] = [];
  for (const file of files) {
    const record = file as Record<string, unknown>;
    const path = typeof record?.path === 'string' ? record.path : '';
    const fileContent = typeof record?.content === 'string' ? record.content : '';
    if (!path || isOwnEngineBlockedPath(path)) {
      throw new Error(`OWN_ENGINE_BLOCKED_PATH:${path || '(missing)'}`);
    }
    if (!isOwnEngineAllowedPath(path)) {
      throw new Error(`OWN_ENGINE_PATH_OUTSIDE_REPAIR_BOUNDARY:${path}`);
    }
    if (seen.has(path)) throw new Error(`OWN_ENGINE_DUPLICATE_PATH:${path}`);
    seen.add(path);
    if (!fileContent.trim()) throw new Error(`OWN_ENGINE_EMPTY_FILE:${path}`);
    if (fileContent.length > OWN_ENGINE_MAX_FILE_CHARS) {
      throw new Error(`OWN_ENGINE_FILE_TOO_LARGE:${path}`);
    }
    if (path.endsWith('.json')) {
      try {
        JSON.parse(fileContent);
      } catch {
        throw new Error(`OWN_ENGINE_INVALID_JSON_FILE:${path}`);
      }
    }
    changes.push({ path, content: fileContent });
  }
  const summary = typeof parsed.summary === 'string' ? parsed.summary : undefined;
  return { files: changes, summary };
}

function isRetryableModelError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  // A model reaching for secrets is a hard stop, never a retry.
  if (message.startsWith('OWN_ENGINE_BLOCKED_PATH')) return false;
  return true;
}

export async function runOwnEngineLoop(
  input: OwnEngineTaskInput,
  deps: OwnEngineDeps,
): Promise<OwnEngineResult> {
  validateOwnEngineInput(input);
  const maxAttempts = Math.min(OWN_ENGINE_MAX_ATTEMPTS, Math.max(1, input.maxAttempts ?? OWN_ENGINE_MAX_ATTEMPTS));

  // 1. Fail closed on a missing owned model — before any approval or prompt.
  const connection = (deps.modelConnection ?? resolveOwnedModelConnection)();
  if (!connection.configured) {
    throw new Error('OWN_ENGINE_MODEL_NOT_CONFIGURED');
  }

  // 2. PARIS approval gate + ledger recording.
  await deps.ledger.verifyApproval({ repairId: input.repairId, actorId: input.actorId });

  const attempts: OwnEngineAttempt[] = [];
  const failures: string[] = [];
  let parsed: { files: MuseLoopFileChange[]; summary?: string } | undefined;
  let provider = 'elevate';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await deps.ledger.recordAttempt({ repairId: input.repairId, attempt, outcome: 'started' });
    try {
      const result: AITaskResult = await deps.runTask({
        task: 'code_repair',
        prompt: buildPrompt(input, failures),
        context: { userId: input.actorId },
        maxTokens: 4000,
        temperature: 0.2,
      });
      if (result.blocked) {
        throw new Error(`OWN_ENGINE_MODEL_BLOCKED:${result.blockReason ?? 'moderation'}`);
      }
      if (result.provider !== 'elevate') {
        // The orchestrator pins code_repair to owned-only; a different
        // provider receipt means the wiring is wrong — fail closed.
        throw new Error(`OWN_ENGINE_PROVIDER_NOT_OWNED:${result.provider}`);
      }
      provider = result.provider;
      parsed = parseModelFileChanges(result.content);
      attempts.push({ attempt, provider, files: parsed.files, summary: parsed.summary });
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      attempts.push({ attempt, provider, error: message.slice(0, 500) });
      const terminal = !isRetryableModelError(error) || attempt === maxAttempts;
      await deps.ledger.recordAttempt({
        repairId: input.repairId,
        attempt,
        outcome: 'failed',
        provider,
        errorCode: message.slice(0, 500),
        terminal,
      });
      if (!terminal) {
        failures.push(message.slice(0, 500));
        continue;
      }
      if (isRetryableModelError(error)) {
        throw new Error(`OWN_ENGINE_ATTEMPTS_EXHAUSTED:${message.slice(0, 300)}`, { cause: error });
      }
      throw error instanceof Error ? error : new Error(message);
    }
  }

  if (!parsed) throw new Error('OWN_ENGINE_ATTEMPTS_EXHAUSTED:no usable model output');

  // 3. Hands: branch -> commit -> draft PR -> CI check. Never merges.
  const hands = await deps.executeHands({
    branch: input.branch,
    title: input.title,
    body: input.body ?? input.goal,
    message: input.message ?? input.title,
    files: parsed.files,
    base: input.base ?? 'main',
    draft: true,
  });

  await deps.ledger.recordAttempt({
    repairId: input.repairId,
    attempt: attempts.length,
    outcome: 'succeeded',
    files: parsed.files,
    summary: parsed.summary,
    provider,
    prNumber: hands.prNumber,
    prUrl: hands.prUrl,
    checks: hands.checks,
  });

  return {
    engine: 'own-engine',
    provider: 'elevate',
    model: 'elevate-local',
    repairId: input.repairId,
    branch: input.branch,
    prNumber: hands.prNumber,
    prUrl: hands.prUrl,
    checks: hands.checks,
    files: parsed.files,
    summary: parsed.summary,
    attempts,
  };
}
