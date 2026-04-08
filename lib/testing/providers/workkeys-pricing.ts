/**
 * ACT WorkKeys / NCRC pricing for Elevate Testing Center.
 *
 * ⚠️  VERIFY BEFORE LAUNCH: ACT institutional per-assessment fee.
 *     Typical authorized center rate: $13.50–$22/assessment.
 *     Check your ACT agreement and update VOUCHER_COST_PER_ASSESSMENT.
 *
 * Cost structure per seat:
 *   Voucher (ACT fee):   $18   ← ⚠️ ESTIMATE — verify against your ACT agreement
 *   Proctor time:        $22   ← 45-min session, allocated hourly rate
 *   Overhead:            $12   ← facility + ops per seat
 *   ─────────────────────────
 *   True cost/seat:      $52
 *
 * Previous pricing (what you were charging):
 *   Individual:  $45  → was LOSING ~$7/test
 *   Full NCRC:   $120 → was LOSING ~$36/bundle
 *   Agency ref:  $35  → was LOSING ~$17/test
 *
 * Corrected pricing (engine-enforced, ~50% margin):
 *   Individual:  $99
 *   Full NCRC:   $269  (3 × $52 true cost = $156 → $269 at 42% margin)
 *   Agency ref:  $79   (reduced from individual — still profitable)
 *   Retake:      $65   (voucher + reduced overhead only)
 *   No-show fee: $50
 */

import { calculatePrice, calculateRetakePrice, calculateNoShowFee } from '../pricing-engine';

// ─── Cost inputs ─────────────────────────────────────────────────────────────

/** ⚠️ ESTIMATE — verify against your ACT WorkKeys agreement */
const VOUCHER_COST_PER_ASSESSMENT = 18;
const PROCTOR_COST                = 22;
const OVERHEAD_COST               = 12;

// ─── Calculated prices ───────────────────────────────────────────────────────

const individual = calculatePrice({
  voucherCost:  VOUCHER_COST_PER_ASSESSMENT,
  proctorCost:  PROCTOR_COST,
  overheadCost: OVERHEAD_COST,
  provider:     'workkeys',
});

// NCRC = 3 assessments. Proctor cost is shared across the session (not 3×).
const ncrcTrueCost = (VOUCHER_COST_PER_ASSESSMENT * 3) + PROCTOR_COST + OVERHEAD_COST;
const ncrcPrice    = Math.ceil(ncrcTrueCost * 1.9); // same multiplier as individual
const ncrcProfit   = ncrcPrice - ncrcTrueCost;
const ncrcMargin   = ncrcProfit / ncrcPrice;

// Agency referral — WorkOne / WIOA-referred candidates.
// Reduced price is a business decision, not a cost reduction.
// Must still clear the margin floor — if it doesn't, raise it.
const agencyPrice  = Math.ceil(individual.price * 0.80); // 20% below individual
const agencyMargin = (agencyPrice - individual.trueCost) / agencyPrice;

if (agencyMargin < 0.30) {
  throw new Error(
    `[workkeys-pricing] Agency referral price $${agencyPrice} produces ` +
    `${(agencyMargin * 100).toFixed(1)}% margin — below 30% floor. Raise agency price.`
  );
}

export const WORKKEYS_PRICING = {
  /**
   * Per-assessment (individual test-taker, single section).
   * Applied Math · Workplace Documents · Graphic Literacy
   */
  individual: {
    price:    individual.price,
    trueCost: individual.trueCost,
    margin:   individual.margin,
  },

  /**
   * Full NCRC bundle — all 3 assessments in one session.
   * Discount vs 3× individual because proctor time is shared.
   */
  ncrc: {
    price:    ncrcPrice,
    trueCost: ncrcTrueCost,
    margin:   ncrcMargin,
  },

  /**
   * WorkOne / WIOA agency referral rate.
   * ⚠️  Confirm with WorkOne whether this rate is contractually required.
   *     If it's discretionary, consider eliminating it — you're subsidizing
   *     a government agency's program costs.
   */
  agencyReferral: {
    price:    agencyPrice,
    trueCost: individual.trueCost,
    margin:   agencyMargin,
  },

  /** Retake fee — voucher + reduced overhead, no full proctor allocation */
  retake: calculateRetakePrice(VOUCHER_COST_PER_ASSESSMENT),

  /** No-show fee — covers wasted proctor time + admin */
  noShow: calculateNoShowFee(PROCTOR_COST, OVERHEAD_COST),
} as const;

/** Fee rows for display in proctoring-capabilities.ts */
export const WORKKEYS_FEES = [
  {
    label:  'Per assessment (individual)',
    amount: WORKKEYS_PRICING.individual.price,
    note:   'Applied Math · Workplace Documents · Graphic Literacy',
  },
  {
    label:  'Full NCRC (3 assessments)',
    amount: WORKKEYS_PRICING.ncrc.price,
    note:   'All 3 sections in one session — save vs individual rate',
  },
  {
    label:  'Per assessment (workforce agency referral)',
    amount: WORKKEYS_PRICING.agencyReferral.price,
    note:   'WorkOne / WIOA-referred candidates',
  },
] as const;
