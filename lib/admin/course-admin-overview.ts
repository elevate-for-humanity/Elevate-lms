import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { loadAllBlueprints } from '@/lib/curriculum/load-blueprint';
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
  const supabase = await requireAdminClient();
  const blueprints = await loadAllBlueprints();
  const bpByProgramSlug = new Map(blueprints.filter((bp) => bp.programSlug).map((bp) => [bp.programSlug, bp]));

  const { data: courses, error } = await supabase
    .from('courses')
    .select('id,slug,title,program_id,is_active,status,updated_at,programs(slug)')
    .order('title', { ascending: true });
  if (error) {
    logger.error('[getAdminCoursesOverview] query failed', error instanceof Error ? error : undefined);
    return [];
  }

  const { data: lessonRows } = await supabase.from('course_lessons').select('course_id');
  const lessonCountByCourseId = new Map<string, number>();
  for (const row of lessonRows ?? []) {
    lessonCountByCourseId.set(row.course_id, (lessonCountByCourseId.get(row.course_id) ?? 0) + 1);
  }

  return (courses ?? []).map((course: any) => {
    const programRelation = Array.isArray(course.programs) ? course.programs[0] : course.programs;
    const programSlug = programRelation?.slug ?? null;
    const blueprint = programSlug ? bpByProgramSlug.get(programSlug) : undefined;
    const actualLessons = lessonCountByCourseId.get(course.id) ?? 0;
    const expectedLessons = blueprint ? (blueprint.expectedLessonCount > 0 ? blueprint.expectedLessonCount : blueprint.expectedModuleCount * 8) : 0;
    return {
      id: course.id,
      slug: course.slug ?? null,
      title: course.title,
      programId: course.program_id ?? null,
      programSlug,
      blueprintSlug: blueprint?.credentialSlug ?? null,
      blueprintId: blueprint?.id ?? null,
      expectedLessons,
      expectedModules: blueprint?.expectedModuleCount ?? 0,
      actualLessons,
      status: deriveStatus(expectedLessons, actualLessons),
      isActive: course.is_active ?? false,
      updatedAt: course.updated_at ?? null,
    };
  });
}
