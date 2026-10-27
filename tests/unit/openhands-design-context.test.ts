import { describe, expect, it } from 'vitest';
import { elevateDesignExecutionContext } from '@/lib/devstudio/openhands/context';

describe('Elevate OpenHands design context', () => {
  it('adds the governed visual contract to design work', () => {
    const context = elevateDesignExecutionContext('Fix the mobile hero banner design');

    expect(context).toContain('Elevate visual-execution contract');
    expect(context).toContain('scripts/design-enforcer.mjs --strict');
    expect(context).toContain('Studio Chromium');
    expect(context).toContain('do not imitate another product');
  });

  it('does not add design instructions to unrelated backend work', () => {
    expect(elevateDesignExecutionContext('Repair a database lease timeout')).toBeNull();
  });
});
