/**
 * Single loader for /programs/[program] — static schema first, then registry, then DB.
 * Every resolved program renders through ProgramDetailPage (no legacy inline templates).
 */

import { getStaticProgram } from '@/data/programs/index';
import { resolveProgram, resolveSlug } from '@/lib/program-registry';
import { createPublicClient } from '@/lib/supabase/public';
import {
  buildProgramSchemaFromDb,
  buildProgramSchemaFromPartial,
  buildProgramSchemaFromRegistry,
  type DbProgramRow,
} from '@/lib/programs/build-program-schema';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { isArchivedProgramSlug } from '@/lib/programs/archived-program-slugs';

export type LoadedProgramPage = {
  program: ProgramSchema;
  /** True when built from registry/DB partial data (not a full static file). */
  synthesized: boolean;
};

async function overlayDbFields(
  program: ProgramSchema,
  slug: string,
): Promise<ProgramSchema> {
  const db = createPublicClient();
  if (!db) return program;

  const { data: row } = await db
    .from('programs')
    .select(
      'title, description, short_description, credential, duration_weeks, image_url, category',
    )
    .eq('slug', slug)
    .maybeSingle();

  if (!row) return program;

  return {
    ...program,
    title: row.title || program.title,
    subtitle: row.short_description || row.description || program.subtitle,
    durationWeeks: row.duration_weeks ?? program.durationWeeks,
    heroImage: row.image_url || program.heroImage,
    ...(row.description && row.description !== row.short_description ?
      {
        programDescription: row.description.split(/\n\n+/).filter(Boolean),
      }
    : {}),
  };
}

/**
 * Resolve slug → ProgramSchema for the program detail page.
 * Returns null when the slug is not recognized anywhere.
 */
export async function loadProgramForPage(rawSlug: string): Promise<LoadedProgramPage | null> {
  const slug = resolveSlug(rawSlug) ?? rawSlug.toLowerCase().trim();

  if (isArchivedProgramSlug(slug)) {
    return null;
  }

  const staticProgram = getStaticProgram(slug);
  if (staticProgram) {
    return {
      program: await overlayDbFields(staticProgram, slug),
      synthesized: false,
    };
  }

  const registryEntry = resolveProgram(slug);
  if (registryEntry?.active) {
    const base = buildProgramSchemaFromRegistry(registryEntry);
    return {
      program: await overlayDbFields(base, registryEntry.slug),
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
        program: buildProgramSchemaFromDb(row as DbProgramRow),
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
