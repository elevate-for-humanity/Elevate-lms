import { describe, expect, it } from 'vitest';
import {
  routeEllieMessage,
  selectStudioAgent,
  shouldOrchestrateMessage,
} from '@/lib/devstudio/ellie-message-router';
import { planAIToolFromCommand } from '@/lib/ai/tools/planner';
import { decomposePlan } from '@/lib/platform/planner';

describe('routeEllieMessage', () => {
  it('routes explicit deploy commands to command execution', () => {
    expect(routeEllieMessage('Deploy the LMS service')).toBe('command');
  });

  it('routes live admin queries to ops', () => {
    expect(routeEllieMessage('How many pending applications are there?')).toBe('ops');
  });

  it('routes code search to platform tools', () => {
    expect(routeEllieMessage('Search code for proxy.ts middleware errors')).toBe('platform');
  });

  it('routes course creation to the tool orchestrator instead of raw command execution', () => {
    expect(routeEllieMessage('Build a course for medical assistants')).toBe('platform');
    expect(routeEllieMessage('Generate a course about workplace safety')).toBe('platform');
    expect(routeEllieMessage('Use the course builder to make a CNA course')).toBe('platform');
  });

  it('routes read-only course lookup to unified platform tools', () => {
    expect(routeEllieMessage('Show me the cosmetology course')).toBe('platform');
    expect(routeEllieMessage('Open the Indiana Cosmetology License course')).toBe('platform');
    expect(selectStudioAgent('Show me the cosmetology course')).toBe('LIZZY');
  });

  it('routes website creation and publishing to the tool orchestrator', () => {
    expect(routeEllieMessage('Build a website for a training provider')).toBe('platform');
    expect(routeEllieMessage('Publish the website after checking it')).toBe('platform');
  });

  it('keeps conversational repair follow-ups in the stateful tool orchestrator', () => {
    expect(routeEllieMessage('Can u fix this')).toBe('platform');
    expect(routeEllieMessage('Please continue and correct it')).toBe('platform');
  });
});

describe('shouldOrchestrateMessage', () => {
  it('sends requested outcomes and operational verification through the durable planner', () => {
    expect(shouldOrchestrateMessage('Fix QuickBooks and verify the connection')).toBe(true);
    expect(shouldOrchestrateMessage('Audit the live admin dashboard')).toBe(true);
    expect(shouldOrchestrateMessage('Deploy the approved build')).toBe(true);
  });

  it('keeps informational questions conversational', () => {
    expect(shouldOrchestrateMessage('What is QuickBooks used for?')).toBe(false);
    expect(shouldOrchestrateMessage('Explain the apprenticeship workflow')).toBe(false);
  });
});

describe('durable orchestration planning', () => {
  it('grounds QuickBooks in its canonical live integration', () => {
    expect(planAIToolFromCommand('Check QuickBooks connection status')).toEqual({
      name: 'quickbooks.status',
      input: {},
    });
    expect(planAIToolFromCommand('Sync QuickBooks payroll')).toEqual({
      name: 'quickbooks.syncPayroll',
      input: { action: 'sync_payroll' },
    });
  });

  it('preserves the requested operational outcome in the durable plan', () => {
    const audit = decomposePlan('Audit the live admin dashboard');
    expect(audit.steps[0]?.command).toBe('Audit the live admin dashboard');

    const deploy = decomposePlan('Deploy the approved Admin build');
    expect(deploy.steps.at(-1)?.command).toBe('Deploy the approved Admin build');
  });

  it('does not bury compound engineering repair behind a generic pre-deploy audit', () => {
    const goal =
      'Fix the repository workflow, add regression tests, commit the changed files, deploy, and verify production';
    const plan = decomposePlan(goal);
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]).toMatchObject({
      title: 'Execute engineering outcome',
      command: goal,
    });
  });
});

describe('selectStudioAgent', () => {
  it.each([
    ['Build an adaptive CNA course', 'LIZZY'],
    ['Audit RLS policies and verified claims', 'LIZZY'],
    ['Interview a business owner and build their website', 'LIZZY'],
    ['Inspect the failed deployment workflow', 'LIZZY'],
  ])('routes %s to %s', (message, agent) => {
    expect(selectStudioAgent(message)).toBe(agent);
  });
});
