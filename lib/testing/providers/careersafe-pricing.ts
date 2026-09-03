/**
 * OSHA Outreach Training pricing for Elevate Testing Center.
 *
 * Delivered online via CareerSafe (DOL-authorized OSHA Outreach Training provider).
 * The CareerSafe brand is NOT shown publicly — display as "OSHA Outreach Training."
 *
 * ⚠️  VERIFY BEFORE LAUNCH: Course license cost per student.
 *     CareerSafe charges authorized providers a per-student course license.
 *     Typical range: $18–$25 for OSHA 10, $45–$65 for OSHA 30.
 *     Check your CareerSafe provider agreement and update VOUCHER_COST_* below.
 *
 * Cost structure:
 *   OSHA 10: course license $22 + delivery $10 + overhead $8 = $40 true cost
 *   OSHA 30: course license $60 + delivery $18 + overhead $10 = $88 true cost
 *
 * Online delivery — no physical proctor cost. "Delivery cost" covers
 * enrollment setup, LMS access coordination, and admin support.
 */

import { calculatePrice, calculateRetakePrice, calculateNoShowFee } from '../pricing-engine';

// ─── OSHA 10 ──────────────────────────────────────────────────────────────────

/** ⚠️ ESTIMATE — verify against your CareerSafe provider agreement */
const OSHA10_COURSE_COST = 22;
const OSHA10_DELIVERY = 10;
const OSHA10_OVERHEAD = 8;

const osha10 = calculatePrice({
  voucherCost: OSHA10_COURSE_COST,
  proctorCost: OSHA10_DELIVERY,
  overheadCost: OSHA10_OVERHEAD,
  provider: 'careersafe',
});

// ─── OSHA 30 ──────────────────────────────────────────────────────────────────

/** ⚠️ ESTIMATE — verify against your CareerSafe provider agreement */
const OSHA30_COURSE_COST = 60;
const OSHA30_DELIVERY = 18;
const OSHA30_OVERHEAD = 10;

const osha30 = calculatePrice({
  voucherCost: OSHA30_COURSE_COST,
  proctorCost: OSHA30_DELIVERY,
  overheadCost: OSHA30_OVERHEAD,
  provider: 'careersafe',
});

// ─── Exports ──────────────────────────────────────────────────────────────────

export const CAREERSAFE_PRICING = {
  osha10: {
    price: osha10.price,
    trueCost: osha10.trueCost,
    margin: osha10.margin,
  },
  osha30: {
    price: osha30.price,
    trueCost: osha30.trueCost,
    margin: osha30.margin,
  },
  noShow: calculateNoShowFee(OSHA10_DELIVERY, OSHA10_OVERHEAD),
} as const;

/** Fee rows for proctoring-capabilities.ts */
export const CAREERSAFE_FEES = [
  {
    label: 'OSHA 10-Hour',
    amount: CAREERSAFE_PRICING.osha10.price,
    note: 'Includes course + DOL wallet card',
  },
  {
    label: 'OSHA 30-Hour',
    amount: CAREERSAFE_PRICING.osha30.price,
    note: 'Includes course + DOL wallet card',
  },
] as const;
