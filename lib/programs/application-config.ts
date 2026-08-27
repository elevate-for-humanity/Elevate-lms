/**
 * Central application-routing contract.
 *
 * Programs use the canonical /apply/student flow unless they intentionally
 * retain a dedicated chooser/payment surface. Keep program facts out of this
 * file; duration, credentials and public funding claims belong to the program
 * schema and funding registry.
 */

export type ApplicationFormEngine = 'canonical' | 'dedicated' | 'external';

export type FundingType =
  | 'wioa'
  | 'employer'
  | 'self_pay'
  | 'unsure'
  | 'scholarship'
  | 'payment_plan';

export interface ProgramFundingOptions {
  available: FundingType[];
  supportsWioa: boolean;
  supportsBnpl: boolean;
  depositCents?: number;
  fullTuitionCents?: number;
  stripeDepositLink?: string;
  stripeFullLink?: string;
}

export interface ProgramApplicationConfig {
  slug: string;
  name: string;
  shortName: string;
  formEngine: ApplicationFormEngine;
  formPath?: string;
  funding: ProgramFundingOptions;
  color: string;
  successRedirect?: string;
}

function canonicalProgram(
  slug: string,
  name: string,
  shortName: string,
  color: string,
  options: { supportsWioa?: boolean; supportsBnpl?: boolean } = {},
): ProgramApplicationConfig {
  const supportsWioa = Boolean(options.supportsWioa);
  return {
    slug,
    name,
    shortName,
    formEngine: 'canonical',
    color,
    funding: {
      available: supportsWioa
        ? ['wioa', 'employer', 'self_pay', 'unsure']
        : ['self_pay', 'employer', 'unsure'],
      supportsWioa,
      supportsBnpl: Boolean(options.supportsBnpl),
    },
  };
}

const ALL_PROGRAMS: Record<string, ProgramApplicationConfig> = {
  // Barber retains its dedicated chooser. Cosmetology, Esthetician, and Nail
  // apprentice intake use the canonical PARIS application and published pricing.
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
  'cosmetology-apprenticeship': canonicalProgram(
    'cosmetology-apprenticeship',
    'Cosmetology Apprenticeship',
    'Cosmetology',
    'purple',
    { supportsWioa: true, supportsBnpl: true },
  ),
  'esthetician-apprenticeship': canonicalProgram(
    'esthetician-apprenticeship',
    'Esthetician Apprenticeship',
    'Esthetician',
    'pink',
    { supportsWioa: true, supportsBnpl: true },
  ),
  'nail-technician-apprenticeship': canonicalProgram(
    'nail-technician-apprenticeship',
    'Nail Technician Apprenticeship',
    'Nail Tech',
    'rose',
    { supportsWioa: true, supportsBnpl: true },
  ),

  // HVAC is a canonical student application. The former dedicated HVAC page is
  // a compatibility redirect only and must never be selected as the form engine.
  'hvac-technician': canonicalProgram(
    'hvac-technician',
    'HVAC Certification',
    'HVAC',
    'emerald',
    { supportsWioa: true, supportsBnpl: true },
  ),

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

  cna: canonicalProgram('cna', 'Certified Nursing Assistant (CNA)', 'CNA', 'blue'),
  phlebotomy: canonicalProgram('phlebotomy', 'Phlebotomy Technician', 'Phlebotomy', 'blue'),
  'medical-assistant': canonicalProgram('medical-assistant', 'Medical Assistant', 'Med Assistant', 'blue'),
  qma: canonicalProgram('qma', 'Qualified Medication Aide (QMA)', 'QMA', 'blue'),
  'billing-coding': canonicalProgram('billing-coding', 'Medical Billing & Coding', 'Billing & Coding', 'blue'),
  'patient-care-technician': canonicalProgram('patient-care-technician', 'Patient Care Technician', 'PCT', 'blue'),
  'ehr-specialist': canonicalProgram('ehr-specialist', 'EHR Specialist', 'EHR Specialist', 'blue'),
  'pharmacy-tech': canonicalProgram('pharmacy-tech', 'Pharmacy Technician', 'Pharmacy Tech', 'blue'),
  'dental-assistant': canonicalProgram('dental-assistant', 'Dental Assistant', 'Dental Asst', 'blue'),
  'it-help-desk': canonicalProgram('it-help-desk', 'IT Help Desk Specialist', 'IT Help Desk', 'slate'),
  'food-safety-handler': canonicalProgram('food-safety-handler', 'Food Safety Handler', 'Food Safety', 'amber'),
  'servsafe-alcohol': canonicalProgram('servsafe-alcohol', 'ServSafe Alcohol Certification', 'ServSafe Alcohol', 'amber'),
  'act-workkeys': canonicalProgram('act-workkeys', 'ACT WorkKeys', 'ACT WorkKeys', 'violet'),
  'osha-10': canonicalProgram('osha-10', 'OSHA 10-Hour Construction', 'OSHA 10', 'orange'),
  'cpr-first-aid': canonicalProgram('cpr-first-aid', 'CPR / First Aid', 'CPR / First Aid', 'red'),
};

const PROGRAM_SLUG_ALIASES: Readonly<Record<string, string>> = {
  esthetician: 'esthetician-apprenticeship',
  'nail-technician': 'nail-technician-apprenticeship',
  cosmetology: 'cosmetology-apprenticeship',
  barber: 'barber-apprenticeship',
};

function normalizeProgramSlug(value: string): string {
  const slug = decodeURIComponent(value)
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');

  return PROGRAM_SLUG_ALIASES[slug] ?? slug;
}

export function getProgramApplicationConfig(
  slug: string,
): ProgramApplicationConfig | null {
  const canonicalSlug = normalizeProgramSlug(slug);
  return ALL_PROGRAMS[canonicalSlug] ?? null;
}

export function getCanonicalPrograms(): ProgramApplicationConfig[] {
  return Object.values(ALL_PROGRAMS).filter((p) => p.formEngine === 'canonical');
}

export function getDedicatedPrograms(): ProgramApplicationConfig[] {
  return Object.values(ALL_PROGRAMS).filter((p) => p.formEngine === 'dedicated');
}

export function getApplyUrl(slug: string): string | null {
  const cfg = getProgramApplicationConfig(slug);
  if (!cfg) return null;
  if (cfg.formEngine === 'canonical') {
    return `/apply/student?program=${cfg.slug}`;
  }
  return cfg.formPath ?? null;
}
