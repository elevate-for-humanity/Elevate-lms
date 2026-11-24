/**
 * tests/unit/own-engine-agent-loop.test.ts
 *
 * The own-engine agent loop, driven with mocked model / hands / ledger deps
 * — no live model, no GitHub, no Supabase. Proves the loop's fail-closed
 * behavior: owned model only, PARIS approval first, bounded retries, never
 * merges (hands always receives draft: true).
 */
import { describe, expect, it, vi } from 'vitest';
import {
  parseModelFileChanges,
  runOwnEngineLoop,
  type OwnEngineDeps,
  type OwnEngineTaskInput,
} from '@/lib/devstudio/own-engine/agent-loop';

const BASE_INPUT: OwnEngineTaskInput = {
  goal: 'Fix the login bounce for cosmetology learners.',
  repairId: '11111111-1111-4111-8111-111111111111',
  actorId: '22222222-2222-4222-8222-222222222222',
  branch: 'studio/own-engine/fix-login-bounce',
  title: 'fix(lms): login bounce for cosmetology learners',
  maxAttempts: 3,
};

const GOOD_REPLY = JSON.stringify({
  summary: 'Set the access fields on enrollment.',
  files: [
    {
      path: 'lib/learner/approved-paid-admission.mjs',
      content: 'export const fixed = true;\n',
    },
    {
      path: 'tests/unit/login-bounce-regression.test.ts',
      content: "import { describe, it } from 'vitest';\n",
    },
  ],
});

function makeDeps(overrides: Partial<OwnEngineDeps> = {}): {
  deps: OwnEngineDeps;
  runTask: ReturnType<typeof vi.fn>;
  executeHands: ReturnType<typeof vi.fn>;
  ledger: { verifyApproval: ReturnType<typeof vi.fn>; recordAttempt: ReturnType<typeof vi.fn> };
} {
  const runTask = vi.fn().mockResolvedValue({ content: GOOD_REPLY, provider: 'elevate', task: 'code_repair' });
  const executeHands = vi.fn().mockResolvedValue({
    repository: 'elevate-for-humanity/Elevate-lms',
    branch: BASE_INPUT.branch,
    baseSha: 'a'.repeat(40),
    headSha: 'b'.repeat(40),
    prNumber: 9999,
    prUrl: 'https://github.com/elevate-for-humanity/Elevate-lms/pull/9999',
    checks: { state: 'pending', conclusions: [] },
  });
  const ledger = {
    verifyApproval: vi.fn().mockResolvedValue(undefined),
    recordAttempt: vi.fn().mockResolvedValue(undefined),
  };
  return {
    deps: {
      runTask,
      executeHands,
      ledger,
      modelConnection: () => ({ configured: true, tier: 'cpu' }),
      ...overrides,
    },
    runTask,
    executeHands,
    ledger,
  };
}

describe('parseModelFileChanges', () => {
  it('parses fenced and raw JSON replies', () => {
    expect(parseModelFileChanges(`\`\`\`json\n${GOOD_REPLY}\n\`\`\``).files).toHaveLength(2);
    expect(parseModelFileChanges(GOOD_REPLY).summary).toMatch('access fields');
  });

  it('rejects non-JSON output', () => {
    expect(() => parseModelFileChanges('just some prose, no changes')).toThrow(
      'OWN_ENGINE_INVALID_MODEL_OUTPUT',
    );
  });

  it('rejects secret paths as a hard stop', () => {
    const reply = JSON.stringify({ files: [{ path: '.env.local', content: 'x=1\n' }] });
    expect(() => parseModelFileChanges(reply)).toThrow('OWN_ENGINE_BLOCKED_PATH');
  });

  it('rejects paths outside the repair boundary', () => {
    const reply = JSON.stringify({ files: [{ path: 'docs/notes.md', content: 'hi\n' }] });
    expect(() => parseModelFileChanges(reply)).toThrow('OWN_ENGINE_PATH_OUTSIDE_REPAIR_BOUNDARY');
  });

  it('rejects more than six files and invalid JSON files', () => {
    const many = JSON.stringify({
      files: Array.from({ length: 7 }, (_, i) => ({ path: `lib/f${i}.ts`, content: 'x\n' })),
    });
    expect(() => parseModelFileChanges(many)).toThrow('OWN_ENGINE_TOO_MANY_FILES');
    const badJson = JSON.stringify({ files: [{ path: 'lib/config.json', content: '{nope' }] });
    expect(() => parseModelFileChanges(badJson)).toThrow('OWN_ENGINE_INVALID_JSON_FILE');
  });
});

describe('runOwnEngineLoop', () => {
  it('drives the owned model, verifies, and hands a draft PR to the muse-loop', async () => {
    const { deps, runTask, executeHands, ledger } = makeDeps();
    const result = await runOwnEngineLoop(BASE_INPUT, deps);

    expect(result.engine).toBe('own-engine');
    expect(result.provider).toBe('elevate');
    expect(result.model).toBe('elevate-local');
    expect(result.prNumber).toBe(9999);
    expect(runTask).toHaveBeenCalledTimes(1);
    expect(runTask).toHaveBeenCalledWith(
      expect.objectContaining({ task: 'code_repair', prompt: expect.stringContaining('login bounce') }),
    );
    expect(ledger.verifyApproval).toHaveBeenCalledWith({
      repairId: BASE_INPUT.repairId,
      actorId: BASE_INPUT.actorId,
    });
    // Hands half: draft PR only, never a merge.
    expect(executeHands).toHaveBeenCalledTimes(1);
    expect(executeHands).toHaveBeenCalledWith(
      expect.objectContaining({ branch: BASE_INPUT.branch, draft: true, files: expect.any(Array) }),
    );
    expect(ledger.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'succeeded', prNumber: 9999 }),
    );
  });

  it('retries invalid model output and succeeds on the next attempt', async () => {
    const { deps, runTask } = makeDeps();
    runTask
      .mockResolvedValueOnce({ content: 'no json here', provider: 'elevate', task: 'code_repair' })
      .mockResolvedValueOnce({ content: GOOD_REPLY, provider: 'elevate', task: 'code_repair' });
    const result = await runOwnEngineLoop(BASE_INPUT, deps);
    expect(runTask).toHaveBeenCalledTimes(2);
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts[0].error).toMatch('OWN_ENGINE_INVALID_MODEL_OUTPUT');
    expect(result.prNumber).toBe(9999);
  });

  it('fails closed after bounded retries and never calls the hands', async () => {
    const { deps, runTask, executeHands } = makeDeps();
    runTask.mockResolvedValue({ content: 'still no json', provider: 'elevate', task: 'code_repair' });
    await expect(runOwnEngineLoop({ ...BASE_INPUT, maxAttempts: 2 }, deps)).rejects.toThrow(
      'OWN_ENGINE_ATTEMPTS_EXHAUSTED',
    );
    expect(runTask).toHaveBeenCalledTimes(2);
    expect(executeHands).not.toHaveBeenCalled();
  });

  it('fails closed immediately on a blocked path, without retry', async () => {
    const { deps, runTask, executeHands } = makeDeps();
    const evil = JSON.stringify({ files: [{ path: '.env', content: 'SECRET=x\n' }] });
    runTask.mockResolvedValue({ content: evil, provider: 'elevate', task: 'code_repair' });
    await expect(runOwnEngineLoop(BASE_INPUT, deps)).rejects.toThrow('OWN_ENGINE_BLOCKED_PATH');
    expect(runTask).toHaveBeenCalledTimes(1);
    expect(executeHands).not.toHaveBeenCalled();
  });

  it('fails closed when the owned model is not configured, before any call', async () => {
    const { deps, runTask, executeHands } = makeDeps({
      modelConnection: () => ({ configured: false }),
    });
    await expect(runOwnEngineLoop(BASE_INPUT, deps)).rejects.toThrow('OWN_ENGINE_MODEL_NOT_CONFIGURED');
    expect(runTask).not.toHaveBeenCalled();
    expect(executeHands).not.toHaveBeenCalled();
  });

  it('fails closed when PARIS approval is missing, before any model call', async () => {
    const { deps, runTask, executeHands, ledger } = makeDeps();
    ledger.verifyApproval.mockRejectedValue(new Error('OWN_ENGINE_APPROVAL_REQUIRED'));
    await expect(runOwnEngineLoop(BASE_INPUT, deps)).rejects.toThrow('OWN_ENGINE_APPROVAL_REQUIRED');
    expect(runTask).not.toHaveBeenCalled();
    expect(executeHands).not.toHaveBeenCalled();
  });

  it('fails closed when the model receipt is not the owned provider', async () => {
    const { deps, runTask, executeHands } = makeDeps();
    runTask.mockResolvedValue({ content: GOOD_REPLY, provider: 'openai', task: 'code_repair' });
    await expect(runOwnEngineLoop(BASE_INPUT, deps)).rejects.toThrow('OWN_ENGINE_PROVIDER_NOT_OWNED');
    expect(executeHands).not.toHaveBeenCalled();
  });

  it('refuses main as the branch before spending a model call', async () => {
    const { deps, runTask } = makeDeps();
    await expect(runOwnEngineLoop({ ...BASE_INPUT, branch: 'main' }, deps)).rejects.toThrow(
      'OWN_ENGINE_BRANCH_MUST_NOT_BE_BASE',
    );
    expect(runTask).not.toHaveBeenCalled();
  });
});
