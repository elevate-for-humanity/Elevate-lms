import { describe, it, expect } from 'vitest';
import {
  clampSetupFeeCents,
  MIN_SETUP_FEE_CENTS,
  PAYMENT_TERM_WEEKS,
  TUITION_CENTS,
  weeklyPaymentCents,
} from '@/lib/barber/pricing';

describe('barber pricing authority', () => {
  it('uses $4,980 tuition, $600 minimum setup fee, and 29 weekly payments', () => {
    expect(TUITION_CENTS).toBe(498000);
    expect(MIN_SETUP_FEE_CENTS).toBe(60000);
    expect(PAYMENT_TERM_WEEKS).toBe(29);
    expect(weeklyPaymentCents(600)).toBe(15104);
  });

  it('clamps custom setup fees to the canonical allowed range', () => {
    expect(clampSetupFeeCents(0)).toBe(60000);
    expect(clampSetupFeeCents(600)).toBe(60000);
    expect(clampSetupFeeCents(750)).toBe(75000);
    expect(clampSetupFeeCents(4980)).toBe(498000);
    expect(clampSetupFeeCents(6000)).toBe(498000);
  });
});
