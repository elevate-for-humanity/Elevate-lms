/**
 * Types for the NHA training partner agreement.
 *
 * PaymentResponsibility describes who pays NHA for each cost component:
 *   institution — Elevate pays NHA upfront; cost is recovered in the bundle price
 *   candidate   — student pays directly (retakes only)
 *   split       — shared cost (not currently used in the NHA agreement)
 *
 * This is agreement metadata, not checkout logic. The checkout system reads
 * bundle retail prices from nha-pricing.ts. Retake enforcement is handled
 * by the testing_enforcement table and /api/testing/retake.
 */

export type PaymentResponsibility = 'institution' | 'candidate' | 'split';

export type ExamDelivery = 'online' | 'in_person' | 'hybrid';

export interface NhaProgramAgreement {
  /** Matches the key in NHA_PROGRAMS in nha-pricing.ts */
  key:                  string;
  label:                string;
  /** Credential abbreviation, e.g. "CCMA", "CPT" */
  credential:           string;
  pathway:              'training_program';
  /** Who pays NHA for prep materials */
  prepMaterialPayment:  PaymentResponsibility;
  examDelivery:         ExamDelivery;
  /** Who pays NHA for the first exam attempt */
  examAttemptPayment:   PaymentResponsibility;
  /** Who pays NHA for retakes — always candidate per the agreement */
  retakePayment:        PaymentResponsibility;
  /** Notes visible in admin only */
  adminNotes?:          string;
}

/** Enriched view used in admin and checkout — agreement + live pricing */
export interface NhaProgramWithPricing extends NhaProgramAgreement {
  /** Retail bundle price charged to student/funder (from nha-pricing.ts) */
  bundleRetailPrice:    number | null;
  /** Retake fee charged to candidate if they fail (from nha-pricing.ts) */
  retakeFee:            number;
  /** Gross margin on the bundle (retail - vendor base) / retail */
  bundleMargin:         number | null;
}
