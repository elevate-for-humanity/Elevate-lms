/**
 * EPA Section 608 (ESCO Institute) pricing for Elevate Testing Center.
 *
 * Elevate is an authorized proctor site for both ESCO Group and
 * Mainstream Engineering. EPA 608 is IN_PERSON_ONLY by federal regulation —
 * remote proctoring is not permitted under the Clean Air Act.
 *
 * ⚠️  VERIFY BEFORE LAUNCH: ESCO proctor site fee per candidate.
 *     ESCO charges authorized sites a per-candidate fee, not a voucher.
 *     Typical range: $8–$15 per candidate depending on your agreement.
 *     Check your ESCO proctor site agreement and update ESCO_FEE below.
 *
 * Cost structure per seat:
 *   ESCO proctor fee:  $12   ← ⚠️ ESTIMATE — verify against your ESCO agreement
 *   Proctor time:      $20   ← 45-min session
 *   Overhead:          $10
 *   ─────────────────────────
 *   True cost/seat:    $42
 *
 * Previous pricing:
 *   Universal (all 4 sections): $55 → ~24% margin. Thin.
 *   Single section:             $35 → ~17% margin. Barely covers costs.
 *
 * Corrected pricing (~45% margin):
 *   Universal: $76
 *   Single:    $50
 *
 * Note: EPA 608 is a high-volume, low-complexity exam. The volume justifies
 * a slightly lower margin target (40% floor) vs other providers.
 */

import { calculatePrice, calculateRetakePrice, calculateNoShowFee } from '../pricing-engine';

// ─── Cost inputs ─────────────────────────────────────────────────────────────

/** ⚠️ ESTIMATE — verify against your ESCO Group proctor site agreement */
const ESCO_FEE_PER_CANDIDATE = 12;
const PROCTOR_COST            = 20;
const OVERHEAD_COST           = 10;

// ─── Calculated prices ───────────────────────────────────────────────────────

const singleSection = calculatePrice({
  voucherCost:  ESCO_FEE_PER_CANDIDATE,
  proctorCost:  PROCTOR_COST,
  overheadCost: OVERHEAD_COST,
  provider:     'esco',
});

// Universal = all 4 sections in one sitting.
// ESCO fee is per-candidate (not per-section), so voucher cost doesn't multiply.
// Proctor time is longer (~90 min) — bump proctor allocation.
const universalProctor = 30; // longer session
const universalPriced  = calculatePrice({
  voucherCost:  ESCO_FEE_PER_CANDIDATE,
  proctorCost:  universalProctor,
  overheadCost: OVERHEAD_COST,
  provider:     'esco',
});

export const EPA608_PRICING = {
  /** Single section (Core, Type I, II, or III) */
  singleSection: {
    price:    singleSection.price,
    trueCost: singleSection.trueCost,
    margin:   singleSection.margin,
  },

  /** Universal — all 4 sections in one sitting */
  universal: {
    price:    universalPriced.price,
    trueCost: universalPriced.trueCost,
    margin:   universalPriced.margin,
  },

  /** Retake fee — ESCO fee still applies on retake */
  retake:  calculateRetakePrice(ESCO_FEE_PER_CANDIDATE),

  /** No-show fee */
  noShow:  calculateNoShowFee(PROCTOR_COST, OVERHEAD_COST),
} as const;

// ─── Fee rows for proctoring-capabilities.ts ─────────────────────────────────

export const EPA608_FEES = [
  {
    label:  'Universal (all sections)',
    amount: EPA608_PRICING.universal.price,
    note:   'Core + Type I + Type II + Type III — includes exam fee + proctoring',
  },
  {
    label:  'Single section',
    amount: EPA608_PRICING.singleSection.price,
    note:   'Core, Type I, Type II, or Type III — includes exam fee + proctoring',
  },
] as const;

// ─── Mainstream EPATest online pricing ───────────────────────────────────────
//
// Separate from in-person proctoring above. Mainstream Engineering's EPATest
// platform delivers EPA 608 online with vendor-level unlimited retakes.
// Elevate sells enrollment bundles; candidate takes the exam via EPATest.
//
// Partner status: PENDING — do not show online enrollment publicly until
// getActiveEpaPartner() returns non-null (proctor ID issued).
//
// Retail targets are explicit — the formula multipliers in the prompt produce
// wrong numbers. Margins verified below.
//
// Product          Vendor base  Retail  Profit   Margin
// ─────────────────────────────────────────────────────
// Online exam      $26.51       $59     $32.49   55.1%
// Paper exam       $31.82       $69     $37.18   53.9%
// Reference manual $31.82       $69     $37.18   53.9%
// Basic bundle     $26.51       $129    $102.49  79.4%  ← lead offer
// Premium bundle   $58.33       $189    $130.67  69.1%  ← upsell
// Retake admin fee $26.51       $49     $22.49   45.9%

import type { EpaProduct, EpaProgram } from '@/types/epa';

export const EPA608_ONLINE_PRODUCTS: EpaProduct[] = [
  {
    key:         'bundle_basic',
    label:       'EPA 608 Basic Enrollment',
    vendorBase:  26.51,
    type:        'bundle_basic',
    retailPrice: 135, // was $129 + 5%
    description: 'Online exam access + scheduling support + learner support. Vendor study kit included at no charge.',
  },
  {
    key:         'bundle_premium',
    label:       'EPA 608 Premium Enrollment',
    vendorBase:  58.33,
    type:        'bundle_premium',
    retailPrice: 198, // was $189 + 5%
    description: 'Online exam + reference manual + scheduling support + learner support.',
  },
  {
    key:         'online_exam',
    label:       'EPA 608 Online Exam Only',
    vendorBase:  26.51,
    type:        'online_exam',
    retailPrice: 62, // was $59 + 5%
    description: 'Online exam via EPATest platform. Unlimited vendor-level retakes included.',
  },
  {
    key:         'paper_exam',
    label:       'EPA 608 Paper Exam',
    vendorBase:  31.82,
    type:        'paper_exam',
    retailPrice: 72, // was $69 + 5%
    description: 'Paper-based exam option.',
  },
  {
    key:         'reference_manual',
    label:       'EPA 608 Reference Manual',
    vendorBase:  31.82,
    type:        'reference_manual',
    retailPrice: 72, // was $69 + 5%
    description: 'Optional 200+ page reference manual.',
  },
  {
    key:         'retake_admin',
    label:       'EPA 608 Administrative Retake Fee',
    vendorBase:  26.51,
    type:        'retake',
    retailPrice: 51, // was $49 + 5%
    description: 'Administrative support fee for Elevate-managed retake workflow.',
  },
];

export const EPA608_ONLINE_PROGRAM: EpaProgram = {
  key:   'epa_608_universal',
  label: 'EPA 608 Universal Certification',
  shortDescription:
    'Certification for HVAC technicians handling refrigerants. Includes exam pathway options for learners entering heating, ventilation, air conditioning, and refrigeration work.',
  featured:  true,
  products:  EPA608_ONLINE_PRODUCTS,
};

/**
 * Returns the retail price for an online EPA product.
 * All prices are explicit — do not compute from a multiplier.
 */
export function getEpaOnlineRetailPrice(productKey: string): number | null {
  const product = EPA608_ONLINE_PRODUCTS.find(p => p.key === productKey);
  return product?.retailPrice ?? null;
}

/** The primary offer — lead with this, not the bare exam price */
export const EPA608_LEAD_OFFER = EPA608_ONLINE_PRODUCTS.find(p => p.key === 'bundle_basic')!;

/** The upsell offer */
export const EPA608_UPSELL_OFFER = EPA608_ONLINE_PRODUCTS.find(p => p.key === 'bundle_premium')!;
