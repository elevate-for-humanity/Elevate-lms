export const WORKONE_INDY_INTAKE_URL = 'https://WorkOneIndy.as.me/IntakeApptwithCN';

export type ProgramFundingTier = 'workforce-funded' | 'self-pay';

export type VerifiedProgramFunding = {
  slug: string;
  title: string;
  aliases?: readonly string[];
  description: string;
  duration: string | null;
  credential: string | null;
  category: string;
  etplListedFor2Exclusive: boolean;
  topJobsStars: number | null;
  wioaEligible: boolean;
  wrgEligible: boolean;
  sourceNote: string;
};

/**
 * Public workforce-funding source of truth.
 *
 * Only these four programs may display workforce-funding labels. WorkOne or
 * the responsible agency determines participant eligibility, covered costs,
 * and written authorization. Elevate does not guarantee approval.
 */
export const VERIFIED_WORKFORCE_FUNDED_PROGRAMS: readonly VerifiedProgramFunding[] = [
  {
    slug: 'cdl-training',
    title: 'CDL Training',
    description:
      'Commercial driver training with permit support, safety instruction, and coordinated road training.',
    duration: '6 weeks',
    credential: 'CDL Class A License',
    category: 'trades',
    etplListedFor2Exclusive: true,
    topJobsStars: null,
    wioaEligible: true,
    wrgEligible: true,
    sourceNote: 'Confirmed workforce-fundable program. WorkOne authorization is required.',
  },
  {
    slug: 'hvac-technician',
    title: 'HVAC Technician',
    description:
      'Hands-on heating, cooling, refrigeration, safety, diagnostics, installation, and maintenance training.',
    duration: '6 weeks',
    credential: 'EPA 608 Universal',
    category: 'trades',
    etplListedFor2Exclusive: true,
    topJobsStars: null,
    wioaEligible: true,
    wrgEligible: true,
    sourceNote: 'Confirmed workforce-fundable program. WorkOne authorization is required.',
  },
  {
    slug: 'business-administration',
    title: 'Business Administration',
    aliases: ['business'],
    description:
      'Business, Microsoft Office, QuickBooks, entrepreneurship, and workplace administration training.',
    duration: '8 weeks',
    credential: 'Industry certification preparation',
    category: 'business',
    etplListedFor2Exclusive: true,
    topJobsStars: null,
    wioaEligible: true,
    wrgEligible: false,
    sourceNote: 'Confirmed workforce-fundable program. WorkOne authorization is required.',
  },
  {
    slug: 'financial-literacy',
    title: 'Financial Literacy',
    description:
      'Practical training in budgeting, banking, credit, debt management, saving, taxes, and financial decision-making.',
    duration: null,
    credential: null,
    category: 'business',
    etplListedFor2Exclusive: true,
    topJobsStars: null,
    wioaEligible: true,
    wrgEligible: false,
    sourceNote: 'Confirmed workforce-fundable program. WorkOne authorization is required.',
  },
] as const;

const FUNDING_BY_SLUG = new Map<string, VerifiedProgramFunding>();
for (const program of VERIFIED_WORKFORCE_FUNDED_PROGRAMS) {
  FUNDING_BY_SLUG.set(program.slug, program);
  for (const alias of program.aliases ?? []) FUNDING_BY_SLUG.set(alias, program);
}

export function getVerifiedProgramFunding(slug: string): VerifiedProgramFunding | null {
  return FUNDING_BY_SLUG.get(slug) ?? null;
}

/** Retained name for compatibility; the decision comes from the explicit four-program registry. */
export function isStrictWorkforceFundedProgram(slug: string): boolean {
  const record = getVerifiedProgramFunding(slug);
  return Boolean(record?.etplListedFor2Exclusive && (record.wioaEligible || record.wrgEligible));
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
