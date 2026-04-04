/**
 * Program pricing configuration — single source of truth for all programs.
 *
 * Programs with fundingEligible=true can be enrolled at $0 through WIOA/WRG.
 * Self-pay students see the fullPrice and payment plan options.
 *
 * NHA exam fees and per-learner material costs: see lib/nha/pricing.ts.
 * The fullPrice here is the tuition charged to the student, which may or may
 * not include NHA materials depending on the program structure.
 */

export interface ProgramPricing {
  slug: string;
  name: string;
  fullPrice: number;
  fundingEligible: boolean;
  /** Deposit amount for payment plan (typically 35% of full price) */
  depositAmount: number;
  /** Duration in weeks */
  durationWeeks: number;
  /** Number of credentials earned */
  credentialCount: number;
  /** Funding sources that cover this program */
  fundingSources: string[];
  /**
   * NHA per-learner cost (materials + exam) passed through to student.
   * Sourced from lib/nha/pricing.ts. Null if not an NHA program.
   */
  nhaCostPerLearner?: number;
  /** NHA exam fee only (subset of nhaCostPerLearner). */
  nhaExamFee?: number;
}

export const PROGRAM_PRICING: Record<string, ProgramPricing> = {
  'hvac-technician': {
    slug: 'hvac-technician',
    name: 'HVAC Technician',
    fullPrice: 5000,
    fundingEligible: true,
    depositAmount: 1750,
    durationWeeks: 20,
    credentialCount: 6,
    fundingSources: ['Workforce Ready Grant', 'WIOA', 'WRG'],
  },
  'barber-apprenticeship': {
    slug: 'barber-apprenticeship',
    name: 'Barber Apprenticeship',
    fullPrice: 4980,
    fundingEligible: false,
    depositAmount: 1743,
    durationWeeks: 50,
    credentialCount: 1,
    fundingSources: [],
  },
  'cna-certification': {
    slug: 'cna-certification',
    name: 'CNA (Certified Nursing Assistant)',
    fullPrice: 1200,
    fundingEligible: true,
    depositAmount: 420,
    durationWeeks: 6,
    credentialCount: 1,
    fundingSources: ['Workforce Ready Grant', 'WIOA'],
  },
  'cdl-training': {
    slug: 'cdl-training',
    name: 'CDL (Commercial Driver License)',
    fullPrice: 5500,
    fundingEligible: true,
    depositAmount: 1925,
    durationWeeks: 4,
    credentialCount: 1,
    fundingSources: ['Workforce Ready Grant', 'WIOA'],
  },
  'phlebotomy-technician': {
    slug: 'phlebotomy-technician',
    name: 'Phlebotomy Technician',
    fullPrice: 1500,
    fundingEligible: true,
    depositAmount: 525,
    durationWeeks: 8,
    credentialCount: 1,
    fundingSources: ['Workforce Ready Grant', 'WIOA'],
  },
  'medical-assistant': {
    slug: 'medical-assistant',
    name: 'Medical Assistant',
    fullPrice: 3000,
    fundingEligible: true,
    depositAmount: 1050,
    durationWeeks: 16,
    credentialCount: 2,
    fundingSources: ['Workforce Ready Grant', 'WIOA'],
  },
};

/**
 * Get pricing for a program by slug. Returns null if not found.
 */
export function getProgramPricing(slug: string): ProgramPricing | null {
  return PROGRAM_PRICING[slug] || null;
}
