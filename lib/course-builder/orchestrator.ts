/**
 * Canonical Course Builder server orchestration.
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
import { requireAdminClient } from '../supabase/admin';
import { assertCourseBuilderGenerationEnabled } from '@/lib/ultimate-course-builder/core/generation-control';
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

  const governance = null;

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
