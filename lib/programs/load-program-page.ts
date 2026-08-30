/**
 * Single loader for /programs/[program].
 *
 * Supabase publication is authoritative. The requested slug must match an exact
 * published, active `programs` row. Static ProgramSchema files may enrich that
 * same exact slug and provide a bounded availability fallback when Supabase
 * cannot be reached, but never override a confirmed unpublished/missing row.
 */
import { getStaticProgram, normalizePublicProgram } from '@/data/programs/index';
import { createPublicClient } from '@/lib/supabase/public';
import { buildProgramSchemaFromDb, type DbProgramRow } from '@/lib/programs/build-program-schema';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { getProgramHeroImage, getProgramImageAlt } from '@/lib/images/programImages';

export type LoadedProgramPage = {
  program: ProgramSchema;
  synthesized: boolean;
};

type PublishedDbProgramRow = DbProgramRow & {
  published?: boolean | null;
  is_active?: boolean | null;
  status?: string | null;
};

type PublishedProgramLookup =
  | { status: 'found'; row: PublishedDbProgramRow }
  | { status: 'not_found' }
  | { status: 'unavailable' };

function withCanonicalProgramMedia(program: ProgramSchema, slug: string): ProgramSchema {
  return normalizePublicProgram({
    ...program,
    heroImage: getProgramHeroImage(slug),
    heroImageAlt: getProgramImageAlt(slug, program.heroImageAlt || program.title),
  });
}

async function fetchPublishedDbProgram(slug: string): Promise<PublishedProgramLookup> {
  const db = createPublicClient();
  if (!db) return { status: 'unavailable' };

  try {
    const { data: row, error } = await db
      .from('programs')
      .select('slug,title,description,short_description,credential,duration_weeks,image_url,category,published,is_active,status')
      .eq('slug', slug)
      .eq('published', true)
      .eq('is_active', true)
      .neq('status', 'archived')
      .maybeSingle();

    if (error) return { status: 'unavailable' };
    return row
      ? { status: 'found', row: row as PublishedDbProgramRow }
      : { status: 'not_found' };
  } catch {
    // Dedicated, governed program routes provide their own static fallback.
    // A transient CMS/network failure must not turn those public routes into a
    // server error before the route can apply that fallback.
    return { status: 'unavailable' };
  }
}

export async function loadProgramForPage(rawSlug: string): Promise<LoadedProgramPage | null> {
  const slug = rawSlug.toLowerCase().trim();
  if (!slug) return null;

  const lookup = await fetchPublishedDbProgram(slug);
  const staticProgram = getStaticProgram(slug);

  // Confirmed absence remains authoritative. During a database/network outage,
  // an exact governed static record keeps an already-known program page usable.
  // Dynamic-only programs still fail closed because they have no audited
  // fallback record.
  if (lookup.status === 'not_found') return null;
  if (lookup.status === 'unavailable') {
    if (staticProgram?.slug !== slug) return null;
    return {
      program: withCanonicalProgramMedia(staticProgram, slug),
      synthesized: false,
    };
  }

  // A rich static schema is data only and may enrich this exact published slug.
  // A schema that normalizes to another slug is intentionally ignored.
  if (staticProgram?.slug === slug) {
    return {
      program: withCanonicalProgramMedia(staticProgram, slug),
      synthesized: false,
    };
  }

  return {
    program: withCanonicalProgramMedia(buildProgramSchemaFromDb(lookup.row as DbProgramRow), slug),
    synthesized: true,
  };
}

export async function loadProgramMetadataSource(slug: string): Promise<{
  title: string;
  description: string;
  image?: string;
} | null> {
  const loaded = await loadProgramForPage(slug);
  if (!loaded) return null;
  const { program } = loaded;
  return {
    title: program.metaTitle || `${program.title} | Elevate for Humanity`,
    description: program.metaDescription || program.subtitle,
    image: program.heroImage,
  };
}
