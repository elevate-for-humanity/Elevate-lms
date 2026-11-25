/**
 * tests/unit/openhands-opt-in.test.ts
 *
 * OpenHands has been REMOVED (2026-11-25): the opt-in module
 * (lib/devstudio/openhands-opt-in.ts) is deleted and the owned internal
 * engine is the only repair engine. Engine selection no longer exists:
 * parisRepairEngine resolves every candidate to 'internal', and the
 * legacy PARIS_REPAIR_ENGINE environment variable is inert — setting it
 * to 'openhands' cannot re-enable OpenHands.
 */
import { describe, expect, it } from 'vitest';
import { parisRepairEngine } from '@/lib/devstudio/paris-openhands-repair.mjs';

describe('parisRepairEngine after the OpenHands removal', () => {
  it('selects the internal engine for new repairs', () => {
    expect(parisRepairEngine(null)).toBe('internal');
    expect(parisRepairEngine(undefined)).toBe('internal');
    expect(parisRepairEngine({ kind: 'planner-checkpoint', checkpoint: { writes: 2 } })).toBe('internal');
  });

  it('restages even a historical OpenHands checkpoint on the internal engine', () => {
    expect(parisRepairEngine({ kind: 'openhands-checkpoint' })).toBe('internal');
  });

  it('ignores the legacy PARIS_REPAIR_ENGINE value entirely', () => {
    expect(
      parisRepairEngine({ kind: 'openhands-checkpoint' }, { PARIS_REPAIR_ENGINE: 'openhands' }),
    ).toBe('internal');
    expect(parisRepairEngine(null, { PARIS_REPAIR_ENGINE: 'openhands' })).toBe('internal');
    expect(parisRepairEngine(null, { PARIS_REPAIR_ENGINE: ' OpenHands ' })).toBe('internal');
    expect(
      parisRepairEngine({ kind: 'planner-checkpoint' }, { PARIS_REPAIR_ENGINE: 'openhands' }),
    ).toBe('internal');
  });
});
