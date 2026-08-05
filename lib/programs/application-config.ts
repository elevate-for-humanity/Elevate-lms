/**
 * lib/programs/application-config.ts
 *
 * Central configuration for all student application flows.
 * Determines which form engine handles each program and carries
 * program-specific application metadata (funding options, pricing, CTAs).
 *
 * HOW TO ADD A NEW PROGRAM:
 * 1. Add to this config with the correct formEngine.
 * 2. formEngine 'canonical'  → rendered by /apply/student (preferred).
 * 3. formEngine 'dedicated'  → keeps its static page under app/programs/<slug>/apply.
 * 4. formEngine 'external'   → redirect to an external URL.
 *
 * Do NOT add per-program page files for programs that use 'canonical'.
 */

export type ApplicationFormEngine = 'canonical' | 'dedicated' | 'external';

/** Funding types available for a program */
export type FundingType =
  | 'wioa'         // WIOA / WorkOne — free for eligible Indiana residents
  | 'employer'      // Employer or workforce grant sponsored
  | 'self_pay'      // Out of pocket — full or deposit + payment plan
  | 'unsure'        // Not sure yet — intake call will help determine
  | 'scholarship'   // Other grant / scholarship
  | 'payment_plan'; // BNPL or internal payment arrangement

export interface ProgramFundingOptions {
  /** Which funding types are available for this program */
  available: FundingType[];
  /** WIOA eligibility flow is shown for this program */
  supportsWioa: boolean;
  /** BNPL / payment-plan checkout is available */
  supportsBnpl: boolean;
  /** Deposit amount in cents (for self-pay programs) */
  depositCents?: number;
  /** Full tuition in cents */
  fullTuitionCents?: number;
  /** Stripe payment link — deposit */
  stripeDepositLink?: string;
  /** Stripe payment link — full */
  stripeFullLink?: string;
}

export interface ProgramApplicationConfig {
  /** URL slug — matches the directory name */
  slug: string;
  /** Display name */
  name: string;
  /** Short name for badges / headings */
  shortName: string;
  /** Which form engine handles applications for this program */
  formEngine: ApplicationFormEngine;
  /** Path to the form page (for 'dedicated') or redirect target (for 'external') */
  formPath?: string;
  /** Program-specific funding options */
  funding: ProgramFundingOptions;
  /** Tailwind color token e.g. "blue", "purple", "rose" */
  color: string;
  /** Redirect to this URL after submission (canonical form reads this for success redirect) */
  successRedirect?: string;
}

const ALL_PROGRAMS: Record<string, ProgramApplicationConfig> = {
  // ─── BEAUTY / APPRENTICESHIP ─────────────────────────────────────────────
  // These have dedicated static flows with complex apprenticeship + payment logic.
  // They remain 'dedicated' but their success pages now redirect to /apply/confirmation.
  'barber-apprenticeship': {
    slug: 'barber-apprenticeship',
    name: 'Barber Apprenticeship',
    shortName: 'Barber',
    formEngine: 'dedicated',
    formPath: '/programs/barber-apprenticeship/apply',
    color: 'blue',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
      depositCents: 210000,
      fullTuitionCents: 600000,
      stripeDepositLink: 'https://buy.stripe.com/fZu00j2UUdnofsDcfDgIo0a',
      stripeFullLink: 'https://buy.stripe.com/9B600jbrq1EGdkvgvTgIo09',
    },
  },
  'cosmetology-apprenticeship': {
    slug: 'cosmetology-apprenticeship',
    name: 'Cosmetology Apprenticeship',
    shortName: 'Cosmetology',
    formEngine: 'dedicated',
    formPath: '/programs/cosmetology-apprenticeship/apply',
    color: 'purple',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
      depositCents: 210000,
      fullTuitionCents: 600000,
      stripeDepositLink: 'https://buy.stripe.com/fZu00j2UUdnofsDcfDgIo0a',
      stripeFullLink: 'https://buy.stripe.com/9B600jbrq1EGdkvgvTgIo09',
    },
  },
  'esthetician': {
    slug: 'esthetician',
    name: 'Esthetician Program',
    shortName: 'Esthetician',
    formEngine: 'dedicated',
    formPath: '/programs/esthetician/apply',
    color: 'pink',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
      depositCents: 112000,
      fullTuitionCents: 320000,
      stripeDepositLink: 'https://buy.stripe.com/cNicN52UU4QS4NZ1AZgIo06',
      stripeFullLink: 'https://buy.stripe.com/bJedR91QQgzAfsD0wVgIo05',
    },
  },
  'nail-technician-apprenticeship': {
    slug: 'nail-technician-apprenticeship',
    name: 'Nail Technician Apprenticeship',
    shortName: 'Nail Tech',
    formEngine: 'dedicated',
    formPath: '/programs/nail-technician-apprenticeship/apply',
    color: 'rose',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
      depositCents: 175000,
      fullTuitionCents: 500000,
      stripeDepositLink: 'https://buy.stripe.com/cNicN52UU4QS4NZ1AZgIo06',
      stripeFullLink: 'https://buy.stripe.com/bJedR91QQgzAfsD0wVgIo05',
    },
  },

  // ─── TRADES ────────────────────────────────────────────────────────────────
  'hvac-technician': {
    slug: 'hvac-technician',
    name: 'HVAC Technician',
    shortName: 'HVAC',
    formEngine: 'dedicated',
    formPath: '/programs/hvac-technician/apply',
    color: 'emerald',
    funding: {
      available: ['self_pay', 'employer', 'scholarship', 'unsure'],
      supportsWioa: false,
      supportsBnpl: true,
    },
  },
  'peer-recovery-specialist': {
    slug: 'peer-recovery-specialist',
    name: 'Peer Recovery Specialist',
    shortName: 'Peer Recovery',
    formEngine: 'dedicated',
    formPath: '/programs/peer-recovery-specialist/apply',
    color: 'teal',
    funding: {
      available: ['self_pay', 'employer', 'scholarship', 'unsure'],
      supportsWioa: false,
      supportsBnpl: false,
    },
  },

  // ─── HEALTHCARE ────────────────────────────────────────────────────────────
  // Use canonical /apply/student with program preselection
  'cna': {
    slug: 'cna',
    name: 'Certified Nursing Assistant (CNA)',
    shortName: 'CNA',
    formEngine: 'canonical',
    color: 'blue',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
    },
  },
  'phlebotomy': {
    slug: 'phlebotomy',
    name: 'Phlebotomy Technician',
    shortName: 'Phlebotomy',
    formEngine: 'canonical',
    color: 'blue',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
    },
  },
  'medical-assistant': {
    slug: 'medical-assistant',
    name: 'Medical Assistant',
    shortName: 'Med Assistant',
    formEngine: 'canonical',
    color: 'blue',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
    },
  },
  'qma': {
    slug: 'qma',
    name: 'Qualified Medication Aide (QMA)',
    shortName: 'QMA',
    formEngine: 'canonical',
    color: 'blue',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
    },
  },
  'billing-coding': {
    slug: 'billing-coding',
    name: 'Medical Billing & Coding',
    shortName: 'Billing & Coding',
    formEngine: 'canonical',
    color: 'blue',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
    },
  },
  'patient-care-technician': {
    slug: 'patient-care-technician',
    name: 'Patient Care Technician',
    shortName: 'PCT',
    formEngine: 'canonical',
    color: 'blue',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
    },
  },
  'ehr-specialist': {
    slug: 'ehr-specialist',
    name: 'EHR Specialist',
    shortName: 'EHR Specialist',
    formEngine: 'canonical',
    color: 'blue',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
    },
  },
  'pharmacy-tech': {
    slug: 'pharmacy-tech',
    name: 'Pharmacy Technician',
    shortName: 'Pharmacy Tech',
    formEngine: 'canonical',
    color: 'blue',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
    },
  },
  'dental-assistant': {
    slug: 'dental-assistant',
    name: 'Dental Assistant',
    shortName: 'Dental Asst',
    formEngine: 'canonical',
    color: 'blue',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
    },
  },

  // ─── IT ───────────────────────────────────────────────────────────────────
  'it-help-desk': {
    slug: 'it-help-desk',
    name: 'IT Help Desk Specialist',
    shortName: 'IT Help Desk',
    formEngine: 'canonical',
    color: 'slate',
    funding: {
      available: ['wioa', 'employer', 'self_pay', 'unsure'],
      supportsWioa: true,
      supportsBnpl: false,
    },
  },

  // ─── HOSPITALITY ─────────────────────────────────────────────────────────
  'food-safety-handler': {
    slug: 'food-safety-handler',
    name: 'Food Safety Handler',
    shortName: 'Food Safety',
    formEngine: 'canonical',
    color: 'amber',
    funding: {
      available: ['self_pay', 'employer', 'unsure'],
      supportsWioa: false,
      supportsBnpl: false,
    },
  },
  'servsafe-alcohol': {
    slug: 'servsafe-alcohol',
    name: 'ServSafe Alcohol Certification',
    shortName: 'ServSafe Alcohol',
    formEngine: 'canonical',
    color: 'amber',
    funding: {
      available: ['self_pay', 'employer', 'unsure'],
      supportsWioa: false,
      supportsBnpl: false,
    },
  },

  // ─── TESTING ──────────────────────────────────────────────────────────────
  // Testing products use a separate testing application flow
  'act-workkeys': {
    slug: 'act-workkeys',
    name: 'ACT WorkKeys',
    shortName: 'ACT WorkKeys',
    formEngine: 'canonical',
    color: 'violet',
    funding: {
      available: ['self_pay', 'employer', 'unsure'],
      supportsWioa: false,
      supportsBnpl: false,
    },
  },
  'osha-10': {
    slug: 'osha-10',
    name: 'OSHA 10-Hour Construction',
    shortName: 'OSHA 10',
    formEngine: 'canonical',
    color: 'orange',
    funding: {
      available: ['self_pay', 'employer', 'unsure'],
      supportsWioa: false,
      supportsBnpl: false,
    },
  },
  'cpr-first-aid': {
    slug: 'cpr-first-aid',
    name: 'CPR / First Aid',
    shortName: 'CPR / First Aid',
    formEngine: 'canonical',
    color: 'red',
    funding: {
      available: ['self_pay', 'employer', 'unsure'],
      supportsWioa: false,
      supportsBnpl: false,
    },
  },
};

/**
 * Returns the application config for a program slug.
 * Returns null if the program is not found.
 */
export function getProgramApplicationConfig(
  slug: string,
): ProgramApplicationConfig | null {
  return ALL_PROGRAMS[slug] ?? null;
}

/**
 * Returns all programs that use the canonical form engine.
 * These can all be handled by /apply/student?program=<slug>.
 */
export function getCanonicalPrograms(): ProgramApplicationConfig[] {
  return Object.values(ALL_PROGRAMS).filter(
    (p) => p.formEngine === 'canonical',
  );
}

/**
 * Returns all programs that use dedicated form engines.
 */
export function getDedicatedPrograms(): ProgramApplicationConfig[] {
  return Object.values(ALL_PROGRAMS).filter(
    (p) => p.formEngine === 'dedicated',
  );
}

/**
 * Returns the canonical form URL for a program.
 * For 'canonical' programs: /apply/student?program=<slug>
 * For 'dedicated' programs: the formPath
 * For 'external' programs: the formPath
 */
export function getApplyUrl(slug: string): string | null {
  const cfg = ALL_PROGRAMS[slug];
  if (!cfg) return null;
  if (cfg.formEngine === 'canonical') {
    return `/apply/student?program=${slug}`;
  }
  return cfg.formPath ?? null;
}
