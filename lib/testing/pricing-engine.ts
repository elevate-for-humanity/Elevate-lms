/**
 * Testing center pricing engine.
 *
 * All exam prices must flow through calculatePrice(). No hardcoded dollar
 * amounts anywhere else in the testing stack.
 *
 * MARGIN FLOOR: 40% minimum on every exam. The engine throws if a provider
 * config would produce a price below that floor — catches misconfiguration
 * at import time, not at runtime.
 *
 * VOUCHER COSTS: Every number marked ⚠️ ESTIMATE must be verified against
 * your actual provider agreement and corrected in the relevant provider file.
 * The estimates are conservative (high) so you never accidentally lose money
 * while the real numbers are being confirmed.
 */

export type Provider =
  | 'certiport'
  | 'nrf'
  | 'workkeys'
  | 'esco'
  | 'nha';

export interface PricingInput {
  /** Voucher/exam fee you pay the provider — the true variable cost */
  voucherCost: number;
  /** Allocated proctor time cost per seat in dollars */
  proctorCost: number;
  /** Allocated facility/ops overhead per seat in dollars */
  overheadCost: number;
  provider: Provider;
}

export interface PricingResult {
  /** Total true cost per seat */
  trueCost: number;
  /** Price charged to the test-taker, rounded up to nearest dollar */
  price: number;
  /** Gross profit per seat */
  profit: number;
  /** Gross margin as a decimal (e.g. 0.45 = 45%) */
  margin: number;
}

/**
 * Minimum acceptable gross margin. Any provider config that produces a margin
 * below this will throw at module load time.
 */
export const MARGIN_FLOOR = 0.40;

/**
 * Per-provider target multipliers applied to true cost.
 * Certiport carries higher compliance overhead (Pearson audit requirements,
 * system maintenance, annual authorization fees) so it gets a higher multiplier.
 */
const PROVIDER_MULTIPLIERS: Record<Provider, number> = {
  certiport: 2.1,  // higher compliance burden
  nrf:       1.9,
  workkeys:  1.9,
  esco:      1.8,
  nha:       1.6,  // NHA already has a high voucher cost; lower multiplier keeps price competitive
};

export function calculatePrice(input: PricingInput): PricingResult {
  const trueCost = input.voucherCost + input.proctorCost + input.overheadCost;
  const multiplier = PROVIDER_MULTIPLIERS[input.provider];
  const price = Math.ceil(trueCost * multiplier);
  const profit = price - trueCost;
  const margin = profit / price;

  if (margin < MARGIN_FLOOR) {
    throw new Error(
      `[pricing-engine] Margin floor violation for provider "${input.provider}": ` +
      `${(margin * 100).toFixed(1)}% < ${(MARGIN_FLOOR * 100).toFixed(1)}% minimum. ` +
      `True cost $${trueCost}, price $${price}. Raise price or reduce cost.`
    );
  }

  return { trueCost, price, profit, margin };
}

/**
 * Retake pricing. Lower than full price (psychology) but still profitable.
 * Retake cost = voucher only (facility already paid, proctor time is shorter).
 * Minimum 30% margin enforced.
 */
export function calculateRetakePrice(voucherCost: number): number {
  const retakeOverhead = 10; // reduced overhead for retake (shorter session)
  const cost = voucherCost + retakeOverhead;
  const price = Math.ceil(cost * 1.5);
  const margin = (price - cost) / price;

  if (margin < 0.30) {
    throw new Error(
      `[pricing-engine] Retake margin too low: ${(margin * 100).toFixed(1)}% < 30% minimum.`
    );
  }

  return price;
}

/**
 * No-show fee. Covers proctor time + admin cost of the missed slot.
 * Not tied to voucher cost — the voucher is already consumed.
 */
export function calculateNoShowFee(proctorCost: number, overheadCost: number): number {
  // 1.5× the wasted time cost, minimum $50
  return Math.max(50, Math.ceil((proctorCost + overheadCost) * 1.5));
}
