/**
 * Single loader for /programs/[program] — static schema first, then registry, then DB.
 * Every resolved program renders through ProgramDetailPage (no legacy inline templates).
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

function withCanonicalProgramMedia(program: ProgramSchema, slug: string): ProgramSchema {
  return normalizePublicProgram({
    ...program,
    heroImage: getProgramHeroImage(slug),
    heroImageAlt: getProgramImageAlt(slug, program.heroImageAlt || program.title),
  });
}

/**
 * Database overlay is only allowed for synthesized registry entries that do not
 * have a full static ProgramSchema. Full static schemas are the public contract
 * for title, description, duration, credentials, pricing and compliance copy.
 * This prevents stale program-table seeds from changing a program page while
 * the catalog is using the canonical static definition.
 */
async function overlayDbFieldsForSynthesizedProgram(
  program: ProgramSchema,
  slug: string,
): Promise<ProgramSchema> {
  const db = createPublicClient();
  if (!db) return withCanonicalProgramMedia(program, slug);

  const { data: row } = await db
    .from('programs')
    .select(
      'title, description, short_description, credential, duration_weeks, image_url, category',
    )
    .eq('slug', slug)
    .maybeSingle();

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

/**
 * Resolve slug → ProgramSchema for the program detail page.
 * Returns null when the slug is not recognized anywhere.
 *
 * Ownership order matters: a full static program definition is authoritative
 * for its own slug. Only slugs without a direct static definition are passed
 * through the legacy alias resolver and, if necessary, the database.
 */
export async function loadProgramForPage(rawSlug: string): Promise<LoadedProgramPage | null> {
  const normalizedRawSlug = rawSlug.toLowerCase().trim();

  if (isArchivedProgramSlug(normalizedRawSlug)) {
    return null;
  }

  const directStaticProgram = getStaticProgram(normalizedRawSlug);
  if (directStaticProgram) {
    return {
      program: withCanonicalProgramMedia(directStaticProgram, directStaticProgram.slug),
      synthesized: false,
    };
  }

  const slug = resolveSlug(normalizedRawSlug) ?? normalizedRawSlug;

  if (isArchivedProgramSlug(slug)) {
    return null;
  }

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

  const db = createPublicClient();
  if (db) {
    const { data: row } = await db
      .from('programs')
      .select(
        'slug, title, description, short_description, credential, duration_weeks, image_url, category',
      )
      .eq('slug', slug)
      .maybeSingle();

    if (row) {
      return {
        program: withCanonicalProgramMedia(buildProgramSchemaFromDb(row as DbProgramRow), slug),
        synthesized: true,
      };
    }
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
