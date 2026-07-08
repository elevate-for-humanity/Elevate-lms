import { createPublicClient } from '@/lib/supabase/public';
import { STATIC_PROGRAM_MAP } from '@/data/programs/index';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { resolveCredentialLabel } from '@/lib/programs/category-normalize';

export type PublicProgramListItem = {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  duration: string | null;
  credential: string | null;
  funding_eligible: boolean;
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

function trimDescription(text: string | undefined | null): string | null {
  if (!text?.trim()) return null;
  let desc = text.trim();
  if (!/[.!?]$/.test(desc)) {
    const last = Math.max(desc.lastIndexOf('.'), desc.lastIndexOf('!'), desc.lastIndexOf('?'));
    desc = last > 20 ? desc.slice(0, last + 1) : null;
  }
  return desc;
}

function fromStaticCatalog(): PublicProgramListItem[] {
  const seen = new Set<string>();
  const items: PublicProgramListItem[] = [];

  for (const program of STATIC_PROGRAM_MAP.values()) {
    if (seen.has(program.slug) || SUPPRESSED.has(program.slug)) continue;
    seen.add(program.slug);

    const description =
      trimDescription(program.subtitle) ??
      trimDescription(program.fundingStatement) ??
      null;

    items.push({
      slug: program.slug,
      title: program.title,
      description,
      category: SECTOR_TO_CATEGORY[program.sector] ?? 'other',
      duration: program.durationWeeks
        ? `${program.durationWeeks} weeks`
        : program.schedule ?? null,
      credential:
        program.credentials?.[0]?.name ?? program.badge ?? null,
      funding_eligible: Boolean(
        program.fundingStatement?.toLowerCase().includes('wioa') ||
          program.fundingStatement?.toLowerCase().includes('funding'),
      ),
    });
  }

  return items.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Public /programs listing: prefer live DB rows; fall back to static program registry
 * so the catalog never shows "0 programs" when marketing claims 30+.
 */
export async function loadPublicProgramList(): Promise<PublicProgramListResult> {
  try {
    const db = createPublicClient();
    const { data } = await db
      .from('programs')
      .select(
        'slug,title,short_description,description,category,duration,credential_type,credential_name,wioa_approved,funding_eligible,published,status',
      )
      .eq('is_active', true)
      .eq('published', true)
      .neq('status', 'archived')
      .order('title');

    if (data?.length) {
      const programs = data
        .filter((p) => !SUPPRESSED.has(p.slug))
        .map((p) => ({
          slug: p.slug,
          title: p.title,
          description: trimDescription(p.short_description || p.description),
          category: p.category || 'other',
          duration: p.duration ?? null,
          credential: resolveCredentialLabel(p),
          funding_eligible: Boolean(p.wioa_approved ?? p.funding_eligible),
        }));

      if (programs.length > 0) {
        return { programs, source: 'database' };
      }
    }
  } catch {
    // Supabase unavailable in dev — use static catalog
  }

  return { programs: fromStaticCatalog(), source: 'static-catalog' };
}

/** Dropdown options for /apply and intake forms (id = slug for stable keys). */
export type ApplyProgramOption = {
  id: string;
  title: string;
  slug: string;
};

export async function loadApplyProgramOptions(): Promise<{
  options: ApplyProgramOption[];
  source: PublicProgramListResult['source'];
}> {
  const { programs, source } = await loadPublicProgramList();
  const options = programs.map((p) => ({
    id: p.slug,
    title: p.title,
    slug: p.slug,
  }));
  return { options, source };
}
