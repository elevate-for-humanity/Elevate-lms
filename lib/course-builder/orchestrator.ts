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
import { evaluatePersistedCredentialCourse } from '../course-factory/canonical-course-gate';
import { REQUIRED_COURSE_GATES, type CourseGate } from '../course-package/readiness';

export const COURSE_BUILDER_GATE_REPAIR_POLICY: Record<CourseGate, {
  phase: 'authoring' | 'media' | 'review';
  automatic: boolean;
  repairScope: readonly string[];
}> = {
  credential_alignment: { phase: 'authoring', automatic: false, repairScope: ['credential_metadata','competency_mapping'] },
  learning_objectives: { phase: 'authoring', automatic: true, repairScope: ['objectives','competency_mapping'] },
  instructional_content: { phase: 'authoring', automatic: true, repairScope: ['content','reading_guide','resources'] },
  demonstration: { phase: 'media', automatic: true, repairScope: ['storyboard','lesson_video','demonstration'] },
  storyboard: { phase: 'authoring', automatic: true, repairScope: ['instructional_timeline','storyboard'] },
  technical_review: { phase: 'review', automatic: false, repairScope: ['technical_review'] },
  interactive_practice: { phase: 'authoring', automatic: true, repairScope: ['scenario','case_study','exercises','practical_task','interactives'] },
  knowledge_checks: { phase: 'authoring', automatic: true, repairScope: ['knowledge_checks','remediation'] },
  module_assessments: { phase: 'authoring', automatic: false, repairScope: ['module_assessments'] },
  practice_exam: { phase: 'authoring', automatic: false, repairScope: ['practice_exam'] },
  narration: { phase: 'authoring', automatic: true, repairScope: ['narration','transcript'] },
  visual_alignment: { phase: 'media', automatic: true, repairScope: ['visuals','storyboard','media_provenance'] },
  captions: { phase: 'media', automatic: true, repairScope: ['captions'] },
  transcript: { phase: 'authoring', automatic: true, repairScope: ['transcript','narration'] },
  accessibility: { phase: 'review', automatic: false, repairScope: ['accessibility_review'] },
  learner_preview: { phase: 'review', automatic: false, repairScope: ['learner_preview'] },
  progress_tracking: { phase: 'media', automatic: true, repairScope: ['timeline','completion_rules'] },
  resume_tracking: { phase: 'media', automatic: true, repairScope: ['timeline','resume_state'] },
};

const AUTHORING_AUTOMATIC_GATES = new Set<CourseGate>(
  REQUIRED_COURSE_GATES.filter((gate) => {
    const policy = COURSE_BUILDER_GATE_REPAIR_POLICY[gate];
    return policy.phase === 'authoring' && policy.automatic;
  }),
);
const POST_AUTHORING_GATES = new Set<CourseGate>(
  REQUIRED_COURSE_GATES.filter((gate) => COURSE_BUILDER_GATE_REPAIR_POLICY[gate].phase !== 'authoring'),
);

export const COURSE_BUILDER_BLUEPRINT_STEPS = REQUIRED_COURSE_GATES.map((gate, index) => ({
  order: index + 1,
  gate,
  repairScope: COURSE_BUILDER_GATE_REPAIR_POLICY[gate].repairScope,
})) as ReadonlyArray<{order:number;gate:CourseGate;repairScope:readonly string[]}>;

export async function walkCourseBuilderBlueprint(courseId: string) {
  const readiness = await evaluatePersistedCredentialCourse(courseId);
  return COURSE_BUILDER_BLUEPRINT_STEPS.map((step) => ({
    ...step,
    pass: readiness.gates[step.gate],
    findings: readiness.findings.filter((finding) => finding.gate === step.gate),
    action: readiness.gates[step.gate] ? 'preserve' : 'repair_component',
  }));
}

const courseProgramConfigSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  credentialTarget: z.enum([
    'INTERNAL',
    'STATE_BOARD',
    'FEDERAL',
    'MICROSOFT',
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
      'FEDERAL',
      'MICROSOFT',
      'IC&RC',
      'NAADAC',
      'CUSTOM',
      'DOL_APPRENTICESHIP',
    ]),
    governingBody: z.string().nullable().optional(),
    governingRegion: z.string().nullable().optional(),
    governingStandardVersion: z.string().nullable().optional(),
    standardSourceUrl: z.string().url().nullable().optional(),
    standardEffectiveDate: z.string().date().nullable().optional(),
    standardStatus: z.enum(['active', 'retired', 'superseded', 'draft']).nullable().optional(),
    standardRegistryKey: z.string().min(1).nullable().optional(),
    standardFingerprint: z.string().min(16).nullable().optional(),
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

async function verifyUpgradedMediaBoundToLessons(
  input: FactoryInput,
  result: FactoryOutput,
): Promise<FactoryOutput> {
  if (input.videoMode !== 'queue' || !result.courseId || input.dryRun) return result;
  const db = await requireAdminClient();
  const [{ data: lessons, error: lessonError }, { data: jobs, error: jobError }] =
    await Promise.all([
      db.from('course_lessons').select('id').eq('course_id', result.courseId),
      db
        .from('video_jobs')
        .select('id,lesson_id,status')
        .eq('course_id', result.courseId)
        .eq('asset_kind', 'lesson'),
    ]);
  if (lessonError) throw lessonError;
  if (jobError) throw jobError;
  const lessonIds = new Set((lessons ?? []).map((lesson) => lesson.id));
  const jobLessonIds = new Set((jobs ?? []).map((job) => job.lesson_id));
  const missing = [...lessonIds].filter((lessonId) => !jobLessonIds.has(lessonId));
  if (missing.length) {
    return {
      ...result,
      ok: false,
      errors: [
        ...(result.errors ?? []),
        `Atomic lesson/media contract failed: ${missing.length} lesson(s) have no canonical primary media job.`,
      ],
    };
  }
  return {
    ...result,
    videosQueued: (jobs ?? []).filter((job) =>
      ['queued', 'rendering', 'complete'].includes(String(job.status)),
    ).length,
    lessonVideosQueued: (jobs ?? []).length,
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
    const beforeRepair = await evaluatePersistedCredentialCourse(input.courseId);
    const failedLessonIds = [
      ...new Set(
        beforeRepair.findings
          .filter((finding) =>
            finding.gate !== 'identity' &&
            AUTHORING_AUTOMATIC_GATES.has(finding.gate as CourseGate),
          )
          .map((finding) => finding.lessonId)
          .filter((lessonId): lessonId is string => Boolean(lessonId)),
      ),
    ];
    const upgraded =
      failedLessonIds.length === 0
        ? {
            ok: true as const,
            courseId: input.courseId,
            courseSlug: input.programSlug,
            moduleCount: undefined,
            lessonCount: undefined,
            repairedLessonCount: 0,
          }
        : await upgradePersistedAuthoredCourse(
            input.courseId,
            undefined,
            { lessonIds: failedLessonIds },
          );
    // Blueprint selective repair is iterative: only lessons named by failed
    // gates are recompiled. Passing lessons and learner state are preserved.
    progress?.('validate', 'Validating repaired components against the Course Builder Blueprint.', 85);
    const readiness = await evaluatePersistedCredentialCourse(upgraded.courseId);
    const authoringBlockers = readiness.findings.filter((finding) => {
      if (finding.gate === 'identity') return true;
      return !POST_AUTHORING_GATES.has(finding.gate as CourseGate);
    });
    if (authoringBlockers.length > 0) {
      return {
        ok: false,
        courseId: upgraded.courseId,
        courseSlug: upgraded.courseSlug,
        errors: authoringBlockers.map((finding) => `${finding.gate}: ${finding.message}`),
        videosQueued: 0,
        warnings: readiness.findings.map((finding) => `repair_required:${finding.gate}:${finding.message}`),
      };
    }
    const result: FactoryOutput = {
      ok: true,
      courseId: upgraded.courseId,
      courseSlug: upgraded.courseSlug,
      moduleCount: upgraded.moduleCount,
      lessonCount: upgraded.lessonCount,
      assessmentsGenerated: 0,
      videosQueued: 0,
    };
    const withMedia = await verifyUpgradedMediaBoundToLessons(input, result);
    const remaining = await evaluatePersistedCredentialCourse(upgraded.courseId);
    const remainingWarnings = remaining.findings.map(
      (finding) => `repair_required:${finding.gate}:${finding.message}`,
    );
    progress?.(
      remaining.pass ? 'complete' : 'media',
      remaining.pass
        ? 'Authored course upgrade completed against the full contract.'
        : 'Authoring contract passed; media/review gates remain in the production pipeline.',
      remaining.pass ? 100 : 95,
    );
    return {
      ...withMedia,
      completionState: remaining.pass ? 'ready_for_review' : 'media_pending',
      warnings: [...(withMedia.warnings ?? []), ...remainingWarnings],
    };
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

export type ContractWalkthroughStep = {
  order: number;
  gate: string;
  pass: boolean;
  message: string;
};

/** Walk the persisted course against the canonical contract in required gate order.
 * This is the single validation trace used by generation, repair, review, and publication. */
export async function validateCourseAgainstContract(courseId: string) {
  const readiness = await evaluatePersistedCredentialCourse(courseId);
  const steps: ContractWalkthroughStep[] = readiness.findings.map((finding, index) => ({
    order: index + 1,
    gate: finding.gate,
    pass: finding.pass !== false,
    message: finding.message,
  }));
  return {
    courseId,
    pass: readiness.pass,
    steps,
    failedGates: steps.filter((step) => !step.pass).map((step) => step.gate),
  };
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

  progress?.('contract', 'Walking the canonical course contract before repair.', 5);
  const before = await validateCourseAgainstContract(courseId);
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

  const after = await validateCourseAgainstContract(courseId);
  return { ...result, governance, repairedCourseId: courseId, programSlug: course.slug, contractValidation: { before, after } };
}

export async function queueCourseMedia(input: {
  courseId: string;
  lessonId?: string | null;
  onlyMissing?: boolean;
  force?: boolean;
  limit?: number | null;
  validateOnly?: boolean;
}) {
  return queueCourseLessonVideos(input);
}

export { normalizeGeneratedCourseForGovernance } from '../course-factory/post-generation-governance';
