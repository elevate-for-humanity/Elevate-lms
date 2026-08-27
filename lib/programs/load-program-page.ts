/**
 * Single loader for /programs/[program].
 *
 * Supabase publication is authoritative. The requested slug must match an exact
 * published, active `programs` row. Static ProgramSchema files may enrich that
 * same exact slug, but they never create, alias, redirect, or rescue a route.
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

function withCanonicalProgramMedia(program: ProgramSchema, slug: string): ProgramSchema {
  return normalizePublicProgram({
    ...program,
    heroImage: getProgramHeroImage(slug),
    heroImageAlt: getProgramImageAlt(slug, program.heroImageAlt || program.title),
  });
}

async function fetchPublishedDbProgram(slug: string): Promise<PublishedDbProgramRow | null> {
  const db = createPublicClient();
  if (!db) return null;

  try {
    const { data: row } = await db
      .from('programs')
      .select('slug,title,description,short_description,credential,duration_weeks,image_url,category,published,is_active,status')
      .eq('slug', slug)
      .eq('published', true)
      .eq('is_active', true)
      .neq('status', 'archived')
      .maybeSingle();

    return row ? (row as PublishedDbProgramRow) : null;
  } catch {
    // Dedicated, governed program routes provide their own static fallback.
    // A transient CMS/network failure must not turn those public routes into a
    // server error before the route can apply that fallback.
    return null;
  }
}

export async function loadProgramForPage(rawSlug: string): Promise<LoadedProgramPage | null> {
  const slug = rawSlug.toLowerCase().trim();
  if (!slug) return null;

  // No exact published Supabase row = no public program route.
  const row = await fetchPublishedDbProgram(slug);
  if (!row) return null;

  // A rich static schema is data only and may enrich this exact published slug.
  // A schema that normalizes to another slug is intentionally ignored.
  const staticProgram = getStaticProgram(slug);
  if (staticProgram?.slug === slug) {
    return {
      program: withCanonicalProgramMedia(staticProgram, slug),
      synthesized: false,
    };
  }

  return {
    program: withCanonicalProgramMedia(buildProgramSchemaFromDb(row as DbProgramRow), slug),
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
