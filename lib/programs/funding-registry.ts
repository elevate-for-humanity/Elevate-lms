export const WORKONE_INDY_INTAKE_URL = 'https://WorkOneIndy.as.me/IntakeApptwithCN';

export type ProgramFundingTier = 'workforce-funded' | 'self-pay';

export type VerifiedProgramFunding = {
  slug: string;
  etplListedFor2Exclusive: boolean;
  topJobsStars: number | null;
  wioaEligible: boolean;
  wrgEligible: boolean;
  sourceNote: string;
};

/**
 * Strict public funding registry.
 *
 * RULES:
 * 1. Public WIOA/WRG marketing is denied by default.
 * 2. Program must be verified on the Indiana ETPL for 2Exclusive LLC-S.
 * 3. Program must have a verified Top Jobs final rating of 3+ to enter the
 *    workforce-funded website/application track, per current operating policy.
 * 4. Anything not listed here, or listed with <3/unverified stars, is self-pay.
 *
 * This intentionally overrides stale database flags, old marketing copy, and
 * program-file fundingOptions. Additions require documentary verification.
 */
const VERIFIED_PROGRAM_FUNDING: Record<string, VerifiedProgramFunding> = {
  'cdl-training': {
    slug: 'cdl-training',
    etplListedFor2Exclusive: true,
    topJobsStars: 4,
    wioaEligible: true,
    wrgEligible: true,
    sourceNote: '2Exclusive ETPL record; CDL WRG approval; Top Jobs Heavy and Tractor-Trailer Truck Drivers = 4 stars.',
  },
  'peer-recovery-specialist': {
    slug: 'peer-recovery-specialist',
    etplListedFor2Exclusive: true,
    topJobsStars: 3,
    wioaEligible: true,
    wrgEligible: false,
    sourceNote: '2Exclusive ETPL record; Top Jobs Substance Abuse, Behavioral Disorder, and Mental Health Counselors = 3 stars.',
  },

  // ETPL-listed/approved records that do NOT enter the funded public track
  // under the strict 3-star rule until a qualifying Top Jobs rating is verified.
  'medical-assistant': {
    slug: 'medical-assistant',
    etplListedFor2Exclusive: true,
    topJobsStars: 2,
    wioaEligible: false,
    wrgEligible: false,
    sourceNote: '2Exclusive ETPL record; Medical Assistants final Top Jobs rating is 2 under the wage threshold.',
  },
  cna: {
    slug: 'cna',
    etplListedFor2Exclusive: true,
    topJobsStars: null,
    wioaEligible: false,
    wrgEligible: false,
    sourceNote: '2Exclusive ETPL record; 3+ Top Jobs final rating not verified in registry.',
  },
  'barber-apprenticeship': {
    slug: 'barber-apprenticeship',
    etplListedFor2Exclusive: true,
    topJobsStars: null,
    wioaEligible: false,
    wrgEligible: false,
    sourceNote: '2Exclusive ETPL record; 3+ Top Jobs final rating not verified in registry.',
  },
  'information-technology-foundations': {
    slug: 'information-technology-foundations',
    etplListedFor2Exclusive: true,
    topJobsStars: null,
    wioaEligible: false,
    wrgEligible: false,
    sourceNote: '2Exclusive ETPL record; occupation mapping/final 3+ Top Jobs rating requires verification.',
  },
};

export function getVerifiedProgramFunding(slug: string): VerifiedProgramFunding | null {
  return VERIFIED_PROGRAM_FUNDING[slug] ?? null;
}

export function isStrictWorkforceFundedProgram(slug: string): boolean {
  const record = getVerifiedProgramFunding(slug);
  return Boolean(
    record?.etplListedFor2Exclusive &&
      record.topJobsStars !== null &&
      record.topJobsStars >= 3 &&
      (record.wioaEligible || record.wrgEligible),
  );
}

export function getProgramFundingTier(slug: string): ProgramFundingTier {
  return isStrictWorkforceFundedProgram(slug) ? 'workforce-funded' : 'self-pay';
}

export function getPublicFundingLabels(slug: string): string[] {
  const record = getVerifiedProgramFunding(slug);
  if (!record || !isStrictWorkforceFundedProgram(slug)) return ['Self-Pay'];
  const labels: string[] = ['Indiana ETPL'];
  if (record.wioaEligible) labels.push('WIOA');
  if (record.wrgEligible) labels.push('Workforce Ready Grant');
  return labels;
}
