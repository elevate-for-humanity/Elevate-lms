import 'server-only';
import type { SupabaseClient } from '@/lib/supabase';
import { MANUFACTURING_COURSE_ID } from './manufacturing-workbook-contract';
import { resolveStoredLessonExperience } from '@/lib/course-factory/mastery-policy';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  evaluateManufacturingSimulation,
} from './manufacturing-simulation';
import { loadManufacturingSimulationSpec, loadManufacturingSimulationProgress } from './manufacturing-simulation-store';

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
  const privateDb = await requireAdminClient();
  const spec = await loadManufacturingSimulationSpec(
    privateDb, courseId, lessonId, experience.manufacturingSimulation,
  );
  const attempt = await loadManufacturingSimulationProgress(
    privateDb, learnerId, courseId, lessonId, `${lesson.data.slug}-manufacturing`, spec.gradingKeyId!,
  );
  // A learner-editable generic progress row is never evidence of a server attempt.
  return evaluateManufacturingSimulation(spec, attempt?.answers)?.completed === true;
}
