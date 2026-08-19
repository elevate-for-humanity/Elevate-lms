/**
 * Single loader for /programs/[program].
 *
 * Ownership order:
 * 1. Full static schema for the exact slug.
 * 2. Published Supabase row + its explicit canonical public-page mapping.
 * 3. Legacy repository aliases/registry.
 * 4. Database fallback.
 *
 * This order is intentional. A published Supabase program must never be silently
 * collapsed into a different legacy alias before its page mapping is considered.
 */

import { getStaticProgram, normalizePublicProgram } from '@/data/programs/index';
import { resolveProgram, resolveSlug } from '@/lib/program-registry';
import { createPublicClient } from '@/lib/supabase/public';
import {
  buildProgramSchemaFromDb,
  buildProgramSchemaFromRegistry,
  type DbProgramRow,
} from '@/lib/programs/build-program-schema';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { isArchivedProgramSlug } from '@/lib/programs/archived-program-slugs';
import { getProgramHeroImage, getProgramImageAlt } from '@/lib/images/programImages';

export type LoadedProgramPage = {
  program: ProgramSchema;
  /** True when built from registry/DB partial data (not a full static file). */
  synthesized: boolean;
};

type PublishedDbProgramRow = DbProgramRow & {
  published?: boolean | null;
  is_active?: boolean | null;
  status?: string | null;
  lms_config?: {
    canonical_public_slug?: string;
    public_page_path?: string;
  } | null;
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

  const { data: row } = await db
    .from('programs')
    .select(
      'slug,title,description,short_description,credential,duration_weeks,image_url,category,published,is_active,status,lms_config',
    )
    .eq('slug', slug)
    .maybeSingle();

  if (!row) return null;
  if (row.published !== true || row.is_active !== true || row.status === 'archived') return null;
  return row as PublishedDbProgramRow;
}

async function loadPublishedMappedProgram(
  rawSlug: string,
): Promise<LoadedProgramPage | null> {
  const row = await fetchPublishedDbProgram(rawSlug);
  if (!row) return null;

  const mappedSlug =
    row.lms_config?.canonical_public_slug?.toLowerCase().trim() || rawSlug;

  if (isArchivedProgramSlug(mappedSlug)) return null;

  if (mappedSlug !== rawSlug) {
    const mappedStatic = getStaticProgram(mappedSlug);
    if (mappedStatic) {
      return {
        program: withCanonicalProgramMedia(mappedStatic, mappedStatic.slug),
        synthesized: false,
      };
    }

    const mappedRow = await fetchPublishedDbProgram(mappedSlug);
    if (mappedRow) {
      return {
        program: withCanonicalProgramMedia(
          buildProgramSchemaFromDb(mappedRow as DbProgramRow),
          mappedSlug,
        ),
        synthesized: true,
      };
    }

    const mappedRegistry = resolveProgram(mappedSlug);
    if (mappedRegistry?.active) {
      return {
        program: withCanonicalProgramMedia(
          buildProgramSchemaFromRegistry(mappedRegistry),
          mappedRegistry.slug,
        ),
        synthesized: true,
      };
    }
  }

  return {
    program: withCanonicalProgramMedia(buildProgramSchemaFromDb(row as DbProgramRow), rawSlug),
    synthesized: true,
  };
}

/**
 * Database overlay is only allowed for synthesized registry entries that do not
 * have a full static ProgramSchema. Full static schemas are the public contract
 * for title, description, duration, credentials, pricing and compliance copy.
 */
async function overlayDbFieldsForSynthesizedProgram(
  program: ProgramSchema,
  slug: string,
): Promise<ProgramSchema> {
  const row = await fetchPublishedDbProgram(slug);
  if (!row) return withCanonicalProgramMedia(program, slug);

  return withCanonicalProgramMedia(
    {
      ...program,
      title: row.title || program.title,
      subtitle: row.short_description || row.description || program.subtitle,
      durationWeeks: row.duration_weeks ?? program.durationWeeks,
      ...(row.description && row.description !== row.short_description
        ? {
            programDescription: row.description.split(/\n\n+/).filter(Boolean),
          }
        : {}),
    },
    slug,
  );
}

/** Resolve slug → ProgramSchema for the public program detail page. */
export async function loadProgramForPage(rawSlug: string): Promise<LoadedProgramPage | null> {
  const normalizedRawSlug = rawSlug.toLowerCase().trim();

  if (isArchivedProgramSlug(normalizedRawSlug)) return null;

  // A complete exact-slug static schema remains the strongest contract.
  const directStaticProgram = getStaticProgram(normalizedRawSlug);
  if (directStaticProgram) {
    return {
      program: withCanonicalProgramMedia(directStaticProgram, directStaticProgram.slug),
      synthesized: false,
    };
  }

  // Published Supabase rows now own their explicit page mapping before any
  // historical alias resolution. This is what guarantees every published row
  // maps to the page recorded in lms_config.public_page_path.
  const publishedMappedProgram = await loadPublishedMappedProgram(normalizedRawSlug);
  if (publishedMappedProgram) return publishedMappedProgram;

  // Legacy aliases are fallback-only for old inbound links that are not
  // themselves current published Supabase program slugs.
  const slug = resolveSlug(normalizedRawSlug) ?? normalizedRawSlug;
  if (isArchivedProgramSlug(slug)) return null;

  const staticProgram = getStaticProgram(slug);
  if (staticProgram) {
    return {
      program: withCanonicalProgramMedia(staticProgram, staticProgram.slug),
      synthesized: false,
    };
  }

  const registryEntry = resolveProgram(slug);
  if (registryEntry?.active) {
    const base = buildProgramSchemaFromRegistry(registryEntry);
    return {
      program: await overlayDbFieldsForSynthesizedProgram(base, registryEntry.slug),
      synthesized: true,
    };
  }

  const row = await fetchPublishedDbProgram(slug);
  if (row) {
    return {
      program: withCanonicalProgramMedia(buildProgramSchemaFromDb(row as DbProgramRow), slug),
      synthesized: true,
    };
  }

  return null;
}

/** Metadata-only load — avoids duplicate DB round-trips when page already loaded program. */
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
