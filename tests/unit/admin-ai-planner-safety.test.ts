import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

describe('Admin AI operational planner safety', () => {
  let planAIToolFromCommand: typeof import('@/lib/ai/tools/planner').planAIToolFromCommand;
  let decomposePlan: typeof import('@/lib/platform/planner').decomposePlan;

  beforeAll(async () => {
    ({ planAIToolFromCommand } = await import('@/lib/ai/tools/planner'));
    ({ decomposePlan } = await import('@/lib/platform/planner'));
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

  it('keeps an explicit read-only Studio diagnostic on read-only tools', () => {
    const plan = decomposePlan(
      'READ-ONLY DIAGNOSTIC TEST. Verify the Studio provider, router, and tool-response path. Report the current Studio health and name one read-only internal tool you can successfully execute. Do not modify data, create records, start or stop jobs, approve tasks, deploy, publish, send messages, upload, or delete anything.',
    );

    expect(plan.steps).toHaveLength(3);
    expect(plan.steps.map((step) => planAIToolFromCommand(step.command)?.name)).toEqual([
      'devstudio.health',
      'system.health',
      'workflows.inspect',
    ]);
    expect(plan.steps.some((step) => step.title === 'Create snapshot')).toBe(false);
  });

  it('never treats an explicit read-only request as affirmative deployment authorization', () => {
    const plan = decomposePlan(
      'READ-ONLY: inspect the current course status and report it. Do not deploy anything.',
    );

    expect(plan.steps.some((step) => step.title === 'Create snapshot')).toBe(false);
    expect(plan.steps.some((step) => step.title === 'Execute approved deployment')).toBe(false);
  });
});
