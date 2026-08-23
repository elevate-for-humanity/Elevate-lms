/**
 * Canonical Course Builder server orchestration.
 *
 * Application traffic must cross this layer before the private Course Factory
 * execution engine. Studio controls this layer; LMS only consumes published
 * courses and learner state.
 */
import { z } from 'zod';
import { isAIAvailable } from '../ai/ai-service';
import { logger } from '../logger';
import { courseFactory as executeCourseFactory } from '../course-factory/factory';
import type { FactoryInput, FactoryOutput, ProgressCallback } from '../course-factory/types';
import { normalizeGeneratedCourseForGovernance } from '../course-factory/post-generation-governance';
import { queueCourseLessonVideos } from '../course-factory/media-service';
import { loadBlueprintWithProgram } from '../course-factory/blueprint-loader';
import { buildDeterministicCoursePackage } from '../course-factory/deterministic-package';
import { runGovernmentProcurementGate } from '../course-factory/procurement-gate';
import { auditCourseTemplate } from './audit';
import type { ProgramBuilderTemplate } from './schema';
import { adaptProgramTemplateToBlueprint } from './publish-adapter';
import { requireAdminClient } from '../supabase/admin';

const courseProgramConfigSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
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

async function queueBaselineMediaIfRequested(
  input: FactoryInput,
  baseline: FactoryOutput,
): Promise<FactoryOutput> {
  if (input.videoMode !== 'queue' || !baseline.courseId || input.dryRun) return baseline;
  const media = await queueCourseLessonVideos({
    courseId: baseline.courseId,
    onlyMissing: true,
    limit: input.videoQueueLimit ?? null,
  });
  return {
    ...baseline,
    videosQueued: media.queued + media.microclipsQueued,
    lessonVideosQueued: media.queued,
    microclipsQueued: media.microclipsQueued,
    warnings: [
      ...(baseline.warnings ?? []),
      ...(media.failed > 0 ? [`${media.failed} deterministic media enqueue attempt(s) failed and remain retryable.`] : []),
    ],
  };
}

/**
 * Public compatibility facade. Raw application callers no longer reach factory.ts directly.
 *
 * Registered-blueprint complete-content builds are baseline-first:
 * 1. Assemble and persist a substantive deterministic package through the existing private factory.
 * 2. Attempt AI enrichment only after that durable package exists.
 * 3. If inference is unavailable/exhausted, retain the baseline and queue its media instead of failing.
 *
 * Free-form course creation still needs inference to invent a blueprint; registered courses do not.
 */
export async function courseFactory(
  input: FactoryInput,
  progress?: ProgressCallback,
): Promise<FactoryOutput> {
  if (input.contentSource === 'blueprint') {
    return executeCourseFactory(input, progress);
  }

  const registeredBlueprint = await resolveRegisteredBlueprint(input);
  if (!registeredBlueprint) {
    return executeCourseFactory(input, progress);
  }

  const courseTitle = input.title || registeredBlueprint.title || registeredBlueprint.credentialTitle;
  const deterministicBlueprint = buildDeterministicCoursePackage(registeredBlueprint, courseTitle);
  const baseline = await executeCourseFactory(
    {
      ...input,
      blueprint: deterministicBlueprint,
      contentSource: 'blueprint',
      videoMode: 'off',
    },
    progress,
  );
  if (!baseline.ok) return baseline;

  const requestedSource = input.contentSource ?? 'ai';
  if (requestedSource === 'ai' && isAIAvailable()) {
    try {
      const enriched = await executeCourseFactory(
        {
          ...input,
          blueprint: deterministicBlueprint,
          contentSource: 'ai',
        },
        progress,
      );
      if (enriched.ok) return enriched;
      logger.warn('[course-builder] AI enrichment returned an incomplete result; preserving deterministic baseline', {
        courseId: baseline.courseId,
        errors: enriched.errors,
      });
      return queueBaselineMediaIfRequested(input, {
        ...baseline,
        warnings: [
          ...(baseline.warnings ?? []),
          'AI enrichment did not complete. The deterministic baseline was preserved and remains the authoritative course package.',
        ],
      });
    } catch (error) {
      logger.warn('[course-builder] AI enrichment failed; preserving deterministic baseline', {
        courseId: baseline.courseId,
        error: error instanceof Error ? error.message : String(error),
      });
      return queueBaselineMediaIfRequested(input, {
        ...baseline,
        warnings: [
          ...(baseline.warnings ?? []),
          'AI enrichment was unavailable. The deterministic baseline was preserved and media generation continues from that package.',
        ],
      });
    }
  }

  return queueBaselineMediaIfRequested(input, {
    ...baseline,
    warnings: [
      ...(baseline.warnings ?? []),
      ...(requestedSource === 'ai'
        ? ['No healthy AI provider was available. The deterministic baseline completed without external inference.']
        : []),
    ],
  });
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

  const result = await courseFactory(
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
  lessonId?: string | null;
  onlyMissing?: boolean;
  force?: boolean;
  limit?: number | null;
}) {
  return queueCourseLessonVideos(input);
}

export { normalizeGeneratedCourseForGovernance } from '../course-factory/post-generation-governance';
