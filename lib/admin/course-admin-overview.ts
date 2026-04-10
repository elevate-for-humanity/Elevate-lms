import 'server-only';

import { getAdminClient } from '@/lib/supabase/admin';
import { getAllBlueprints } from '@/lib/curriculum/blueprints';
import { logger } from '@/lib/logger';

export type AdminCourseStatus = 'complete' | 'partial' | 'structured' | 'empty';

export type AdminCourseOverview = {
  id: string;
  slug: string | null;
  title: string;
  programId: string | null;
  programSlug: string | null;
  blueprintSlug: string | null;
  blueprintId: string | null;
  expectedLessons: number;
  expectedModules: number;
  actualLessons: number;
  status: AdminCourseStatus;
  isActive: boolean;
  updatedAt: string | null;
};

function deriveStatus(expected: number, actual: number): AdminCourseStatus {
  if (expected === 0 && actual === 0) return 'empty';
  if (expected > 0 && actual === 0) return 'structured';
  if (expected > 0 && actual < expected) return 'partial';
  return 'complete';
}

export async function getAdminCoursesOverview(): Promise<AdminCourseOverview[]> {
  const supabase = await getAdminClient();

  if (!supabase) {
    // Service role key not available — return empty list rather than crashing the dashboard
    return [];
  }

  // Build blueprint index keyed by programSlug for O(1) lookup
  const blueprints = getAllBlueprints();
  const bpByProgramSlug = new Map(
    blueprints
      .filter(bp => bp.programSlug)
      .map(bp => [bp.programSlug, bp])
  );

  // Load all courses from the canonical table with their linked program slug
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      slug,
      title,
      program_id,
      is_active,
      status,
      updated_at,
      programs ( slug )
    `)
    .order('title', { ascending: true });

  if (error) {
    // Log but don't throw — a broken courses panel must not crash the dashboard
    logger.error('[getAdminCoursesOverview] query failed', error instanceof Error ? error : undefined);
    return [];
  }

  // Load lesson counts from course_lessons (the table lms_lessons view reads from)
  const { data: lessonRows } = await supabase
    .from('course_lessons')
    .select('course_id');

  const lessonCountByCourseId = new Map<string, number>();
  for (const row of lessonRows ?? []) {
    lessonCountByCourseId.set(
      row.course_id,
      (lessonCountByCourseId.get(row.course_id) ?? 0) + 1
    );
  }

  return (courses ?? []).map(c => {
    const programSlug = (c.programs as { slug: string } | null)?.slug ?? null;
    const bp = programSlug ? bpByProgramSlug.get(programSlug) : undefined;
    const actualLessons = lessonCountByCourseId.get(c.id) ?? 0;
    const expectedLessons = bp
      ? bp.expectedLessonCount > 0
        ? bp.expectedLessonCount
        : bp.expectedModuleCount * 8
      : 0;

    return {
      id: c.id,
      slug: c.slug ?? null,
      title: c.title,
      programId: c.program_id ?? null,
      programSlug,
      blueprintSlug: bp?.credentialSlug ?? null,
      blueprintId: bp?.id ?? null,
      expectedLessons,
      expectedModules: bp?.expectedModuleCount ?? 0,
      actualLessons,
      status: deriveStatus(expectedLessons, actualLessons),
      isActive: c.is_active ?? false,
      updatedAt: c.updated_at ?? null,
    };
  });
}
