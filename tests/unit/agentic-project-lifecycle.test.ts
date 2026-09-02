import { describe, expect, it } from 'vitest';
import {
  allowedAgenticProjectTransitions,
  assertAgenticProjectTransition,
  canTransitionAgenticProject,
} from '@/lib/agentic/project-lifecycle';

describe('canonical agentic project lifecycle', () => {
  it('supports the production creation path', () => {
    const path = [
      'discovery',
      'planned',
      'approved',
      'designing',
      'building',
      'validating',
      'preview_ready',
      'awaiting_approval',
      'publishing',
      'live',
    ] as const;
    for (let index = 0; index < path.length - 1; index += 1) {
      expect(canTransitionAgenticProject(path[index], path[index + 1])).toBe(true);
    }
  });

  it('prevents bypassing plan, validation and approval gates', () => {
    expect(canTransitionAgenticProject('discovery', 'live')).toBe(false);
    expect(canTransitionAgenticProject('building', 'publishing')).toBe(false);
    expect(canTransitionAgenticProject('preview_ready', 'publishing')).toBe(false);
    expect(() => assertAgenticProjectTransition('discovery', 'live')).toThrow(
      'Invalid agentic project lifecycle transition',
    );
  });

  it('supports repair and rollback without destructive jumps', () => {
    expect(allowedAgenticProjectTransitions('validating')).toContain('repairing');
    expect(canTransitionAgenticProject('repairing', 'validating')).toBe(true);
    expect(canTransitionAgenticProject('live', 'rolling_back')).toBe(true);
    expect(canTransitionAgenticProject('rolling_back', 'rolled_back')).toBe(true);
    expect(canTransitionAgenticProject('rolled_back', 'live')).toBe(true);
  });
});
