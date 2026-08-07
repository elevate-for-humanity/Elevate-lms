import { createPublicClient } from '@/lib/supabase/public';
import { STATIC_PROGRAM_MAP } from '@/data/programs/index';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { resolveCredentialLabel } from '@/lib/programs/category-normalize';
import {
  getProgramFundingTier,
  getPublicFundingLabels,
  getVerifiedProgramFunding,
  isStrictWorkforceFundedProgram,
} from '@/lib/programs/funding-registry';

export type PublicProgramListItem = {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  duration: string | null;
  credential: string | null;
  funding_eligible: boolean;
  funding_tier: 'workforce-funded' | 'self-pay';
  funding_labels: string[];
  top_jobs_stars: number | null;
  tuition: number | null;
  price_label: string | null;
};

export type PublicProgramListResult = {
  programs: PublicProgramListItem[];
  source: 'database' | 'static-catalog';
};

const SUPPRESSED = new Set([
  'cna-training','hvac','hvac-technician-program','hvac-2024','medical-assistant-program',
  'phlebotomy-technician','phlebotomy-technician-program','barber','barber-program','cosmetology',
  'nail-technician','cpr-cert','health-safety','forklift-operator','forklift','plumbing','tax-prep',
  'it-support','it-support-specialist','cybersecurity','bookkeeping-fundamentals',
  'entrepreneurship-small-business','peer-recovery-specialist-jri',
]);

const SECTOR_TO_CATEGORY: Record<ProgramSchema['sector'], string> = {
  healthcare: 'healthcare',
  'skilled-trades': 'trades',
  'personal-services': 'beauty',
  technology: 'technology',
  business: 'business',
};

function getPriceLabel(tuition: number | null): string | null {
  if (tuition === null) return 'Contact admissions';
  if (tuition === 0) return 'Contact admissions';
  return `$${tuition.toLocaleString('en-US')}`;
}

function trimDescription(text: string | undefined | null): string | null {
  if (!text?.trim()) return null;
  let desc = text.trim();
  if (!/[.!?]$/.test(desc)) {
    const last = Math.max(desc.lastIndexOf('.'), desc.lastIndexOf('!'), desc.lastIndexOf('?'));
    desc = last > 20 ? desc.slice(0, last + 1) : desc;
  }
  return desc;
}

function fundingFields(slug: string) {
  const record = getVerifiedProgramFunding(slug);
  const funded = isStrictWorkforceFundedProgram(slug);
  return {
    funding_eligible: funded,
    funding_tier: getProgramFundingTier(slug),
    funding_labels: getPublicFundingLabels(slug),
    top_jobs_stars: record?.topJobsStars ?? null,
  } as const;
}

function fromStaticCatalog(): PublicProgramListItem[] {
  const seen = new Set<string>();
  const items: PublicProgramListItem[] = [];

  for (const program of STATIC_PROGRAM_MAP.values()) {
    if (seen.has(program.slug) || SUPPRESSED.has(program.slug)) continue;
    seen.add(program.slug);

    const description = trimDescription(program.subtitle) ?? trimDescription(program.programDescription?.[0]) ?? null;
    const funding = fundingFields(program.slug);
    const parsedCost = Number(String(program.selfPayCost ?? '').replace(/[^0-9.]/g, '')) || null;

    items.push({
      slug: program.slug,
      title: program.title,
      description,
      category: SECTOR_TO_CATEGORY[program.sector] ?? 'other',
      duration: program.durationWeeks ? `${program.durationWeeks} weeks` : program.schedule ?? null,
      credential: program.credentials?.[0]?.name ?? program.badge ?? null,
      ...funding,
      tuition: parsedCost,
      price_label: getPriceLabel(parsedCost),
    });
  }

  return items.sort((a, b) => a.title.localeCompare(b.title));
}

export async function loadPublicProgramList(): Promise<PublicProgramListResult> {
  try {
    const db = createPublicClient();
    const { data } = await db
      .from('programs')
      .select('slug,title,short_description,description,category,duration,credential_type,credential_name,published,status,tuition,price')
      .eq('is_active', true)
      .eq('published', true)
      .neq('status', 'archived')
      .order('title');

    if (data?.length) {
      const programs = data
        .filter((p) => !SUPPRESSED.has(p.slug))
        .map((p) => {
          const rawTuition = p.tuition ?? p.price ?? null;
          const tuition = rawTuition ? parseFloat(String(rawTuition)) : null;
          return {
            slug: p.slug,
            title: p.title,
            description: trimDescription(p.short_description || p.description),
            category: p.category || 'other',
            duration: p.duration ?? null,
            credential: resolveCredentialLabel(p),
            ...fundingFields(p.slug),
            tuition: tuition && !isNaN(tuition) ? tuition : null,
            price_label: getPriceLabel(tuition && !isNaN(tuition) ? tuition : null),
          };
        });

      if (programs.length > 0) return { programs, source: 'database' };
    }
  } catch {
    // Use static catalog if public DB is unavailable.
  }

  return { programs: fromStaticCatalog(), source: 'static-catalog' };
}

export type ApplyProgramOption = {
  id: string;
  title: string;
  slug: string;
  fundingTier: 'workforce-funded' | 'self-pay';
  wioaEligible: boolean;
  wrgEligible: boolean;
  topJobsStars: number | null;
};

export async function loadApplyProgramOptions(): Promise<{
  options: ApplyProgramOption[];
  source: PublicProgramListResult['source'];
}> {
  const { programs, source } = await loadPublicProgramList();
  const options = programs.map((p) => {
    const record = getVerifiedProgramFunding(p.slug);
    return {
      id: p.slug,
      title: p.title,
      slug: p.slug,
      fundingTier: p.funding_tier,
      wioaEligible: Boolean(record?.wioaEligible && p.funding_eligible),
      wrgEligible: Boolean(record?.wrgEligible && p.funding_eligible),
      topJobsStars: p.top_jobs_stars,
    };
  });
  return { options, source };
}
