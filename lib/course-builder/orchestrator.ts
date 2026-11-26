/**
 * Canonical Course Builder server orchestration — the ONE Course Builder.
 *
 * There used to be two builders: a "classic" Course Builder
 * (lib/course-builder template + orchestrator) and the Ultimate Course
 * Builder (lib/ultimate-course-builder). Generation already ran through
 * Ultimate (requestCanonicalGeneration, below), but the classic template
 * could never carry government job-feed data and the feed loader
 * (buildCourseEvidenceContext) was dead code. This module is now the single
 * surface: one template (ProgramBuilderTemplate, with socCode + funding +
 * workforceEvidence), one generation path (courseFactory ->
 * requestCanonicalGeneration), one job-feed loader
 * (attachJobFeedEvidence in ./workforce-evidence.ts), one gate
 * (auditCourseGovernance -> runGovernmentProcurementGate).
 *
 * Application generation delegates to the Ultimate execution engine. Studio controls this layer; LMS only consumes published
 * courses and learner state.
 */
import { z } from 'zod';
import { requestCanonicalGeneration } from '@/lib/ultimate-course-builder/core/generation-request';
import { getCurrentUser } from '@/lib/auth';
import type { FactoryInput, FactoryOutput, ProgressCallback } from '../course-factory/types';
import { normalizeGeneratedCourseForGovernance } from '../course-factory/post-generation-governance';
import { queueCourseLessonVideos } from '../course-factory/media-service';
import { runGovernmentProcurementGate } from '../course-factory/procurement-gate';
import { auditCourseTemplate } from './audit';
import type { ProgramBuilderTemplate } from './schema';
import { adaptProgramTemplateToBlueprint } from './publish-adapter';
import {
  applyPublishStandard,
  persistBuilderAlignment,
  persistBuilderAssignments,
  recordPublishOverride,
} from './publish-standard';
import type { PublishOverride } from './publish-checklist';
import { requireAdminClient } from '../supabase/admin';
import { assertCourseBuilderGenerationEnabled } from '@/lib/ultimate-course-builder/core/generation-control';
import { attachJobFeedEvidence } from './workforce-evidence';
import { logger } from '@/lib/logger';
import { evaluatePersistedCredentialCourse } from '../course-factory/canonical-course-gate';
import { REQUIRED_COURSE_GATES, type CourseGate } from '../course-package/readiness';
import { instructionalLessonSteps, assertInstructionalLessonPipeline, type InstructionalLessonStep } from './instructional-lesson-pipeline';

export const COURSE_BUILDER_GATE_REPAIR_POLICY: Record<CourseGate, {
  phase: 'authoring' | 'media' | 'review';
  automatic: boolean;
  repairScope: readonly string[];
}> = {
  standards: { phase: 'authoring', automatic: false, repairScope: ['credential_metadata','competency_mapping','standards'] },
  learning_objectives: { phase: 'authoring', automatic: true, repairScope: ['objectives','competency_mapping'] },
  prerequisites: { phase: 'authoring', automatic: true, repairScope: ['prerequisites'] },
  teaching_sequence: { phase: 'authoring', automatic: true, repairScope: ['instructional_sequence','reading_guide'] },
  instructional_script: { phase: 'authoring', automatic: true, repairScope: ['narration','instructional_script'] },
  storyboard: { phase: 'authoring', automatic: true, repairScope: ['instructional_timeline','storyboard'] },
  visual_assignment: { phase: 'media', automatic: true, repairScope: ['visuals','licensed_media','media_provenance'] },
  scene_build: { phase: 'media', automatic: true, repairScope: ['scenes','captions','transitions'] },
  natural_narration: { phase: 'media', automatic: true, repairScope: ['narration','voice','prosody'] },
  synchronization: { phase: 'media', automatic: true, repairScope: ['timeline','captions','visual_narration_alignment'] },
  active_teaching: { phase: 'authoring', automatic: true, repairScope: ['guided_practice','knowledge_checks','interactives'] },
  mistakes_and_corrections: { phase: 'authoring', automatic: true, repairScope: ['failure_modes','remediation','corrections'] },
  assessment_alignment: { phase: 'authoring', automatic: true, repairScope: ['knowledge_checks','assessments','objective_mapping'] },
  render: { phase: 'media', automatic: true, repairScope: ['lesson_video'] },
  finished_media_qa: { phase: 'media', automatic: true, repairScope: ['decoded_media','continuity','captions','audio'] },
  instructional_qa: { phase: 'review', automatic: false, repairScope: ['objective_evidence','procedure_evidence','teaching_quality'] },
  narration_qa: { phase: 'review', automatic: false, repairScope: ['voice_quality','pronunciation','cadence'] },
  learner_runthrough: { phase: 'review', automatic: false, repairScope: ['learner_preview','mobile','progress','resume'] },
  selective_repair: { phase: 'review', automatic: true, repairScope: ['failed_component_only'] },
  publish: { phase: 'review', automatic: false, repairScope: ['publication'] },
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
  /** O*NET-SOC code; resolved from the slug map when omitted. */
  socCode: z.string().trim().optional(),
  /** CIP code for the program of study; persisted with socCode. */
  cipCode: z.string().trim().nullable().optional(),
  /** Tuition / credential exam fee (dollars). */
  tuition: z
    .object({
      costDollars: z.number().nonnegative().nullable().optional(),
      examFeeDollars: z.number().nonnegative().nullable().optional(),
      isFree: z.boolean().optional(),
      notes: z.string().optional(),
    })
    .nullable()
    .optional(),
  /** Workbook (digital_workbooks) that ships with the course. */
  workbook: z
    .object({
      workbookId: z.string().min(1),
      slug: z.string().nullable().optional(),
      title: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  /** Machine/equipment trade: publish requires a simulation activity. */
  handsOnTrade: z.boolean().optional(),
  /**
   * Funding / program types. JAG is Jobs for America's Graduates — a funding
   * type only (see public/docs/PROGRAM_HOLDER_ONBOARDING_PACKET.md); there
   * is no JAG API or feed.
   */
  funding: z
    .object({
      wioaEligible: z.boolean().optional(),
      wrgEligible: z.boolean().optional(),
      wexEligible: z.boolean().optional(),
      etplApproved: z.boolean().optional(),
      jagEligible: z.boolean().optional(),
      fundingNotes: z.string().optional(),
    })
    .optional(),
  /** Government job-feed evidence, when already attached to the template. */
  workforceEvidence: z.record(z.string(), z.unknown()).nullable().optional(),
});

/** Existing library callers share Ultimate production contracts and execution. */
export async function courseFactory(
  input: FactoryInput,
  progress?: ProgressCallback,
): Promise<FactoryOutput> {
  const db = await requireAdminClient();
  await assertCourseBuilderGenerationEnabled(db, input.courseId);
  const actorId = input.requestedBy || (await getCurrentUser())?.id;
  if (!actorId) throw new Error('AUTHENTICATED_GENERATION_ACTOR_REQUIRED');
  progress?.('init', 'Starting the canonical checkpointed Course Builder.', 0);
  return requestCanonicalGeneration(db, input, actorId);
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
    ...(body.tuition
      ? { tuition_cost: body.tuition.isFree ? 0 : (body.tuition.costDollars ?? null) }
      : {}),
    metadata: {
      credentialTarget: body.credentialTarget,
      minimumHours: body.minimumHours,
      requiresFinalExam: body.requiresFinalExam,
      finalExam: body.finalExam,
      certificateRequirements: body.certificateRequirements,
      regulatory: body.regulatory,
      socCode: body.socCode ?? null,
      cipCode: body.cipCode ?? null,
      tuition: body.tuition ?? null,
      workbook: body.workbook ?? null,
      handsOnTrade: body.handsOnTrade ?? false,
      funding: body.funding ?? null,
      workforceEvidence: body.workforceEvidence ?? null,
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
  options?: { actorId?: string | null; publishOverride?: PublishOverride | null },
) {
  // Single builder: every governed publication first attaches the government
  // job feed (O*NET, CareerOneStop, USAJobs, BLS) to the template and
  // persists it on the course row (courses.metadata, no migration), so the
  // course carries real job data — postings, wages, outlook — instead of
  // prompt-only context. The gate below then fails a credentialed course
  // that has a SOC mapping but no evidence.
  const { template: withEvidence, warnings } = await attachJobFeedEvidence(template);
  if (warnings.length) {
    logger.warn('[course-builder] Job-feed evidence warnings at publication', {
      programSlug: template.slug,
      warnings,
    });
  }
  if (withEvidence.courseId) {
    try {
      const db = await requireAdminClient();
      const { data: existing } = await db
        .from('courses')
        .select('metadata')
        .eq('id', withEvidence.courseId)
        .maybeSingle();
      const metadata = {
        ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
        socCode: withEvidence.socCode ?? null,
        funding: withEvidence.funding ?? null,
        workforceEvidence: withEvidence.workforceEvidence ?? null,
      };
      const { error } = await db
        .from('courses')
        .update({ metadata })
        .eq('id', withEvidence.courseId);
      if (error) throw error;
    } catch (error) {
      // Evidence persistence is best-effort: the gate still enforces
      // evidence on the template below, and generation still receives it
      // via the blueprint. Never fail publication on a metadata write.
      logger.warn('[course-builder] Could not persist job-feed evidence on course row', {
        courseId: withEvidence.courseId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Build standard (alignment, required lesson work, workbook, simulation):
  // evaluated purely from the builder's own template state. Missing items
  // block publication with an itemized, fixable list — unless the owner
  // publishes anyway with an override acknowledgment, in which case the
  // gaps are audited and routed to PARIS after publication (see
  // publish-standard.ts). Drafts are never affected; this runs only here,
  // at the publish step.
  const standard = applyPublishStandard(withEvidence, options?.publishOverride);
  if (standard.blocked) {
    return {
      ok: false,
      error: 'PUBLISH_STANDARD_INCOMPLETE',
      message:
        'This course does not yet meet the build standard. Each missing item names where to fix it in the builder — or publish anyway with an owner override acknowledgment.',
      publishStandard: { missing: standard.missing, overridden: false },
      audit: null,
      procurement: null,
      result: null,
      governance: null,
    };
  }

  const gate = auditCourseGovernance(withEvidence);
  if (!gate.ok) {
    return {
      ok: false,
      error: 'Publication blocked by course governance gate',
      ...gate,
      result: null,
      governance: null,
    };
  }

  const blueprint = adaptProgramTemplateToBlueprint(withEvidence);
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

  const governance = null;

  if (result.ok) {
    // Round-trip what the author built onto the records the LMS reads, and
    // route any override-acknowledged gaps to PARIS. Best-effort: none of
    // this may fail a publication that already succeeded.
    try {
      const db = await requireAdminClient();
      await persistBuilderAlignment(db, withEvidence);
      if (withEvidence.courseId) {
        await persistBuilderAssignments(db, withEvidence, withEvidence.courseId);
      }
      if (standard.overridden) {
        await recordPublishOverride({
          db,
          template: withEvidence,
          actorId: options?.actorId ?? null,
          missing: standard.missing,
          note: options?.publishOverride?.note,
        });
      }
    } catch (error) {
      logger.warn('[course-builder] Post-publish standard persistence failed', {
        courseSlug: template.slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    ...gate,
    ok: gate.ok && result.ok,
    result,
    governance,
    publishStandard: { missing: standard.missing, overridden: standard.overridden },
  };
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

  const governance = null;

  const after = await validateCourseAgainstContract(courseId);
  return { ...result, governance, repairedCourseId: courseId, programSlug: course.slug, contractValidation: { before, after } };
}

export function getInstructionalLessonBuildSteps() {
  return instructionalLessonSteps();
}

export function requireInstructionalLessonStage(
  evidence: Partial<Record<InstructionalLessonStep, boolean>>,
  through: InstructionalLessonStep,
) {
  assertInstructionalLessonPipeline(evidence, through);
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
