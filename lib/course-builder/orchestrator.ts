/**
 * Canonical Course Builder server orchestration.
 *
 * Application traffic must cross this layer before the private Course Factory
 * execution engine. Studio controls this layer; LMS only consumes published
 * courses and learner state.
 */
import { z } from 'zod';
import { courseFactory as executeCourseFactory } from '../course-factory/factory';
import type { FactoryInput, FactoryOutput, ProgressCallback } from '../course-factory/types';
import { normalizeGeneratedCourseForGovernance } from '../course-factory/post-generation-governance';
import { queueCourseLessonVideos } from '../course-factory/media-service';
import { runGovernmentProcurementGate } from '../course-factory/procurement-gate';
import { auditCourseTemplate } from './audit';
import type { ProgramBuilderTemplate } from './schema';
import { adaptProgramTemplateToBlueprint } from './publish-adapter';
import { requireAdminClient } from '../supabase/admin';

const courseProgramConfigSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  credentialTarget: z.enum(['INTERNAL','STATE_BOARD','IC&RC','NAADAC','CUSTOM','DOL_APPRENTICESHIP']),
  minimumHours: z.number().positive(),
  requiresFinalExam: z.boolean(),
  finalExam: z.object({
    required: z.boolean(),
    questionCount: z.number().optional(),
    passingScore: z.number().optional(),
    timeLimitMinutes: z.number().optional(),
    domainDistribution: z.record(z.string(), z.number()).optional(),
    competencyKeys: z.array(z.string()).optional(),
  }),
  certificateRequirements: z.object({
    includeHours: z.boolean(),
    includeCompetencies: z.boolean(),
    includeInstructorVerification: z.boolean(),
    includeCompletionDate: z.boolean(),
    includeVerificationUrl: z.boolean(),
    requireAllCriticalCompetencies: z.boolean().optional(),
  }),
  regulatory: z.object({
    complianceProfileKey: z.string().min(1),
    credentialTarget: z.enum(['INTERNAL','STATE_BOARD','IC&RC','NAADAC','CUSTOM','DOL_APPRENTICESHIP']),
    governingBody: z.string().nullable().optional(),
    governingRegion: z.string().nullable().optional(),
    governingStandardVersion: z.string().nullable().optional(),
    retentionPolicyDays: z.number().nullable().optional(),
    auditNotes: z.string().nullable().optional(),
  }),
  status: z.enum(['draft','published']).default('draft'),
});

/** Public compatibility facade. Raw application callers no longer reach factory.ts directly. */
export async function courseFactory(
  input: FactoryInput,
  progress?: ProgressCallback,
): Promise<FactoryOutput> {
  return executeCourseFactory(input, progress);
}

export async function saveCourseProgramConfiguration(input: unknown) {
  const body = courseProgramConfigSchema.parse(input);
  const db = await requireAdminClient();
  const payload = {
    title: body.title,
    slug: body.slug,
    status: body.status,
    duration_hours: body.minimumHours,
    compliance_profile_key: body.regulatory.complianceProfileKey,
    governing_body: body.regulatory.governingBody ?? null,
    governing_region: body.regulatory.governingRegion ?? null,
    governing_standard_version: body.regulatory.governingStandardVersion ?? null,
    metadata: {
      credentialTarget: body.credentialTarget,
      minimumHours: body.minimumHours,
      requiresFinalExam: body.requiresFinalExam,
      finalExam: body.finalExam,
      certificateRequirements: body.certificateRequirements,
      regulatory: body.regulatory,
    },
  };

  const query = body.id
    ? db.from('courses').update(payload).eq('id', body.id)
    : db.from('courses').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data;
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
