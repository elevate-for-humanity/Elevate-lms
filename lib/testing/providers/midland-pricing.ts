/**
 * Midland Testing pricing for Elevate Testing Center.
 *
 * Elevate is an authorized Midland testing site for HVAC/R trade certifications.
 *
 * ⚠️  VERIFY BEFORE LAUNCH: Midland per-candidate exam fee.
 *     Check your Midland Testing authorized site agreement and update
 *     VOUCHER_COST_CORE and VOUCHER_COST_SPECIALTY below.
 *
 * Cost structure per seat:
 *   Core assessment:      voucher $20 + proctor $20 + overhead $10 = $50 true cost
 *   Specialty track:      voucher $25 + proctor $20 + overhead $10 = $55 true cost
 */

import { calculatePrice, calculateRetakePrice, calculateNoShowFee } from '../pricing-engine';

// ─── Cost inputs ──────────────────────────────────────────────────────────────

/** ⚠️ ESTIMATE — verify against your Midland Testing authorized site agreement */
const VOUCHER_COST_CORE = 20;
/** ⚠️ ESTIMATE — verify against your Midland Testing authorized site agreement */
const VOUCHER_COST_SPECIALTY = 25;
const PROCTOR_COST = 20;
const OVERHEAD_COST = 10;

// ─── Calculated prices ────────────────────────────────────────────────────────

const core = calculatePrice({
  voucherCost: VOUCHER_COST_CORE,
  proctorCost: PROCTOR_COST,
  overheadCost: OVERHEAD_COST,
  provider: 'midland',
});

const specialty = calculatePrice({
  voucherCost: VOUCHER_COST_SPECIALTY,
  proctorCost: PROCTOR_COST,
  overheadCost: OVERHEAD_COST,
  provider: 'midland',
});

// ─── Exports ──────────────────────────────────────────────────────────────────

export const MIDLAND_PRICING = {
  core: {
    price: core.price,
    trueCost: core.trueCost,
    margin: core.margin,
  },
  specialty: {
    price: specialty.price,
    trueCost: specialty.trueCost,
    margin: specialty.margin,
  },
  retake: calculateRetakePrice(VOUCHER_COST_CORE),
  noShow: calculateNoShowFee(PROCTOR_COST, OVERHEAD_COST),
} as const;

/** Fee rows for proctoring-capabilities.ts */
export const MIDLAND_FEES = [
  {
    label: 'Core assessment',
    amount: MIDLAND_PRICING.core.price,
    note: 'Includes exam + Midland registration',
  },
  {
    label: 'Specialty track assessment',
    amount: MIDLAND_PRICING.specialty.price,
    note: 'Includes exam + Midland registration',
  },
] as const;
