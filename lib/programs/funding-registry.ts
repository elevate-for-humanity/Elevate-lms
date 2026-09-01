export { WORKONE_INDY_BOOKING_URL as WORKONE_INDY_INTAKE_URL } from '@/lib/workone/booking';

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
 * Public workforce-funding allowlist.
 *
 * This list is deliberately narrower than the internal program catalog. A
 * program belongs here only when current program-level evidence supports the
 * exact public funding label. Participant eligibility, covered costs, available
 * funds, and written authorization remain decisions of the responsible agency;
 * Elevate does not guarantee funding.
 *
 * Regulatory evidence is also persisted in Supabase `program_regulatory_status`.
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
    // The evidence in the canonical record verifies WRG approval. Do not infer
    // WIOA eligibility from provider status or WRG approval alone.
    wioaEligible: false,
    wrgEligible: true,
    sourceNote:
      'Indiana DWD INTraining approved the Commercial Driver’s License program location for Workforce Ready Grant on July 1, 2026 (Program Location ID 10005156). Participant authorization remains required.',
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
 * For a program without exact public evidence, any sentence containing a public
 * funding claim is removed before rendering.
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
  if (!record) {
    return 'No public workforce-funding claim is made for this program unless exact program-level evidence and participant authorization are recorded.';
  }
  const programs = [
    record.wioaEligible ? 'WIOA' : null,
    record.wrgEligible ? 'Workforce Ready Grant' : null,
  ]
    .filter(Boolean)
    .join(' and ');
  return `${programs} may be available for eligible participants in this evidenced program. Written authorization from the responsible workforce agency is required before training begins.`;
}
