import { describe, expect, it } from 'vitest';
import { routeEllieMessage, selectStudioAgent } from '@/lib/devstudio/ellie-message-router';

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

  it('routes read-only course lookup to ELLIE platform tools', () => {
    expect(routeEllieMessage('Show me the cosmetology course')).toBe('platform');
    expect(routeEllieMessage('Open the Indiana Cosmetology License course')).toBe('platform');
    expect(selectStudioAgent('Show me the cosmetology course')).toBe('ELLIE');
  });

  it('routes website creation and publishing to the tool orchestrator', () => {
    expect(routeEllieMessage('Build a website for a training provider')).toBe('platform');
    expect(routeEllieMessage('Publish the website after checking it')).toBe('platform');
  });
});

describe('selectStudioAgent', () => {
  it.each([
    ['Build an adaptive CNA course', 'ELLIE'],
    ['Audit RLS policies and verified claims', 'ZORA'],
    ['Interview a business owner and build their website', 'PARIS'],
    ['Inspect the failed deployment workflow', 'LIZZY'],
  ])('routes %s to %s', (message, agent) => {
    expect(selectStudioAgent(message)).toBe(agent);
  });
});
