import { describe, expect, it } from 'vitest';
import { routeEllieMessage } from '@/lib/devstudio/ellie-message-router';

describe('routeEllieMessage', () => {
  it('routes deploy commands to command', () => {
    expect(routeEllieMessage('Deploy the LMS service')).toBe('command');
  });

  it('routes ops queries to ops', () => {
    expect(routeEllieMessage('How many pending applications are there?')).toBe('ops');
  });

  it('routes code search to platform', () => {
    expect(routeEllieMessage('Search code for proxy.ts middleware errors')).toBe('platform');
  });
});
