import { describe, expect, it } from 'vitest';
import { planAIToolFromCommand } from '../../lib/ai/tools/planner';

describe('Admin AI container routing', () => {
  it('routes Studio container error scans to live container health', () => {
    expect(planAIToolFromCommand('Scan the Studio container for errors')).toEqual({
      name: 'devstudio.health',
      input: {},
    });
  });
});
