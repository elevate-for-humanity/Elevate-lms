import { describe, expect, it } from 'vitest';
import { planAIToolFromCommand } from '../../../lib/ai/tools/planner';

describe('OpenHands engineering delegation', () => {
  it('routes repository engineering work to OpenHands', () => {
    const planned = planAIToolFromCommand('Fix the broken TypeScript route and add a regression test');
    expect(planned?.name).toBe('openhands.execute');
    expect(planned?.input.task).toContain('Fix the broken TypeScript route');
  });

  it('routes Store demo repairs to engineering instead of workflow inspection', () => {
    const command = 'Fix every public Store demo in the live browser and repository, including claims that do not match the real workflow';
    const planned = planAIToolFromCommand(command);
    expect(planned?.name).toBe('openhands.execute');
    expect(planned?.input.task).toContain('Store demo');
  });

  it('does not treat a Store demo audit as workflow status inspection', () => {
    const planned = planAIToolFromCommand('Scan public Store demo routes and test broken links, mobile layout, console errors, and API errors');
    expect(planned?.name).toBe('openhands.execute');
  });

  it('routes a commercial request to the canonical Media Studio renderer', () => {
    const planned = planAIToolFromCommand('Create a 30-second 16:9 commercial video for the Store demos and show the real workflow');
    expect(planned?.name).toBe('video.generate');
    expect(planned?.input).toMatchObject({ action: 'render', durationSeconds: 30, aspectRatio: '16:9' });
  });

  it('uses the approved organization directory for Elevate people questions', () => {
    expect(planAIToolFromCommand('Who is Elizabeth Greene at Elevate for Humanity?')).toEqual({
      name: 'organization.directory',
      input: { query: 'Elizabeth Greene' },
    });
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

  it('routes selective course-video repair to Course Builder instead of OpenHands', () => {
    const courseId = '9ca9fb50-7119-46ea-ab81-9b0193c29c31';
    const command = `Repair failed course videos for ${courseId}, publish replacements to every dashboard endpoint, and do not rebuild the course`;
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
