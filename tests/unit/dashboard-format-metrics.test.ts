import { describe, expect, it } from 'vitest';
import {
  clampDisplayPercent,
  formatCentsCompact,
  isTestOrSuspiciousPayment,
  monthOverMonthDelta,
} from '@/lib/admin/dashboard/format-metrics';

describe('dashboard format-metrics', () => {
  it('caps absurd MoM percentages for display', () => {
    expect(clampDisplayPercent(8401)).toBe(99);
    expect(clampDisplayPercent(-200)).toBe(-99);
  });

  it('uses stock-metric label for pending backlog', () => {
    const r = monthOverMonthDelta(289, 0, { stockMetric: true });
    expect(r.delta).toBe(0);
    expect(r.deltaLabel).toContain('289');
  });

  it('flags test payments and huge amounts', () => {
    expect(
      isTestOrSuspiciousPayment({
        email: 'elevateforhumanity@gmail.com',
        label: 'Stripe',
        amountCents: 100,
      }),
    ).toBe(true);
    expect(
      isTestOrSuspiciousPayment({
        email: 'a@b.com',
        label: 'Barber',
        amountCents: 20_000_000,
      }),
    ).toBe(true);
  });

  it('formats millions correctly', () => {
    expect(formatCentsCompact(340_000_000)).toBe('$3.4M');
  });
});
