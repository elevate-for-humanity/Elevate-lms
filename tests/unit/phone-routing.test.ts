import { describe, expect, it } from 'vitest';
import { resolveElevateCallRoute, usesCarrier } from '@/lib/phone/routing';

describe('Elevate call routing', () => {
  it('keeps extensions off the PSTN carrier', () => {
    for (const extension of ['0','101','105','216']) {
      const route = resolveElevateCallRoute(extension);
      expect(route).toEqual({ kind: 'internal', extension });
      expect(route && usesCarrier(route)).toBe(false);
    }
  });
  it('routes ordinary outside numbers to the PSTN gateway', () => {
    expect(resolveElevateCallRoute('3175551212')).toEqual({ kind: 'pstn', e164: '+13175551212' });
    expect(resolveElevateCallRoute('+13175551212')).toEqual({ kind: 'pstn', e164: '+13175551212' });
  });
});
