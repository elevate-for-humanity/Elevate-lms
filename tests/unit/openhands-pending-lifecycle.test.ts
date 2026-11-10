import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  client: vi.fn(), lifecycle: vi.fn(), start: vi.fn(), github: vi.fn(), evaluate: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/admin', () => ({requireAdminClient: mocks.client}));
vi.mock('@/lib/devstudio/studio-run-reconciler', () => ({reconcileStudioRunFromTask: vi.fn()}));
vi.mock('@/lib/devstudio/openhands/client', () => ({getOpenHandsLifecycle: mocks.lifecycle, startOpenHandsTask: mocks.start}));
vi.mock('@/lib/devstudio/openhands/github-verifier', () => ({verifyOpenHandsGitHubOutcome: mocks.github}));
vi.mock('@/lib/platform/orchestration/evaluator', () => ({evaluateExecution: mocks.evaluate}));

import {refreshOpenHandsTask} from '@/lib/devstudio/openhands/runtime';

describe('actual OpenHands refresh while the accepted provider task is pending', () => {
  let updates: Array<{table: string; values: any}>;
  beforeEach(() => {
    vi.clearAllMocks();
    updates = [];
    const task = {
      id: 'owned-task', user_id: 'owner', status: 'running', attempts: 1, max_attempts: 1,
      requires_approval: false, approval_status: 'not_required', approval_reason: null,
      tool_output: {start_task_id: 'accepted-start', start_status: 'WORKING'},
    };
    mocks.client.mockResolvedValue({from: (table: string) => {
      const data = table === 'ai_tasks' ? task : table === 'ai_task_steps' ? [
        {id: 'execute-step', action_type: 'execute'}, {id: 'verify-step', action_type: 'record'},
      ] : [];
      const query: any = {};
      for (const method of ['select', 'eq', 'order', 'limit', 'insert', 'upsert']) query[method] = () => query;
      query.update = (values: any) => {updates.push({table, values}); return query;};
      query.single = query.maybeSingle = async () => ({data, error: null});
      query.then = (resolve: any) => Promise.resolve({data, error: null}).then(resolve);
      return query;
    }});
    mocks.evaluate.mockReturnValue({status: 'PASS', reasons: ['Independent evidence passed.'], evidence: {}});
  });

  it.each(['queued', 'running'])('keeps %s work running without completing, retrying or spending another attempt', async status => {
    mocks.lifecycle.mockResolvedValue({status, startTaskId: 'accepted-start'});
    const result = await refreshOpenHandsTask({taskId: 'owned-task', actorId: 'owner'});
    expect(result.status).toBe(status);
    const saved = updates.find(x => x.table === 'ai_tasks')!.values;
    expect(saved.status).toBe('running');
    expect(saved.completed_at).toBeNull();
    expect(saved.result_json.ok).toBe(false);
    expect(saved.result_json.status).toBe(status);
    expect(saved.tool_output.start_task_id).toBe('accepted-start');
    expect(saved).not.toHaveProperty('attempts');
    expect(saved.approval_status).toBe('not_required');
    const stepUpdates = updates.filter(x => x.table === 'ai_task_steps');
    expect(stepUpdates.map(x => x.values.status)).toEqual(['running', 'pending']);
    expect(stepUpdates.every(x => x.values.completed_at === null)).toBe(true);
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.github).not.toHaveBeenCalled();
    expect(mocks.evaluate).not.toHaveBeenCalled();
  });

  it('keeps a real provider failure terminal at its existing attempt limit', async () => {
    mocks.lifecycle.mockResolvedValue({status: 'failed', startTaskId: 'accepted-start', error: 'Provider rejected the execution.'});
    await refreshOpenHandsTask({taskId: 'owned-task', actorId: 'owner'});
    const saved = updates.find(x => x.table === 'ai_tasks')!.values;
    expect(saved.status).toBe('failed');
    expect(saved.error_message).toContain('Provider rejected');
    expect(saved.completed_at).toEqual(expect.any(String));
    expect(saved).not.toHaveProperty('attempts');
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it('retains approval gating when the provider requests confirmation', async () => {
    mocks.lifecycle.mockResolvedValue({status: 'approval_required', startTaskId: 'accepted-start'});
    await refreshOpenHandsTask({taskId: 'owned-task', actorId: 'owner'});
    const saved = updates.find(x => x.table === 'ai_tasks')!.values;
    expect(saved.status).toBe('awaiting_approval');
    expect(saved.requires_approval).toBe(true);
    expect(saved.approval_status).toBe('pending');
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it('does not accept provider completion without independent GitHub evidence', async () => {
    mocks.lifecycle.mockResolvedValue({status: 'completed', startTaskId: 'accepted-start'});
    mocks.github.mockResolvedValue({verified: false, pullRequests: [], reasons: ['No committed branch.']});
    await refreshOpenHandsTask({taskId: 'owned-task', actorId: 'owner'});
    const saved = updates.find(x => x.table === 'ai_tasks')!.values;
    expect(saved.status).toBe('awaiting_approval');
    expect(saved.result_json.ok).toBe(false);
    expect(mocks.evaluate).not.toHaveBeenCalled();
  });

  it.each([
    {combinedStatus: 'pending', checks: [], expected: 'running', shared: false},
    {combinedStatus: 'success', checks: [{name: 'Required CI', status: 'completed', conclusion: 'failure'}], expected: 'failed', shared: false},
    {combinedStatus: 'success', checks: [{name: 'Required CI', status: 'completed', conclusion: 'success'}], expected: 'completed', shared: true},
  ])('preserves completed-execution verification: $expected', async ({combinedStatus, checks, expected, shared}) => {
    mocks.lifecycle.mockResolvedValue({status: 'completed', startTaskId: 'accepted-start'});
    mocks.github.mockResolvedValue({verified: true, pullRequests: [{number: 1, combinedStatus, checkRuns: checks}], reasons: []});
    await refreshOpenHandsTask({taskId: 'owned-task', actorId: 'owner'});
    const saved = updates.find(x => x.table === 'ai_tasks')!.values;
    expect(saved.status).toBe(expected);
    expect(saved.result_json.ok).toBe(expected === 'completed');
    expect(mocks.evaluate).toHaveBeenCalledTimes(shared ? 1 : 0);
    expect(mocks.start).not.toHaveBeenCalled();
    expect(saved).not.toHaveProperty('attempts');
  });
});
