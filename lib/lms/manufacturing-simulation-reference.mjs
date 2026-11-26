import {
  parseManufacturingSimulation,
  parsePublicManufacturingSimulation,
  publicManufacturingSimulation,
} from './manufacturing-simulation.ts';

// Injected-client verification is shared by native Node workspace operations and
// the server-only LMS store. This module creates no client or credentials; the
// protected table's grants still require the caller's authorized service client.
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/**
 * Call only after the lesson access gate, or from authorized course authoring.
 * @param {import('@/lib/supabase').SupabaseClient} privateDb
 * @param {string} courseId
 * @param {string} lessonId
 * @param {unknown} publicValue
 * @returns {Promise<import('./manufacturing-simulation').ManufacturingSimulationSpec>}
 */
export async function loadManufacturingSimulationSpec(
  privateDb,
  courseId,
  lessonId,
  publicValue,
) {
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

/**
 * Validate every non-null mirror before copies or rollback perform any writes.
 * @param {import('@/lib/supabase').SupabaseClient} privateDb
 * @param {string} courseId
 * @param {Array<Record<string, any>>} lessons
 */
export async function assertManufacturingLessonSpecs(
  privateDb,
  courseId,
  lessons,
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
