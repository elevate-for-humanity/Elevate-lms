import 'server-only';
import type { SupabaseClient } from '@/lib/supabase';
export { loadManufacturingSimulationSpec, assertManufacturingLessonSpecs } from './manufacturing-simulation-reference.ts';

/** This service-only table is never reconstructed from learner-editable progress. */
export async function loadManufacturingSimulationProgress(
  privateDb: SupabaseClient,
  learnerId: string,
  courseId: string,
  lessonId: string,
  interactionId: string,
  gradingKeyId: string,
) {
  const { data, error } = await privateDb
    .from('manufacturing_simulation_progress')
    .select('interaction_id,answers,attempts,score,completed,feedback,updated_at')
    .eq('learner_id', learnerId)
    .eq('course_id', courseId)
    .eq('lesson_id', lessonId)
    .eq('interaction_id', interactionId)
    .eq('spec_id', gradingKeyId)
    .maybeSingle();
  if (error) throw new Error('Saved virtual practice could not be verified.');
  return data;
}
