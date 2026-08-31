import { describe, expect, it } from 'vitest';
import { planAIToolFromCommand } from '../../../lib/ai/tools/planner';

describe('OpenHands engineering delegation', () => {
  it('routes repository engineering work to OpenHands', () => {
    const planned = planAIToolFromCommand('Fix the broken TypeScript route and add a regression test');
    expect(planned?.name).toBe('openhands.execute');
    expect(planned?.input.task).toContain('Fix the broken TypeScript route');
  });

  it('routes explicit OpenHands status checks to the status tool', () => {
    const planned = planAIToolFromCommand('Check OpenHands progress', {
      toolInput: { taskId: 'task-123' },
    });
    expect(planned).toEqual({ name: 'openhands.status', input: { taskId: 'task-123' } });
  });

  it('keeps Course Builder generation on the canonical course tool', () => {
    const planned = planAIToolFromCommand('Build the Business Administration course');
    expect(planned?.name).toBe('courses.generate');
    expect(planned?.input).toMatchObject({
      action: 'start',
      goal: 'Build the Business Administration course',
    });
  });

  it('resumes a complete existing course through the same agentic Course Builder', () => {
    const courseId = '9ca9fb50-7119-46ea-ab81-9b0193c29c31';
    const command = `Finish the cosmetology course ${courseId}`;
    const planned = planAIToolFromCommand(command);

    expect(planned).toEqual({
      name: 'courses.generate',
      input: { action: 'start', goal: command, courseId },
    });
  });

  it('keeps generic platform test execution on the existing workflow tool', () => {
    const planned = planAIToolFromCommand('Run all platform tests');
    expect(planned?.name).toBe('workflows.runTests');
  });

  it('routes an AI counselor assignment to the governed student-success tool', () => {
    const userId = '9f5f71a6-1f75-4c40-8de4-4e091ade32fb';
    const planned = planAIToolFromCommand(`Assign AI counselor to learner ${userId}`);
    expect(planned).toEqual({ name: 'risk.assignCounselor', input: { userId } });
  });
});
