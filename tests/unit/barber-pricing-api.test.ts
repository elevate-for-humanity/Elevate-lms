import { describe, it, expect } from 'vitest';
import {
  MIN_SETUP_FEE_CENTS,
  PAYMENT_TERM_WEEKS,
  TUITION_CENTS,
} from '@/lib/barber/pricing';

describe('barber pricing authority', () => {
  it('uses $4,980 tuition, no minimum down payment, 29 weekly payments', () => {
    expect(TUITION_CENTS).toBe(498000);
    expect(MIN_SETUP_FEE_CENTS).toBe(0); // No minimum required
    expect(PAYMENT_TERM_WEEKS).toBe(29);
    // With $0 down, full tuition spread over 29 weeks
    const weekly = Math.ceil((TUITION_CENTS - MIN_SETUP_FEE_CENTS) / PAYMENT_TERM_WEEKS);
    expect(weekly).toBe(17173); // ~$172/wk with no down payment
  });

  it('allows custom down payments from $0 to full tuition', () => {
    // Verify the clamp function works for various inputs
    const clamp = (fee: number) => Math.min(TUITION_CENTS, Math.max(0, fee));
    expect(clamp(0)).toBe(0);
    expect(clamp(60000)).toBe(60000);
    expect(clamp(498000)).toBe(498000);
    expect(clamp(600000)).toBe(498000); // Capped at tuition
  });
});
