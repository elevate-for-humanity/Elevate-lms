import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

describe('Admin AI operational planner safety', () => {
  let planAIToolFromCommand: typeof import('@/lib/ai/tools/planner').planAIToolFromCommand;

  beforeAll(async () => {
    ({ planAIToolFromCommand } = await import('@/lib/ai/tools/planner'));
  });

  it('routes workflow inspection to the read-only inspector', () => {
    const planned = planAIToolFromCommand(
      'Inspect the active Cosmetology production course workflow and report its current step, checkpoint progress, provider, GPU allocation, failures, and estimated completion time. Read only: do not deploy, restart, cancel, modify data, or create additional GPU resources.',
    );

    expect(planned).toEqual({ name: 'workflows.inspect', input: {} });
  });

  it('does not treat a negated deployment instruction as authorization to deploy', () => {
    const planned = planAIToolFromCommand('Check the course status but do not deploy anything.');

    expect(planned?.name).not.toBe('deployments.autopilot');
  });

  it('still routes an affirmative deployment request to the governed deployment tool', () => {
    const planned = planAIToolFromCommand('Deploy the latest approved Admin build.');

    expect(planned).toEqual({ name: 'deployments.autopilot', input: {} });
  });
});
