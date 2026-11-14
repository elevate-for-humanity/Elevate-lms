import { describe, expect, it } from 'vitest';
import {
  IMPLEMENTATION_PACKAGES,
  getImplementationPackage,
} from '@/lib/store/implementation-packages';

describe('standalone implementation packages', () => {
  it('keeps each payoff schedule equal to the package total', () => {
    for (const item of Object.values(IMPLEMENTATION_PACKAGES)) {
      expect(item.depositCents + item.installmentCount * item.installmentCents).toBe(
        item.totalCents,
      );
    }
  });

  it('publishes the three approved package totals and deposits', () => {
    expect(IMPLEMENTATION_PACKAGES['standalone-launch']).toMatchObject({
      totalCents: 300_000,
      depositCents: 75_000,
    });
    expect(IMPLEMENTATION_PACKAGES['standalone-growth']).toMatchObject({
      totalCents: 650_000,
      depositCents: 150_000,
    });
    expect(IMPLEMENTATION_PACKAGES['standalone-professional']).toMatchObject({
      totalCents: 1_000_000,
      depositCents: 250_000,
    });
  });

  it('rejects unknown package ids', () => {
    expect(getImplementationPackage('unknown')).toBeNull();
  });
});
