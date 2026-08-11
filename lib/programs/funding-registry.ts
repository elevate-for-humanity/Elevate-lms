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
 * Only these four programs may display workforce-funding labels or claims.
 * WorkOne/the responsible agency determines participant eligibility, covered
 * costs and written authorization. Elevate does not guarantee approval.
 */
export const VERIFIED_WORKFORCE_FUNDED_PROGRAMS: readonly VerifiedProgramFunding[] = [
  {
    slug: 'cdl-training',
    title: 'CDL Training',
    description: 'Commercial driver training with permit support, safety instruction, and coordinated road training.',
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
    description: 'Hands-on heating, cooling, refrigeration, safety, diagnostics, installation, and maintenance training.',
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
    description: 'Business, Microsoft Office, QuickBooks, entrepreneurship, and workplace administration training.',
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
    description: 'Practical training in budgeting, banking, credit, debt management, saving, taxes, and financial decision-making.',
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

const FUNDING_CLAIM_PATTERN = /\b(?:wioa|workforce innovation and opportunity act|workforce ready grant|\bwrg\b|etpl|eligible for (?:workforce )?funding|funding (?:is )?available|100% (?:tuition )?coverage|100% free|pay \$0 out of pocket|zero out[- ]of[- ]pocket)\b/i;

/**
 * Prevent legacy descriptions from overriding the canonical funding registry.
 * For a self-pay program, any sentence containing a public funding claim is
 * removed before rendering. This is intentionally applied at the data boundary
 * so badges and descriptive copy cannot contradict each other.
 */
export function sanitizePublicFundingDescription(
  slug: string,
  description: string | null | undefined,
): string | null {
  const verified = getVerifiedProgramFunding(slug);
  if (verified) return verified.description;
  if (!description) return null;

  const clean = description
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !FUNDING_CLAIM_PATTERN.test(sentence))
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return clean || 'Career training program. Contact admissions for current tuition and enrollment requirements.';
}

export function getPublicFundingDisclosure(slug: string): string {
  const record = getVerifiedProgramFunding(slug);
  if (!record) return 'Self-pay program. Ask admissions about employer sponsorship or payment-plan options.';
  const programs = [record.wioaEligible ? 'WIOA' : null, record.wrgEligible ? 'Workforce Ready Grant' : null].filter(Boolean).join(' and ');
  return `${programs} may be available for eligible participants in this approved program. Written authorization from the responsible workforce agency is required before training begins.`;
}
