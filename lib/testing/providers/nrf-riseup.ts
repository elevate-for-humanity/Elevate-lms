/**
 * NRF RISE Up pricing for Elevate Testing Center.
 *
 * ⚠️  VERIFY BEFORE LAUNCH: NRF Foundation authorized center voucher cost.
 *     Public NRF rate for test-takers is $13.50–$22 per credential.
 *     Your authorized center agreement may differ — check nrffoundation.org
 *     or your NRF account portal and update VOUCHER_COST below.
 *
 * NRF RISE Up credentials currently offered at Elevate:
 *   - Retail Industry Fundamentals  (entry-level, no proctor required)
 *   - Customer Service & Sales      (proctored)
 *   - Business of Retail            (proctored)
 *
 * NOT offered (not in current NRF catalog as a standalone credential):
 *   - "Supply Chain & Logistics" — does not exist as an NRF RISE Up exam.
 *     Do not add it until NRF officially launches it.
 *
 * Cost structure per seat:
 *   Voucher (NRF fee):  $18   ← ⚠️ ESTIMATE — verify against your NRF agreement
 *   Proctor time:       $20   ← shorter session than Certiport/WorkKeys
 *   Overhead:           $10
 *   ─────────────────────────
 *   True cost/seat:     $48
 *
 * Previous pricing: $45 flat → ~6% margin. Effectively working for free.
 * Corrected pricing: $91 → ~47% margin.
 */

import { calculatePrice, calculateRetakePrice, calculateNoShowFee } from '../pricing-engine';

// ─── Cost inputs ─────────────────────────────────────────────────────────────

/** ⚠️ ESTIMATE — verify against your NRF Foundation authorized center agreement */
const VOUCHER_COST  = 18;
const PROCTOR_COST  = 20;
const OVERHEAD_COST = 10;

// ─── Calculated prices ───────────────────────────────────────────────────────

const priced = calculatePrice({
  voucherCost:  VOUCHER_COST,
  proctorCost:  PROCTOR_COST,
  overheadCost: OVERHEAD_COST,
  provider:     'nrf',
});

export const NRF_RISEUP_PRICING = {
  /**
   * Retail Industry Fundamentals — entry-level, no proctor required.
   * Slightly lower price since no proctor time is allocated.
   */
  retailFundamentals: {
    name:        'Retail Industry Fundamentals',
    proctored:   false,
    duration:    '50 questions, untimed',
    renewal:     'Never expires',
    price:       Math.ceil((VOUCHER_COST + OVERHEAD_COST) * 1.9), // no proctor cost
    trueCost:    VOUCHER_COST + OVERHEAD_COST,
  },

  /**
   * Customer Service & Sales — proctored.
   */
  customerServiceSales: {
    name:      'Customer Service & Sales',
    proctored: true,
    duration:  '75 questions, 90 minutes',
    renewal:   'Every 3 years',
    price:     priced.price,
    trueCost:  priced.trueCost,
    margin:    priced.margin,
  },

  /**
   * Business of Retail — proctored.
   */
  businessOfRetail: {
    name:      'Business of Retail',
    proctored: true,
    duration:  '75 questions, 90 minutes',
    renewal:   'Every 3 years',
    price:     priced.price,
    trueCost:  priced.trueCost,
    margin:    priced.margin,
  },

  /** Retake fee */
  retake:  calculateRetakePrice(VOUCHER_COST),

  /** No-show fee */
  noShow:  calculateNoShowFee(PROCTOR_COST, OVERHEAD_COST),
} as const;

// ─── Fee rows for proctoring-capabilities.ts ─────────────────────────────────

export const NRF_FEES = [
  {
    label:  'Per credential exam',
    amount: NRF_RISEUP_PRICING.customerServiceSales.price,
    note:   'Includes exam fee + proctoring',
  },
] as const;
