/**
 * Slug-based course and program resolvers.
 *
 * Use these instead of hardcoded UUID constants. The DB is the source of truth.
 * Results are cached in module scope for the lifetime of the server process
 * (Next.js server component cache resets per request in dev, persists in prod).
 *
 * Migration path:
 *   Step 1 (now): introduce resolvers — dual support UUID + slug
 *   Step 2: replace .eq('course_id', HVAC_COURSE_ID) with resolveCourseId('hvac-technician')
 *   Step 3: remove HVAC_COURSE_ID / HVAC_PROGRAM_ID constants
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Module-level cache — avoids repeated DB round-trips within a single process.
// In ECS, each container restart repopulates. That's acceptable.
const courseIdCache = new Map<string, string>();
const programIdCache = new Map<string, string>();

/**
 * Resolve a course UUID from its slug.
 * Returns null if not found.
 */
export async function resolveCourseId(slug: string): Promise<string | null> {
  if (courseIdCache.has(slug)) return courseIdCache.get(slug)!;

  const supabase = (await requireAdminClient()) ?? (await createClient());
  const { data } = await supabase.from('courses').select('id').eq('slug', slug).maybeSingle();

  if (data?.id) {
    courseIdCache.set(slug, data.id);
    return data.id;
  }
  return null;
}

/**
 * Resolve a program UUID from its slug.
 * Returns null if not found.
 */
export async function resolveProgramId(slug: string): Promise<string | null> {
  if (programIdCache.has(slug)) return programIdCache.get(slug)!;

  const supabase = (await requireAdminClient()) ?? (await createClient());
  const { data } = await supabase.from('programs').select('id').eq('slug', slug).maybeSingle();

  if (data?.id) {
    programIdCache.set(slug, data.id);
    return data.id;
  }
  return null;
}

/**
 * Convenience: resolve HVAC course ID by slug.
 * Falls back to the known stable UUID if DB is unavailable at build time.
 */
export async function resolveHvacCourseId(): Promise<string> {
  return (
    (await resolveCourseId('hvac-technician')) ?? '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0' // fallback — stable in prod DB
  );
}

/**
 * Convenience: resolve HVAC program ID by slug.
 */
export async function resolveHvacProgramId(): Promise<string> {
  return (
    (await resolveProgramId('hvac-technician')) ?? '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7' // fallback — stable in prod DB
  );
}
