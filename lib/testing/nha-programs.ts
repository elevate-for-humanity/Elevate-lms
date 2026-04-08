/**
 * NHA training partner agreement data.
 *
 * Encodes who pays NHA for each cost component per the agreement:
 *   institution — Elevate pays NHA upfront; recovered in the bundle price
 *   candidate   — student pays directly (retakes only)
 *
 * This is NOT checkout logic. It is agreement metadata used by:
 *   - Admin views (margin, payment breakdown)
 *   - Program detail pages (payment structure display)
 *   - Retake enforcement (candidate pays retake, not institution)
 *
 * Checkout reads retail prices from nha-pricing.ts.
 * Retake enforcement uses /api/testing/retake + testing_enforcement table.
 *
 * Key mapping to nha-pricing.ts NHA_PROGRAMS:
 *   billing_coding       → billingAndCoding
 *   medical_assistant    → medicalAssistant
 *   ehr                  → electronicHealthRecords
 *   ekg                  → ekgTechnician
 *   medical_admin        → medicalAdminAssistant
 *   patient_care         → patientCareTechnician
 *   pharmacy             → pharmacyTechnician
 *   phlebotomy           → phlebotomy
 */

import type { NhaProgramAgreement, NhaProgramWithPricing } from '@/types/nha';
import {
  NHA_PROGRAMS,
  getBundleRetailPrice,
  markupPrice,
} from './nha-pricing';

// ─── Agreement data ───────────────────────────────────────────────────────────

export const NHA_PROGRAM_AGREEMENTS: NhaProgramAgreement[] = [
  {
    key:                 'medical_assistant',
    label:               'Medical Assistant',
    credential:          'CCMA',
    pathway:             'training_program',
    prepMaterialPayment: 'institution',
    examDelivery:        'online',
    examAttemptPayment:  'institution',
    retakePayment:       'candidate',
    adminNotes:          'Highest-demand program. Lead with this. Bundle base $704.80.',
  },
  {
    key:                 'pharmacy',
    label:               'Pharmacy Technician',
    credential:          'ExCPT',
    pathway:             'training_program',
    prepMaterialPayment: 'institution',
    examDelivery:        'online',
    examAttemptPayment:  'institution',
    retakePayment:       'candidate',
    adminNotes:          'PharmaSeer is the differentiator — include in bundle pitch.',
  },
  {
    key:                 'phlebotomy',
    label:               'Phlebotomy Technician',
    credential:          'CPT',
    pathway:             'training_program',
    prepMaterialPayment: 'institution',
    examDelivery:        'online',
    examAttemptPayment:  'institution',
    retakePayment:       'candidate',
  },
  {
    key:                 'billing_coding',
    label:               'Billing and Coding',
    credential:          'CBCS',
    pathway:             'training_program',
    prepMaterialPayment: 'institution',
    examDelivery:        'online',
    examAttemptPayment:  'institution',
    retakePayment:       'candidate',
  },
  {
    key:                 'patient_care',
    label:               'Patient Care Technician',
    credential:          'CPCT/A',
    pathway:             'training_program',
    prepMaterialPayment: 'institution',
    examDelivery:        'online',
    examAttemptPayment:  'institution',
    retakePayment:       'candidate',
  },
  {
    key:                 'medical_admin',
    label:               'Medical Administrative Assistant',
    credential:          'CMAA',
    pathway:             'training_program',
    prepMaterialPayment: 'institution',
    examDelivery:        'online',
    examAttemptPayment:  'institution',
    retakePayment:       'candidate',
  },
  {
    key:                 'ehr',
    label:               'Electronic Health Records',
    credential:          'CEHRS',
    pathway:             'training_program',
    prepMaterialPayment: 'institution',
    examDelivery:        'online',
    examAttemptPayment:  'institution',
    retakePayment:       'candidate',
  },
  {
    key:                 'ekg',
    label:               'EKG Technician',
    credential:          'CET',
    pathway:             'training_program',
    prepMaterialPayment: 'institution',
    examDelivery:        'online',
    examAttemptPayment:  'institution',
    retakePayment:       'candidate',
  },
];

// ─── Key mapping ──────────────────────────────────────────────────────────────

/**
 * Maps agreement keys (snake_case) to nha-pricing.ts program keys (camelCase).
 * Keeps the two files independently maintainable.
 */
const AGREEMENT_TO_PRICING_KEY: Record<string, keyof typeof NHA_PROGRAMS> = {
  medical_assistant: 'medicalAssistant',
  pharmacy:          'pharmacyTechnician',
  phlebotomy:        'phlebotomy',
  billing_coding:    'billingAndCoding',
  patient_care:      'patientCareTechnician',
  medical_admin:     'medicalAdminAssistant',
  ehr:               'electronicHealthRecords',
  ekg:               'ekgTechnician',
};

// ─── Pricing bridge ───────────────────────────────────────────────────────────

/**
 * Returns the cert exam vendor base cost for a program.
 * Used to calculate the retake fee (candidate responsibility).
 * Cert exam is always the product with key 'certificationExam'.
 */
function getCertExamVendorBase(pricingKey: keyof typeof NHA_PROGRAMS): number {
  const program = NHA_PROGRAMS[pricingKey];
  const certProduct = program.products.find(p => p.key === 'certificationExam');
  return certProduct?.vendorBase ?? 129; // $129 is the standard NHA cert exam cost
}

/**
 * Returns the retake fee for a program.
 * Retake = cert exam vendor base × 1.5, rounded to $X9.
 * Candidate pays this directly — it is never included in the bundle.
 */
function getRetakeFee(pricingKey: keyof typeof NHA_PROGRAMS): number {
  const certBase = getCertExamVendorBase(pricingKey);
  // Retake overhead is lower than a full session — just the exam cost + small admin fee
  const retakeCost = certBase + 10;
  return markupPrice(retakeCost * (1.5 / 1.3), 'bundle'); // ~1.5× cert cost, rounded to $X9
}

/**
 * Returns agreement data enriched with live retail pricing and margin.
 * Use this in admin views and checkout logic.
 *
 * All prices come from nha-pricing.ts — this function is the single bridge
 * between agreement metadata and the pricing engine.
 */
export function getProgramWithPricing(agreementKey: string): NhaProgramWithPricing | null {
  const agreement  = NHA_PROGRAM_AGREEMENTS.find(p => p.key === agreementKey);
  if (!agreement) return null;

  const pricingKey = AGREEMENT_TO_PRICING_KEY[agreementKey];
  if (!pricingKey) return null;

  const program          = NHA_PROGRAMS[pricingKey];
  const bundleRetail     = getBundleRetailPrice(program);
  const retakeFee        = getRetakeFee(pricingKey);
  const vendorBase       = program.bundledDiscountedBase ?? null;
  const bundleMargin     = bundleRetail != null && vendorBase != null
    ? (bundleRetail - vendorBase) / bundleRetail
    : null;

  return {
    ...agreement,
    bundleRetailPrice: bundleRetail,
    retakeFee,
    bundleMargin,
  };
}

/**
 * Returns all programs enriched with pricing, in lead-first order.
 * Use this for admin dashboards and full catalog views.
 */
export function getAllProgramsWithPricing(): NhaProgramWithPricing[] {
  return NHA_PROGRAM_AGREEMENTS
    .map(a => getProgramWithPricing(a.key))
    .filter((p): p is NhaProgramWithPricing => p !== null);
}

// ─── Checkout rules ───────────────────────────────────────────────────────────

/**
 * Returns the amount to charge at checkout for a program enrollment.
 * Always the bundle retail price — never individual product prices.
 * Returns null if the program has no bundle (a la carte only).
 */
export function getCheckoutAmount(agreementKey: string): number | null {
  const program = getProgramWithPricing(agreementKey);
  return program?.bundleRetailPrice ?? null;
}

/**
 * Returns the retake fee to charge a candidate who failed their exam.
 * This is always candidate responsibility — never covered by the institution bundle.
 */
export function getRetakeChargeAmount(agreementKey: string): number | null {
  const program = getProgramWithPricing(agreementKey);
  return program?.retakeFee ?? null;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

const RESPONSIBILITY_LABELS: Record<string, string> = {
  institution: 'Institution Paid',
  candidate:   'Candidate Paid',
  split:       'Split',
};

export function formatResponsibility(r: string): string {
  return RESPONSIBILITY_LABELS[r] ?? r;
}
