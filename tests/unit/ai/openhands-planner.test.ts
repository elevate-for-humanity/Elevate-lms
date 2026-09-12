import { describe, expect, it } from 'vitest';
import { planAIToolFromCommand } from '../../../lib/ai/tools/planner';

describe('OpenHands engineering delegation', () => {
  it('routes repository engineering work to OpenHands', () => {
    const planned = planAIToolFromCommand(
      'Fix the broken TypeScript route and add a regression test',
    );
    expect(planned?.name).toBe('openhands.execute');
    expect(planned?.input.task).toContain('Fix the broken TypeScript route');
  });

  it('routes compound browser and repository repair to OpenHands', () => {
    const command =
      'Fix every public Store demo in the live browser and repository, including claims that do not match the real workflow';
    const planned = planAIToolFromCommand(command);
    expect(planned?.name).toBe('openhands.execute');
    expect(planned?.input.task).toContain('Store demo');
  });

  it('routes browser-only inspection to the isolated browser runtime', () => {
    const planned = planAIToolFromCommand(
      'Inspect the live production homepage for broken links and rendering problems; make no changes',
    );
    expect(planned?.name).toBe('browser.execute');
  });

  it('routes browser audits to browser execution instead of OpenHands', () => {
    const planned = planAIToolFromCommand(
      'Scan public Store demo routes and test broken links, mobile layout, console errors, and API errors',
    );
    expect(planned?.name).toBe('browser.execute');
  });

  it('routes a commercial request to the canonical Media Studio renderer', () => {
    const planned = planAIToolFromCommand(
      'Create a 30-second 16:9 commercial video for the Store demos and show the real workflow',
    );
    expect(planned?.name).toBe('video.generate');
    expect(planned?.input).toMatchObject({
      action: 'render',
      durationSeconds: 30,
      aspectRatio: '16:9',
    });
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
    const courseId = '00000000-0000-4000-8000-000000000001';
    const command = `Finish the cosmetology course ${courseId}`;
    const planned = planAIToolFromCommand(command);

    expect(planned).toEqual({
      name: 'courses.generate',
      input: { action: 'start', goal: command, courseId },
    });
  });

  it('routes selective course-video repair to Course Builder instead of OpenHands', () => {
    const courseId = '00000000-0000-4000-8000-000000000001';
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

  it('inspects workflow state without dispatching an engineering worker', () => {
    expect(planAIToolFromCommand('Show the current failed workflow status')?.name).toBe(
      'workflows.inspect',
    );
  });

  it('routes workflow repair to executable engineering instead of read-only inspection', () => {
    const command = 'Fix the failed deployment workflow and add a regression test';
    const planned = planAIToolFromCommand(command);
    expect(planned?.name).toBe('openhands.execute');
    expect(planned?.input.task).toBe(command);
  });

  it('routes an AI counselor assignment to the governed student-success tool', () => {
    const userId = '00000000-0000-4000-8000-000000000002';
    const planned = planAIToolFromCommand(`Assign AI counselor to learner ${userId}`);
    expect(planned).toEqual({ name: 'risk.assignCounselor', input: { userId } });
  });
});
