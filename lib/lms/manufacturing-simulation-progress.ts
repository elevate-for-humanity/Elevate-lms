import 'server-only';
import type { SupabaseClient } from '@/lib/supabase';
import { MANUFACTURING_COURSE_ID } from './manufacturing-workbook-contract';
import { resolveStoredLessonExperience } from '@/lib/course-factory/mastery-policy';
import {
  evaluateManufacturingSimulation,
  parseManufacturingSimulation,
} from './manufacturing-simulation';

/** Gate online practice only. Employer signoff and practical hours remain separate. */
export async function hasRequiredManufacturingSimulation(
  db: SupabaseClient,
  courseId: string,
  lessonId: string,
  learnerId: string,
): Promise<boolean> {
  if (courseId !== MANUFACTURING_COURSE_ID) return true;
  const lesson = await db
    .from('course_lessons')
    .select('id,slug,content_json,content')
    .eq('id', lessonId)
    .eq('course_id', courseId)
    .maybeSingle();
  if (lesson.error) throw new Error('Virtual practice requirement could not be verified.');
  if (!lesson.data) return false;
  const experience = resolveStoredLessonExperience(lesson.data.content_json, lesson.data.content);
  if (experience?.manufacturingSimulation === undefined) return true;
  const spec = parseManufacturingSimulation(experience.manufacturingSimulation);
  if (!spec) return false;
  const attempt = await db
    .from('interaction_progress')
    .select('answers')
    .eq('learner_id', learnerId)
    .eq('course_id', courseId)
    .eq('lesson_id', lessonId)
    .eq('interaction_id', `${lesson.data.slug}-manufacturing`)
    .maybeSingle();
  if (attempt.error) throw new Error('Saved virtual practice could not be verified.');
  // RLS permits learners to manage practice rows. Recompute the result from
  // saved responses and canonical content instead of trusting the score flag.
  return evaluateManufacturingSimulation(spec, attempt.data?.answers)?.completed === true;
}
