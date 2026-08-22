/**
 * Canonical Course Builder server orchestration.
 *
 * Application traffic must cross this layer before the private Course Factory
 * execution engine. Studio controls this layer; LMS only consumes published
 * courses and learner state.
 */
import { courseFactory as executeCourseFactory } from '../course-factory/factory';
import type { FactoryInput, FactoryOutput, ProgressCallback } from '../course-factory/types';
import { normalizeGeneratedCourseForGovernance } from '../course-factory/post-generation-governance';
import { queueCourseLessonVideos } from '../course-factory/media-service';
import { runGovernmentProcurementGate } from '../course-factory/procurement-gate';
import { auditCourseTemplate } from './audit';
import type { ProgramBuilderTemplate } from './schema';
import { adaptProgramTemplateToBlueprint } from './publish-adapter';
import { requireAdminClient } from '../supabase/admin';

/** Public compatibility facade. Raw application callers no longer reach factory.ts directly. */
export async function courseFactory(
  input: FactoryInput,
  progress?: ProgressCallback,
): Promise<FactoryOutput> {
  return executeCourseFactory(input, progress);
}

export function auditCourseGovernance(template: ProgramBuilderTemplate) {
  const audit = auditCourseTemplate(template);
  const procurement = runGovernmentProcurementGate(template);
  return { ok: audit.ok && procurement.ok, audit, procurement };
}

export async function publishGovernedCourse(
  template: ProgramBuilderTemplate,
  progress?: ProgressCallback,
) {
  const gate = auditCourseGovernance(template);
  if (!gate.ok) {
    return {
      ok: false,
      error: 'Publication blocked by course governance gate',
      ...gate,
      result: null,
      governance: null,
    };
  }

  const blueprint = adaptProgramTemplateToBlueprint(template);
  const result = await executeCourseFactory(
    {
      programId: template.programId,
      programSlug: template.programId ? undefined : template.slug,
      blueprint,
      mode: 'refresh',
      contentSource: 'ai',
      videoMode: 'queue',
    },
    progress,
  );

  const governance = result.ok && result.courseId
    ? await normalizeGeneratedCourseForGovernance(result.courseId)
    : null;

  return { ...gate, ok: gate.ok && result.ok, result, governance };
}

export async function repairCanonicalCourse(courseId: string, progress?: ProgressCallback) {
  const db = await requireAdminClient();
  const { data: course, error } = await db
    .from('courses')
    .select('id,slug,title,program_id,programs(slug)')
    .eq('id', courseId)
    .maybeSingle();

  if (error) throw error;
  if (!course) throw new Error('Course not found');

  const relatedPrograms = course.programs as unknown as Array<{ slug: string }> | { slug: string } | null;
  const programSlug = Array.isArray(relatedPrograms)
    ? relatedPrograms[0]?.slug ?? null
    : relatedPrograms?.slug ?? null;
  const programId = course.program_id as string | null;

  if (!programId || !programSlug) throw new Error('Course is not linked to a canonical program');

  const result = await executeCourseFactory(
    {
      programId,
      programSlug,
      mode: 'missing-only',
      contentSource: 'ai',
      videoMode: 'queue',
    },
    progress,
  );

  const governance = result.ok && result.courseId
    ? await normalizeGeneratedCourseForGovernance(result.courseId)
    : null;

  return { ...result, governance, repairedCourseId: courseId, programSlug };
}

export async function queueCourseMedia(input: {
  courseId: string;
  onlyMissing?: boolean;
  force?: boolean;
  limit?: number | null;
}) {
  return queueCourseLessonVideos(input);
}

export { normalizeGeneratedCourseForGovernance } from '../course-factory/post-generation-governance';
