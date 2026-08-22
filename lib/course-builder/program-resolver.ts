/**
 * Canonical program -> course resolver.
 *
 * `programs` owns program identity and `program_courses` owns the relationship
 * between programs and courses. Legacy `program_course_map`,
 * `program_course_links`, and hardcoded slug maps are not write authorities.
 */

import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

type ProgramRow = { id: string; slug: string | null };
type ProgramCourseRow = {
  id: string;
  program_id: string;
  course_id: string;
  created_at: string | null;
  order_index: number | null;
};

async function resolveProgramId(
  db: SupabaseClient,
  programSlug: string,
): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await db
    .from('programs')
    .select('id')
    .eq('slug', programSlug)
    .maybeSingle();

  if (error) return { id: null, error: error.message };
  return { id: data?.id ?? null };
}

export async function resolveCourseIdFromDb(
  db: SupabaseClient,
  programSlug: string,
): Promise<string | null> {
  const program = await resolveProgramId(db, programSlug);
  if (program.error) {
    logger.error('[program-resolver] failed to resolve program', undefined, {
      programSlug,
      error: program.error,
    });
    return null;
  }
  if (!program.id) return null;

  const { data, error } = await db
    .from('program_courses')
    .select('course_id, order_index, is_required')
    .eq('program_id', program.id)
    .order('is_required', { ascending: false })
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('[program-resolver] failed to resolve canonical course mapping', undefined, {
      programSlug,
      programId: program.id,
      error: error.message,
    });
    return null;
  }

  return data?.course_id ?? null;
}

export async function listProgramCourseMappings(
  db: SupabaseClient,
): Promise<Array<{ program_slug: string; course_id: string; created_at: string }>> {
  const [{ data: programs, error: programError }, { data: mappings, error: mappingError }] =
    await Promise.all([
      db.from('programs').select('id, slug').not('slug', 'is', null),
      db
        .from('program_courses')
        .select('id, program_id, course_id, created_at, order_index')
        .order('program_id')
        .order('order_index'),
    ]);

  if (programError || mappingError) {
    const message = programError?.message ?? mappingError?.message ?? 'unknown database error';
    logger.error('[program-resolver] failed to list canonical mappings', undefined, {
      error: message,
    });
    return [];
  }

  const slugByProgramId = new Map(
    ((programs ?? []) as ProgramRow[])
      .filter((program) => Boolean(program.slug))
      .map((program) => [program.id, program.slug as string]),
  );

  return ((mappings ?? []) as ProgramCourseRow[])
    .map((mapping) => ({
      program_slug: slugByProgramId.get(mapping.program_id) ?? '',
      course_id: mapping.course_id,
      created_at: mapping.created_at ?? new Date(0).toISOString(),
    }))
    .filter((mapping) => Boolean(mapping.program_slug))
    .sort((a, b) => a.program_slug.localeCompare(b.program_slug));
}

export async function registerProgramCourse(
  db: SupabaseClient,
  programSlug: string,
  courseId: string,
): Promise<{ ok: boolean; error?: string }> {
  const program = await resolveProgramId(db, programSlug);
  if (program.error) return { ok: false, error: program.error };
  if (!program.id) return { ok: false, error: `Program not found: ${programSlug}` };

  const { error } = await db.from('program_courses').upsert(
    {
      program_id: program.id,
      course_id: courseId,
      is_required: true,
      order_index: 0,
    },
    { onConflict: 'program_id,course_id', ignoreDuplicates: true },
  );

  if (error) {
    logger.error('[program-resolver] failed to register canonical mapping', undefined, {
      programSlug,
      programId: program.id,
      courseId,
      error: error.message,
    });
    return { ok: false, error: error.message };
  }

  logger.info('[program-resolver] registered canonical program -> course mapping', {
    programSlug,
    programId: program.id,
    courseId,
  });
  return { ok: true };
}

/**
 * The historical endpoint identifies a relationship only by program slug.
 * Deleting all courses from a multi-course program would be destructive, so
 * deletion is permitted only when that program currently has exactly one link.
 */
export async function unregisterProgramCourse(
  db: SupabaseClient,
  programSlug: string,
): Promise<{ ok: boolean; error?: string }> {
  const program = await resolveProgramId(db, programSlug);
  if (program.error) return { ok: false, error: program.error };
  if (!program.id) return { ok: false, error: `Program not found: ${programSlug}` };

  const { data: mappings, error: readError } = await db
    .from('program_courses')
    .select('id')
    .eq('program_id', program.id)
    .limit(2);

  if (readError) return { ok: false, error: readError.message };
  if (!mappings?.length) return { ok: true };
  if (mappings.length > 1) {
    return {
      ok: false,
      error: 'Program has multiple course mappings; specify a course before removing a relationship.',
    };
  }

  const { error } = await db.from('program_courses').delete().eq('id', mappings[0].id);
  if (error) {
    logger.error('[program-resolver] failed to remove canonical mapping', undefined, {
      programSlug,
      programId: program.id,
      error: error.message,
    });
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
