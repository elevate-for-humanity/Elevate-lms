/**
 * Certiport authorized testing center pricing for Elevate.
 *
 * ⚠️  VERIFY BEFORE LAUNCH: All voucher costs below are estimates based on
 *     publicly available Certiport pricing tiers. Your actual agreement with
 *     Pearson/Certiport may differ. Log into your Certiport account at
 *     certiport.pearsonvue.com → Vouchers to see your contracted rates.
 *     Update each VOUCHER_COST entry and re-run the build — the engine will
 *     throw if any exam drops below the margin floor.
 *
 * Cost structure per seat:
 *   Voucher (Certiport fee): varies by exam — see table below
 *   Proctor time:            $25   ← 60-min session, allocated hourly rate
 *   Overhead:                $15   ← facility + ops + Certiport compliance
 *   ─────────────────────────────────────────────────────────────────────
 *   True cost = voucher + $40 fixed
 *
 * Certiport carries the highest compliance overhead of all your providers:
 *   - Annual authorized center fee
 *   - Pearson audit requirements
 *   - System/software maintenance
 *   - Staff certification requirements
 * This is why the multiplier is 2.1 (vs 1.8–1.9 for other providers).
 *
 * Previous pricing: $65 flat for ALL exams.
 * Problem: CompTIA vouchers alone run $100–$165. You were losing money on
 * every CompTIA exam and barely breaking even on MOS.
 */

import { calculatePrice, calculateRetakePrice, calculateNoShowFee } from '../pricing-engine';

const PROCTOR_COST  = 25;
const OVERHEAD_COST = 15;

function certiportPrice(voucherCost: number) {
  return calculatePrice({ voucherCost, proctorCost: PROCTOR_COST, overheadCost: OVERHEAD_COST, provider: 'certiport' });
}

// ─── Voucher costs by exam family ────────────────────────────────────────────
// ⚠️  All marked ESTIMATE — verify against your Certiport voucher price list.

export const CERTIPORT_EXAMS = {
  /**
   * Microsoft Office Specialist
   * ⚠️  ESTIMATE: $55–$80 depending on your volume tier
   */
  mos: {
    name:        'Microsoft Office Specialist (MOS)',
    voucherCost: 65, // ⚠️ ESTIMATE
    ...certiportPrice(65),
    exams:       ['Word', 'Excel', 'PowerPoint', 'Outlook', 'Access'],
  },

  /**
   * IT Specialist (formerly ITS)
   * ⚠️  ESTIMATE: $55–$75
   */
  its: {
    name:        'IT Specialist',
    voucherCost: 60, // ⚠️ ESTIMATE
    ...certiportPrice(60),
    exams:       ['Python', 'Java', 'HTML & CSS', 'Networking', 'Cybersecurity', 'Databases'],
  },

  /**
   * IC3 Digital Literacy
   * ⚠️  ESTIMATE: $45–$55 — typically the lowest-cost Certiport exam
   */
  ic3: {
    name:        'IC3 Digital Literacy',
    voucherCost: 48, // ⚠️ ESTIMATE
    ...certiportPrice(48),
    exams:       ['Computing Fundamentals', 'Key Applications', 'Living Online'],
  },

  /**
   * Intuit QuickBooks Certified User
   * ⚠️  ESTIMATE: $65–$85
   */
  quickbooks: {
    name:        'Intuit QuickBooks Certified User',
    voucherCost: 70, // ⚠️ ESTIMATE
    ...certiportPrice(70),
    exams:       ['QuickBooks Online', 'QuickBooks Desktop'],
  },

  /**
   * Adobe Certified Professional
   * ⚠️  ESTIMATE: $80–$110
   */
  adobe: {
    name:        'Adobe Certified Professional',
    voucherCost: 90, // ⚠️ ESTIMATE
    ...certiportPrice(90),
    exams:       ['Photoshop', 'Illustrator', 'InDesign', 'Premiere Pro', 'After Effects'],
  },

  /**
   * Entrepreneurship & Small Business (ESB)
   * ⚠️  ESTIMATE: $55–$70
   */
  esb: {
    name:        'Entrepreneurship & Small Business (ESB)',
    voucherCost: 60, // ⚠️ ESTIMATE
    ...certiportPrice(60),
    exams:       ['ESB Certification'],
  },

  /**
   * CompTIA — highest voucher cost in the Certiport catalog.
   * ⚠️  ESTIMATE: $100–$165 depending on exam level.
   *     A+: ~$100, Network+: ~$120, Security+: ~$165
   *     Using $120 as a midpoint — verify your actual rate.
   *     At $65 flat you were losing ~$80/exam on Security+.
   */
  comptia: {
    name:        'CompTIA',
    voucherCost: 120, // ⚠️ ESTIMATE — verify per-exam; Security+ is higher
    ...certiportPrice(120),
    exams:       ['A+', 'Network+', 'Security+'],
  },
} as const;

// ─── Shared enforcement fees ─────────────────────────────────────────────────

/**
 * Retake fee uses the MOS voucher cost as a baseline (most common retake).
 * For CompTIA retakes, charge the CompTIA retake price — see getRetakePrice().
 */
export const CERTIPORT_DEFAULT_RETAKE_FEE = calculateRetakePrice(CERTIPORT_EXAMS.mos.voucherCost);
export const CERTIPORT_NO_SHOW_FEE        = calculateNoShowFee(PROCTOR_COST, OVERHEAD_COST);

/**
 * Returns the retake fee for a specific exam family.
 * Always use this instead of a flat retake fee — CompTIA retakes cost more.
 */
export function getCertiportRetakePrice(examKey: keyof typeof CERTIPORT_EXAMS): number {
  return calculateRetakePrice(CERTIPORT_EXAMS[examKey].voucherCost);
}

// ─── Fee rows for proctoring-capabilities.ts ─────────────────────────────────

/**
 * Single display fee for the booking form.
 * Shows the MOS price as the entry-level anchor; CompTIA is quoted separately.
 * This prevents sticker shock while keeping CompTIA profitable.
 */
export const CERTIPORT_FEES = [
  {
    label:  'Microsoft Office Specialist / IT Specialist / IC3',
    amount: CERTIPORT_EXAMS.mos.price,
    note:   'Includes exam voucher + proctoring',
  },
  {
    label:  'Adobe / QuickBooks / ESB',
    amount: CERTIPORT_EXAMS.adobe.price,
    note:   'Includes exam voucher + proctoring',
  },
  {
    label:  'CompTIA (A+ · Network+ · Security+)',
    amount: CERTIPORT_EXAMS.comptia.price,
    note:   'Includes exam voucher + proctoring — verify your exam tier',
  },
] as const;
