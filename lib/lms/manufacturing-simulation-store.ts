import 'server-only';
import type { SupabaseClient } from '@/lib/supabase';
import {
  parseManufacturingSimulation,
  parsePublicManufacturingSimulation,
  publicManufacturingSimulation,
  type ManufacturingSimulationSpec,
} from './manufacturing-simulation';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** Call only after the lesson access gate, or from an authorized admin preview. */
export async function loadManufacturingSimulationSpec(
  privateDb: SupabaseClient,
  courseId: string,
  lessonId: string,
  publicValue: unknown,
): Promise<ManufacturingSimulationSpec> {
  const problem = parsePublicManufacturingSimulation(publicValue);
  if (!problem?.gradingKeyId) throw new Error('Virtual practice problem has not passed protected authoring.');
  const { data, error } = await privateDb
    .from('manufacturing_simulation_specs')
    .select('id,spec')
    .eq('id', problem.gradingKeyId)
    .eq('course_id', courseId)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (error) throw new Error('Virtual practice grading could not be verified.');
  const spec = data ? parseManufacturingSimulation({ ...data.spec, gradingKeyId: data.id }) : null;
  if (!spec || canonical(publicManufacturingSimulation(spec)) !== canonical(publicManufacturingSimulation(problem))) {
    throw new Error('Virtual practice grading does not match the current lesson.');
  }
  return spec;
}

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

/** Validate grading references before course copies or rollback perform any writes. */
export async function assertManufacturingLessonSpecs(
  privateDb: SupabaseClient,
  courseId: string,
  lessons: Array<Record<string, any>>,
) {
  for (const lesson of lessons) {
    for (const source of [lesson.content_json, lesson.content]) {
      let content = source;
      if (typeof content === 'string') {
        try { content = JSON.parse(content); } catch { continue; }
      }
      const spec = content?.experience?.manufacturingSimulation;
      if (spec !== undefined && spec !== null) {
        await loadManufacturingSimulationSpec(privateDb, courseId, lesson.id, spec);
      }
    }
  }
}
