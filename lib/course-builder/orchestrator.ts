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
import { loadBlueprintWithProgram } from '../course-factory/blueprint-loader';
import { buildAuthoredCoursePackage } from '../course-factory/authored-content-compiler';
import { upgradePersistedAuthoredCourse } from '../course-factory/persisted-authored-upgrade';
import { runGovernmentProcurementGate } from '../course-factory/procurement-gate';
import { auditCourseTemplate } from './audit';
import type { ProgramBuilderTemplate } from './schema';
import { adaptProgramTemplateToBlueprint } from './publish-adapter';
import { requireAdminClient } from '../supabase/admin';
import { assertCourseBuilderGenerationEnabled } from './generation-control';

const courseProgramConfigSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  credentialTarget: z.enum([
    'INTERNAL',
    'STATE_BOARD',
    'IC&RC',
    'NAADAC',
    'CUSTOM',
    'DOL_APPRENTICESHIP',
  ]),
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
    credentialTarget: z.enum([
      'INTERNAL',
      'STATE_BOARD',
      'IC&RC',
      'NAADAC',
      'CUSTOM',
      'DOL_APPRENTICESHIP',
    ]),
    governingBody: z.string().nullable().optional(),
    governingRegion: z.string().nullable().optional(),
    governingStandardVersion: z.string().nullable().optional(),
    retentionPolicyDays: z.number().nullable().optional(),
    auditNotes: z.string().nullable().optional(),
  }),
  status: z.enum(['draft', 'published']).default('draft'),
});

async function resolveRegisteredBlueprint(input: FactoryInput) {
  if (input.blueprint) return input.blueprint;
  if (!input.programId && !input.programSlug) return null;
  const db = await requireAdminClient();
  const loaded = await loadBlueprintWithProgram(db, {
    programId: input.programId,
    programSlug: input.programSlug,
  });
  return loaded?.blueprint ?? null;
}

async function queueUpgradedMediaIfRequested(
  input: FactoryInput,
  result: FactoryOutput,
): Promise<FactoryOutput> {
  if (input.videoMode !== 'queue' || !result.courseId || input.dryRun) return result;
  const media = await queueCourseLessonVideos({
    courseId: result.courseId,
    onlyMissing: true,
    limit: input.videoQueueLimit ?? null,
  });
  return {
    ...result,
    videosQueued: media.queued + media.microclipsQueued,
    lessonVideosQueued: media.queued,
    microclipsQueued: media.microclipsQueued,
    warnings: [
      ...(result.warnings ?? []),
      ...(media.failed > 0
        ? [`${media.failed} media enqueue attempt(s) failed and remain retryable.`]
        : []),
    ],
  };
}

/**
 * Public compatibility facade. Raw application callers no longer reach factory.ts directly.
 *
 * There are exactly three explicit content paths:
 * 1. `blueprint` compiles complete authored source already embedded in a blueprint.
 * 2. `curriculum_lessons` upgrades an identified persisted course from its
 *    authored curriculum records without replacing identity or learner state.
 * 3. `ai` generates a complete strict package and fails when inference or the
 *    content contract fails. Generic fallback lessons are never published.
 */
export async function courseFactory(
  input: FactoryInput,
  progress?: ProgressCallback,
): Promise<FactoryOutput> {
  const controlDb = await requireAdminClient();
  await assertCourseBuilderGenerationEnabled(controlDb, input.courseId);
  if (input.contentSource === 'curriculum_lessons') {
    if (!input.courseId) {
      return {
        ok: false,
        errors: ['courseId is required for an authored persisted-curriculum upgrade'],
        videosQueued: 0,
      };
    }
    progress?.('resolve', 'Loading the identified persisted authored curriculum.', 10);
    const upgraded = await upgradePersistedAuthoredCourse(input.courseId);
    progress?.('validate', 'All lessons passed the universal interactive contract.', 85);
    const result: FactoryOutput = {
      ok: true,
      courseId: upgraded.courseId,
      courseSlug: upgraded.courseSlug,
      moduleCount: upgraded.moduleCount,
      lessonCount: upgraded.lessonCount,
      assessmentsGenerated: 0,
      videosQueued: 0,
    };
    const withMedia = await queueUpgradedMediaIfRequested(input, result);
    progress?.('complete', 'Authored course upgrade completed.', 100);
    return withMedia;
  }

  const registeredBlueprint = await resolveRegisteredBlueprint(input);
  if (input.contentSource === 'blueprint') {
    if (!registeredBlueprint) {
      return { ok: false, errors: ['A complete authored blueprint is required'], videosQueued: 0 };
    }
    const courseTitle =
      input.title || registeredBlueprint.title || registeredBlueprint.credentialTitle;
    const authoredBlueprint = buildAuthoredCoursePackage(registeredBlueprint, courseTitle);
    return executeCourseFactory(
      { ...input, blueprint: authoredBlueprint, contentSource: 'blueprint' },
      progress,
    );
  }

  return executeCourseFactory(
    registeredBlueprint ? { ...input, blueprint: registeredBlueprint, contentSource: 'ai' } : input,
    progress,
  );
}

export async function saveCourseProgramConfiguration(input: unknown) {
  const body = courseProgramConfigSchema.parse(input);
  const db = await requireAdminClient();
  const payload = {
    title: body.title,
    slug: body.slug,
    description: body.description ?? '',
    is_active: body.isActive ?? true,
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
  const result = await courseFactory(
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

  const governance =
    result.ok && result.courseId
      ? await normalizeGeneratedCourseForGovernance(result.courseId)
      : null;

  return { ...gate, ok: gate.ok && result.ok, result, governance };
}

export async function repairCanonicalCourse(courseId: string, progress?: ProgressCallback) {
  const db = await requireAdminClient();
  const { data: course, error } = await db
    .from('courses')
    .select('id,slug,title,program_id')
    .eq('id', courseId)
    .maybeSingle();

  if (error) throw error;
  if (!course) throw new Error('Course not found');

  const result = await courseFactory(
    {
      courseId,
      programId: course.program_id ?? undefined,
      programSlug: course.slug,
      mode: 'missing-only',
      contentSource: 'curriculum_lessons',
      videoMode: 'queue',
    },
    progress,
  );

  const governance =
    result.ok && result.courseId
      ? await normalizeGeneratedCourseForGovernance(result.courseId)
      : null;

  return { ...result, governance, repairedCourseId: courseId, programSlug: course.slug };
}

export async function queueCourseMedia(input: {
  courseId: string;
  lessonId?: string | null;
  onlyMissing?: boolean;
  force?: boolean;
  limit?: number | null;
}) {
  return queueCourseLessonVideos(input);
}

export { normalizeGeneratedCourseForGovernance } from '../course-factory/post-generation-governance';
