import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/devstudio/os/risk', () => ({
  detectRiskTags: () => [],
  requiresApproval: () => false,
  approvalReason: () => '',
}));
vi.mock('@/lib/devstudio/os/audit', () => ({
  newTraceId: () => 'trace',
  writeDevAuditLog: vi.fn(),
}));
vi.mock('@/lib/ai/tools/registry', () => ({
  getAITool: (name: string) => ({
    name,
    approvalRequired: name === 'courses.generate',
    idempotent: true,
  }),
}));
vi.mock('@/lib/ai/runtime/command-executor', () => ({ executeAICommand: vi.fn() }));
vi.mock('@/lib/devstudio/studio-run-reconciler', () => ({
  reconcileStudioRunFromTask: vi.fn(),
}));

import { createAiTask } from '@/lib/devstudio/os/task-runner';
import { planAIToolFromCommand } from '@/lib/ai/tools/planner';
import { evaluateExecution } from '@/lib/platform/orchestration/evaluator';

describe('Studio dispatch and negative verification', () => {
  it.each(['system.health', 'devstudio.health', 'workflows.inspect'])(
    'does not verify an explicit failed result from %s',
    (tool) => {
      expect(evaluateExecution({
        tool, result: { ok: false }, attempts: 1, maxAttempts: 2,
      }).status).toBe('FAIL_BLOCKING');
    },
  );

  it('keeps transient failure retries bounded', () => {
    const input = {
      tool: 'system.health',
      result: { ok: false, message: '503 temporarily unavailable' },
      maxAttempts: 2,
    };
    expect(evaluateExecution({ ...input, attempts: 1 }).status).toBe('FAIL_RETRYABLE');
    expect(evaluateExecution({ ...input, attempts: 2 }).status).toBe('FAIL_BLOCKING');
  });

  it('rejects negative flags even when durable evidence is present', () => {
    expect(evaluateExecution({
      tool: 'deployments.autopilot',
      result: { success: false, deploymentId: 'deployment', status: 'ready' },
    }).status).toBe('FAIL_BLOCKING');
  });

  it.each([
    { ok: false, error: { message: 'Upstream failed', code: 'ETIMEDOUT' } },
    { ok: false, error: { message: 'Upstream failed', statusCode: 503 } },
    { success: false, httpStatus: 429 },
  ])('recognizes structured transient failures without retrying forever', (result) => {
    const input = { tool: 'system.health', result, maxAttempts: 3 };
    expect(evaluateExecution({ ...input, attempts: 1 }).status).toBe('FAIL_RETRYABLE');
    expect(evaluateExecution({ ...input, attempts: 3 }).status).toBe('FAIL_BLOCKING');
  });

  it('does not retry an authorization failure as a transient error', () => {
    expect(evaluateExecution({
      tool: 'system.health', result: { ok: false, statusCode: 403 },
      attempts: 1, maxAttempts: 3,
    }).status).toBe('FAIL_BLOCKING');
  });

  it('preserves a successful read-only result', () => {
    expect(evaluateExecution({tool: 'system.health', result: {ok: true}}).status).toBe('PASS');
  });

  it('routes the canonical platform snapshot to a read-only tool', () => {
    expect(planAIToolFromCommand('Get live platform state')?.name).toBe('system.health');
  });

  it('dispatches a plan step without selecting tools from its overall goal', async () => {
    let inserted: Record<string, unknown> | undefined;
    const db = {
      from(table: string) {
        const query = {
          select: () => query,
          eq: () => query,
          maybeSingle: async () => ({ data: null }),
          insert(value: Record<string, unknown>) {
            if (table === 'ai_tasks') inserted = value;
            return query;
          },
          single: async () => ({ data: null, error: { message: 'Captured dispatch' } }),
        };
        return query;
      },
    };
    await expect(createAiTask(db as never, {
      title: '[plan] Get platform state',
      description: 'Plan step for goal: resume course and repair media for course f15c10b6-3c01-4465-8765-a7e311d63f2c',
      command: 'Get live platform state',
      requestedBy: 'admin',
    })).rejects.toThrow('Captured dispatch');
    expect(inserted).toMatchObject({
      command: 'Get live platform state',
      tool_name: 'system.health',
      requires_approval: false,
    });
  });
});
