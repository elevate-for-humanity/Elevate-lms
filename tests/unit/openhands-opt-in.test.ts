/**
 * tests/unit/openhands-opt-in.test.ts
 *
 * OpenHands is opt-in-only: nothing dispatches to it unless
 * PARIS_REPAIR_ENGINE=openhands. The adapter code is retained, gated off.
 */
import { describe, expect, it } from 'vitest';
import { isOpenHandsOptedIn, requireOpenHandsOptIn } from '@/lib/devstudio/openhands-opt-in';
import { parisRepairEngine } from '@/lib/devstudio/paris-openhands-repair.mjs';

describe('isOpenHandsOptedIn', () => {
  it('is off by default and for any other value', () => {
    expect(isOpenHandsOptedIn({})).toBe(false);
    expect(isOpenHandsOptedIn({ PARIS_REPAIR_ENGINE: 'internal' })).toBe(false);
    expect(isOpenHandsOptedIn({ PARIS_REPAIR_ENGINE: '' })).toBe(false);
  });

  it('is on only for an explicit openhands opt-in', () => {
    expect(isOpenHandsOptedIn({ PARIS_REPAIR_ENGINE: 'openhands' })).toBe(true);
    expect(isOpenHandsOptedIn({ PARIS_REPAIR_ENGINE: ' OpenHands ' })).toBe(true);
  });

  it('requireOpenHandsOptIn fails closed without the opt-in', () => {
    expect(() => requireOpenHandsOptIn({})).toThrow('PARIS_OPENHANDS_OPT_IN_REQUIRED');
    expect(() => requireOpenHandsOptIn({ PARIS_REPAIR_ENGINE: 'openhands' })).not.toThrow();
  });
});

describe('parisRepairEngine', () => {
  it('selects the internal engine for new repairs', () => {
    expect(parisRepairEngine(null)).toBe('internal');
    expect(parisRepairEngine(undefined)).toBe('internal');
    expect(parisRepairEngine({ kind: 'planner-checkpoint', checkpoint: { writes: 2 } })).toBe('internal');
  });

  it('keeps even a historical OpenHands checkpoint internal without the opt-in', () => {
    expect(parisRepairEngine({ kind: 'openhands-checkpoint' })).toBe('internal');
  });

  it('selects OpenHands only with the explicit opt-in', () => {
    expect(
      parisRepairEngine({ kind: 'openhands-checkpoint' }, { PARIS_REPAIR_ENGINE: 'openhands' }),
    ).toBe('openhands');
    // A fresh repair selects OpenHands first under the opt-in; the caller
    // falls back to the internal engine when OpenHands readiness fails.
    expect(parisRepairEngine(null, { PARIS_REPAIR_ENGINE: 'openhands' })).toBe('openhands');
    expect(
      parisRepairEngine({ kind: 'planner-checkpoint' }, { PARIS_REPAIR_ENGINE: 'openhands' }),
    ).toBe('internal');
  });
});
