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
  });

  it('keeps generic platform test execution on the existing workflow tool', () => {
    const planned = planAIToolFromCommand('Run all platform tests');
    expect(planned?.name).toBe('workflows.runTests');
  });
});
