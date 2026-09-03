import { createPublicClient } from '@/lib/supabase/public';
import { STATIC_PROGRAM_MAP, getStaticProgram, normalizePublicProgram } from '@/data/programs/index';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { buildProgramSchemaFromDb } from '@/lib/programs/build-program-schema';
import { resolveCredentialLabel } from '@/lib/programs/category-normalize';
import {
  getProgramFundingTier,
  getPublicFundingLabels,
  getVerifiedProgramFunding,
  isStrictWorkforceFundedProgram,
  VERIFIED_WORKFORCE_FUNDED_PROGRAMS,
} from '@/lib/programs/funding-registry';
import { sanitizePublicFundingText } from '@/lib/programs/public-funding-copy';

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
  'cna-training',
  'hvac',
  'hvac-technician-program',
  'hvac-2024',
  'medical-assistant-program',
  'phlebotomy-technician',
  'phlebotomy-technician-program',
  'barber',
  'barber-program',
  'cosmetology',
  'nail-technician',
  'cpr-cert',
  'health-safety',
  'forklift-operator',
  'forklift',
  'plumbing',
  'tax-prep',
  'it-support',
  'it-support-specialist',
  'cybersecurity',
  'bookkeeping-fundamentals',
  'entrepreneurship-small-business',
  'peer-recovery-specialist-jri',
]);

const SECTOR_TO_CATEGORY: Record<ProgramSchema['sector'], string> = {
  healthcare: 'healthcare',
  'skilled-trades': 'trades',
  'personal-services': 'beauty',
  technology: 'technology',
  business: 'business',
};

function getPriceLabel(tuition: number | null): string | null {
  if (tuition === null || tuition === 0) return 'Contact admissions';
  return `$${tuition.toLocaleString('en-US')}`;
}

function parsePrice(value: unknown): number | null {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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

function fromProgramSchema(program: ProgramSchema, fallbackTuition: number | null = null): PublicProgramListItem {
  const normalized = normalizePublicProgram(program);
  const verified = getVerifiedProgramFunding(normalized.slug);
  const rawDescription =
    trimDescription(normalized.subtitle) ?? trimDescription(normalized.programDescription?.[0]);
  const description =
    verified?.description ??
    (sanitizePublicFundingText(rawDescription, normalized.slug, '') || null);
  const staticTuition = parsePrice(normalized.selfPayCost);
  const tuition = staticTuition ?? fallbackTuition;

  return {
    slug: verified?.slug ?? normalized.slug,
    title: verified?.title ?? normalized.title,
    description,
    category: verified?.category ?? SECTOR_TO_CATEGORY[normalized.sector] ?? 'other',
    duration:
      verified?.duration ??
      (normalized.durationWeeks ? `${normalized.durationWeeks} weeks` : (normalized.schedule ?? null)),
    credential:
      verified?.credential ?? normalized.credentials?.[0]?.name ?? normalized.badge ?? null,
    ...fundingFields(verified?.slug ?? normalized.slug),
    tuition,
    price_label: getPriceLabel(tuition),
  };
}

function fromStaticCatalog(): PublicProgramListItem[] {
  const seen = new Set<string>();
  const items: PublicProgramListItem[] = [];

  for (const rawProgram of STATIC_PROGRAM_MAP.values()) {
    const program = getStaticProgram(rawProgram.slug) ?? normalizePublicProgram(rawProgram);
    const verified = getVerifiedProgramFunding(program.slug);
    const slug = verified?.slug ?? program.slug;
    if (seen.has(slug) || SUPPRESSED.has(program.slug)) continue;
    seen.add(slug);
    items.push(fromProgramSchema(program));
  }

  return items.sort((a, b) => a.title.localeCompare(b.title));
}

function ensureVerifiedPrograms(items: PublicProgramListItem[]): PublicProgramListItem[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  for (const verified of VERIFIED_WORKFORCE_FUNDED_PROGRAMS) {
    bySlug.set(verified.slug, {
      slug: verified.slug,
      title: verified.title,
      description: verified.description,
      category: verified.category,
      duration: verified.duration,
      credential: verified.credential,
      ...fundingFields(verified.slug),
      tuition: bySlug.get(verified.slug)?.tuition ?? null,
      price_label: bySlug.get(verified.slug)?.price_label ?? 'Contact admissions',
    });
  }
  return [...bySlug.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export async function loadPublicProgramList(): Promise<PublicProgramListResult> {
  try {
    const db = createPublicClient();
    const { data } = await db
      .from('programs')
      .select(
        'slug,title,short_description,description,category,duration,duration_weeks,credential,credential_type,credential_name,image_url,published,status,tuition,price',
      )
      .eq('is_active', true)
      .eq('published', true)
      .neq('status', 'archived')
      .order('title');

    if (data?.length) {
      const programs = data
        .filter((p) => !SUPPRESSED.has(p.slug))
        .map((p) => {
          // Full static schemas are the public contract for known programs.
          // The detail page already follows this ownership order; the catalog
          // must do the same so stale database seeds cannot change duration,
          // title, credentials, tuition, or apprenticeship disclosures.
          const staticProgram = getStaticProgram(p.slug);
          if (staticProgram) return fromProgramSchema(staticProgram);

          const rawTuition = p.tuition ?? p.price ?? null;
          const tuition = parsePrice(rawTuition);
          const dbProgram = buildProgramSchemaFromDb({
            slug: p.slug,
            title: p.title,
            short_description: p.short_description,
            description: p.description ?? p.short_description,
            category: p.category,
            credential: p.credential_name ?? p.credential ?? resolveCredentialLabel(p),
            duration_weeks: p.duration_weeks,
            image_url: p.image_url,
          });
          return fromProgramSchema(dbProgram, tuition);
        });

      if (programs.length > 0) {
        return { programs: ensureVerifiedPrograms(programs), source: 'database' };
      }
    }
  } catch {
    // Use static catalog if public DB is unavailable.
  }

  return { programs: ensureVerifiedPrograms(fromStaticCatalog()), source: 'static-catalog' };
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
