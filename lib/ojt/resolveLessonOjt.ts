import { getAdminClient } from '@/lib/supabase/admin';

export interface LessonOjtMeta {
  required_skill_id: string | null;
  required_reps: number;
  requires_verification: boolean;
  lesson_type: string;           // 'lab' | 'lesson' | 'quiz' | etc.
  course_id: string | null;
  skill: { name: string; description: string } | null;
  /** Which table the lesson was resolved from — for audit/debugging. */
  source: 'course_lessons' | 'curriculum_lessons';
}

/**
 * Canonical OJT lesson resolver.
 *
 * Precedence: course_lessons (barber + blueprint programs) → curriculum_lessons (HVAC legacy).
 * Returns null if the lesson ID exists in neither table.
 *
 * All OJT-touching routes MUST use this function. Do not inline the dual-table
 * lookup in individual routes — that is how the tables drift out of sync.
 *
 * Used by:
 *   - lib/ojt/canCompleteLesson.ts
 *   - app/api/lessons/[lessonId]/ojt-status/route.ts
 *   - app/api/lessons/[lessonId]/ojt-log/route.ts
 */
export async function resolveLessonOjt(
  db: Awaited<ReturnType<typeof getAdminClient>>,
  lessonId: string,
): Promise<LessonOjtMeta | null> {
  // course_lessons — barber apprenticeship and all blueprint-driven programs
  const { data: cl } = await db
    .from('course_lessons')
    .select(`
      required_skill_id,
      required_reps,
      requires_verification,
      lesson_type,
      course_id,
      apprentice_skills (
        name,
        description
      )
    `)
    .eq('id', lessonId)
    .maybeSingle();

  if (cl) {
    return {
      required_skill_id:    cl.required_skill_id,
      required_reps:        cl.required_reps ?? 0,
      requires_verification: cl.requires_verification ?? false,
      lesson_type:          cl.lesson_type ?? 'lesson',
      course_id:            cl.course_id,
      skill:                cl.apprentice_skills as { name: string; description: string } | null,
      source:               'course_lessons',
    };
  }

  // curriculum_lessons — HVAC legacy fallback
  const { data: cul } = await db
    .from('curriculum_lessons')
    .select(`
      required_skill_id,
      required_reps,
      requires_verification,
      step_type,
      course_id,
      apprentice_skills (
        name,
        description
      )
    `)
    .eq('id', lessonId)
    .maybeSingle();

  if (cul) {
    return {
      required_skill_id:    cul.required_skill_id,
      required_reps:        cul.required_reps ?? 0,
      requires_verification: cul.requires_verification ?? false,
      lesson_type:          cul.step_type ?? 'lesson',
      course_id:            cul.course_id,
      skill:                cul.apprentice_skills as { name: string; description: string } | null,
      source:               'curriculum_lessons',
    };
  }

  return null;
}
