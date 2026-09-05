/**
 * Canonical Course Factory persistence layer.
 *
 * Course Factory owns generation, validation and package assembly. This module
 * persists an already-validated package through one PostgreSQL transaction.
 */
import { createHash } from 'node:crypto';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getInstructorForBlueprint } from '@/lib/ai-instructors';
import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';
import { buildLearningExperience } from '@/lib/curriculum/learning-experience';
import type { BlueprintModule, BuildMode, ValidationResult } from './types';
import { compileLearningIntelligence, LearningIntelligenceSchema } from './learning-intelligence';
import { inferStepType } from './validator';

export interface PublishInput {
  programId?: string | null;
  courseSlug?: string;
  courseTitle: string;
  blueprint: BlueprintModule[] | CredentialBlueprint;
  mode: BuildMode;
  contentSource?: 'ai' | 'blueprint' | 'curriculum_lessons';
  videoConfig?: { enabled: boolean };
  evidence?: unknown;
}

export interface PublishResult {
  success: boolean;
  courseId: string;
  moduleCount: number;
  lessonCount: number;
  skippedCount: number;
  warnings: string[];
  errors: string[];
  validation: ValidationResult;
}

const validatedHandoff: ValidationResult = {
  ok: true,
  valid: true,
  errors: [],
  warnings: [],
  errorCount: 0,
  warningCount: 0,
};
const DB_LESSON_TYPES = new Set([
  'lesson',
  'quiz',
  'checkpoint',
  'lab',
  'assignment',
  'exam',
  'certification',
]);

function modulesFrom(input: PublishInput): BlueprintModule[] {
  return Array.isArray(input.blueprint)
    ? input.blueprint
    : (input.blueprint.modules as BlueprintModule[]);
}

function slugFrom(input: PublishInput): string {
  if (input.courseSlug?.trim()) return input.courseSlug.trim();
  if (!Array.isArray(input.blueprint) && input.blueprint.programSlug?.trim()) {
    return input.blueprint.programSlug.trim();
  }
  throw new Error('Atomic course persistence requires a course/program slug');
}

function normalizeLessonContent(
  content: string | undefined,
  objective: string | undefined,
): Record<string, unknown> | null {
  if (!content?.trim()) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Plain HTML/text lesson content is normalized below.
  }
  return {
    html: content,
    learning_points: objective?.trim() ? [objective.trim()] : [],
    scenario: '',
  };
}

function normalizeLessonType(lesson: Record<string, any>, slug: string): string {
  const requested = String(lesson.lessonType ?? lesson.stepType ?? '').trim();
  if (DB_LESSON_TYPES.has(requested)) return requested;
  if (requested === 'practical') return 'lab';
  return inferStepType(slug);
}

export function buildAtomicPayload(
  modules: BlueprintModule[],
  courseTitle: string,
  videoConfig?: CredentialBlueprint['videoConfig'],
) {
  const instructor = getInstructorForBlueprint(courseTitle, videoConfig);
  return [...modules]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((courseModule, modulePosition) => {
      const moduleExtra = courseModule as typeof courseModule & Record<string, any>;
      return {
        slug: courseModule.slug,
        title: courseModule.title,
        description: courseModule.description ?? null,
        order_index: courseModule.orderIndex,
        domain_key: courseModule.domainKey ?? null,
        target_hours: moduleExtra.targetHours ?? null,
        is_required: moduleExtra.isRequired ?? true,
        lessons: [...(courseModule.lessons ?? [])]
          .sort((a, b) => a.order - b.order)
          .map((lesson, lessonPosition) => {
            const extra = lesson as typeof lesson & Record<string, any>;
            const stepType = normalizeLessonType(extra, lesson.slug);
            const content = normalizeLessonContent(lesson.content, lesson.objective);
            const experience =
              content?.experience &&
              typeof content.experience === 'object' &&
              !Array.isArray(content.experience)
                ? (content.experience as Record<string, any>)
                : null;
            const governedPractical = extra.practicalRequired ?? stepType === 'lab';
            // This is the final shared persistence boundary for every Course
            // Builder entry point. Generate the universal experience here so
            // dedicated, AI, blueprint, recovery, and Admin builds cannot
            // bypass the publication contract.
            const learningExperience =
              extra.learningExperience && typeof extra.learningExperience === 'object'
                ? extra.learningExperience
                : buildLearningExperience({
                    lessonType: stepType,
                    practicalRequired: governedPractical,
                  });
            const learningPoints = Array.isArray(content?.learning_points)
              ? content.learning_points.filter(
                  (point): point is string => typeof point === 'string' && point.trim().length > 0,
                )
              : [];
            const learningObjectives = Array.from(
              new Set(
                [
                  ...(Array.isArray(lesson.learningObjectives) ? lesson.learningObjectives : []),
                  lesson.objective,
                  ...learningPoints,
                ]
                  .filter(
                    (objective): objective is string =>
                      typeof objective === 'string' && objective.trim().length > 0,
                  )
                  .map((objective) => objective.trim()),
              ),
            );
            const narration =
              typeof experience?.narrationScript === 'string' ? experience.narrationScript : null;
            const sourceFingerprint = experience
              ? createHash('sha256')
                  .update(
                    JSON.stringify({
                      narration,
                      objective: lesson.objective ?? null,
                      learningPoints,
                      visualPrompt: experience.visualPrompt ?? null,
                    }),
                  )
                  .digest('hex')
              : null;
            if (
              experience &&
              !LearningIntelligenceSchema.safeParse(experience.intelligence).success
            ) {
              const competencyKeys =
                Array.isArray(lesson.competencyKeys) && lesson.competencyKeys.length
                  ? lesson.competencyKeys
                  : (courseModule.competencies ?? []).map((competency) => competency.competencyKey);
              experience.intelligence = compileLearningIntelligence({
                lessonSlug: lesson.slug,
                lessonTitle: lesson.title,
                domainKey: lesson.domainKey ?? courseModule.domainKey ?? courseModule.slug,
                competencyKeys,
                objectives: learningObjectives,
                masteryThreshold: lesson.passingScore,
                assessment: ['checkpoint', 'quiz', 'exam'].includes(stepType),
                practical: governedPractical,
              });
            }
            const practicalTask =
              experience?.practicalTask && typeof experience.practicalTask === 'object'
                ? experience.practicalTask
                : null;
            const generatedExercises = Array.isArray(experience?.exercises)
              ? experience.exercises.map((exercise: Record<string, any>) => ({
                  type: 'exercise',
                  ...exercise,
                }))
              : [];
            const generatedResources = Array.isArray(experience?.resources)
              ? experience.resources
              : [];
            const generatedQuickClips = Array.isArray(experience?.quickClips)
              ? experience.quickClips
              : [];
            const activities = [
              ...(Array.isArray(extra.activities) ? extra.activities : []),
              ...generatedExercises,
              ...(practicalTask ? [{ type: 'practical', ...practicalTask }] : []),
            ];
            const renderedHtml =
              typeof extra.renderedHtml === 'string'
                ? extra.renderedHtml
                : typeof content?.html === 'string'
                  ? content.html
                  : null;
            const instructorNotes = Array.isArray(lesson.instructorNotes)
              ? lesson.instructorNotes.join('\n\n')
              : (lesson.instructorNotes ?? null);
            return {
              slug: lesson.slug,
              title: lesson.title,
              lesson_type: stepType,
              // The live schema enforces UNIQUE(course_id, order_index). Blueprint
              // order fields are descriptive and may be duplicated or zero-based, so
              // derive the persisted global index from normalized array positions.
              order_index: (modulePosition + 1) * 1000 + (lessonPosition + 1),
              objective: lesson.objective ?? null,
              content,
              content_json: {
                ...(experience ? { experience } : {}),
                ...(learningExperience ? { learning_experience: learningExperience } : {}),
              },
              rendered_html: renderedHtml,
              quiz_questions:
                lesson.quizQuestions?.map((question, index) => ({
                  id: question.id || `${lesson.slug}-q${index + 1}`,
                  question: question.question,
                  options: question.options,
                  correctAnswer: question.correctAnswer,
                  explanation: question.explanation,
                  domainKey: lesson.domainKey ?? courseModule.domainKey ?? null,
                  competencyKeys: (question as any).competencyKeys ?? [],
                })) ?? null,
              passing_score:
                lesson.passingScore ??
                (stepType === 'exam' ? 80 : ['checkpoint', 'quiz'].includes(stepType) ? 70 : null),
              activities: activities.length ? activities : null,
              resources: generatedResources.length ? generatedResources : (extra.resources ?? null),
              duration_minutes: lesson.durationMinutes ?? null,
              video_url: extra.videoUrl ?? lesson.videoFile ?? null,
              video_config: experience
                ? {
                    ...(extra.videoConfig && typeof extra.videoConfig === 'object'
                      ? extra.videoConfig
                      : {}),
                    enabled: true,
                    source_fingerprint: sourceFingerprint,
                    source_contract_version: 1,
                    narration_locked: true,
                    instructor: instructor.name,
                    instructor_id: instructor.id,
                    instructor_avatar: instructor.avatar,
                    narration: experience.narrationScript ?? null,
                    visual_prompt: experience.visualPrompt ?? null,
                    quick_clips: generatedQuickClips,
                    captions: true,
                    transcript: experience.narrationScript ?? null,
                  }
                : (extra.videoConfig ?? null),
              learning_objectives: learningObjectives.length ? learningObjectives : null,
              competency_checks: lesson.competencyChecks ?? experience?.knowledgeChecks ?? null,
              instructor_notes: instructorNotes,
              practical_required: governedPractical,
              required_artifacts: Array.isArray(extra.requiredArtifacts)
                ? extra.requiredArtifacts
                : governedPractical && practicalTask?.evidence
                  ? [String(practicalTask.evidence)]
                  : [],
              unlock_rule: extra.unlockRule ?? null,
              partner_exam_code: lesson.partnerExamCode ?? null,
              domain_key: lesson.domainKey ?? courseModule.domainKey ?? null,
              hour_category:
                extra.hourCategory ??
                (stepType === 'lab' ? 'practical' : stepType === 'exam' ? 'exam' : 'didactic'),
              evidence_type: extra.evidenceType ?? (stepType === 'lab' ? 'observation' : null),
              delivery_method: extra.deliveryMethod ?? 'online_async',
              requires_instructor_signoff:
                extra.requiresInstructorSignoff ?? Boolean(governedPractical && stepType === 'lab'),
              instructor_requirement: extra.instructorRequirement ?? null,
              minimum_seat_time_minutes:
                extra.minimumSeatTimeMinutes ?? lesson.durationMinutes ?? null,
              fieldwork_eligible: extra.fieldworkEligible ?? false,
              is_required: extra.isRequired ?? true,
              ai_generated: extra.aiGenerated ?? Boolean(experience),
              approved: false,
              compliance_profile_key: extra.complianceProfileKey ?? null,
              script_text: extra.scriptText ?? experience?.narrationScript ?? null,
              script: extra.script ?? experience?.narrationScript ?? null,
              bullet_points: extra.bulletPoints ?? learningPoints,
              scene_data: experience
                ? {
                    ...(extra.sceneData && typeof extra.sceneData === 'object'
                      ? extra.sceneData
                      : {}),
                    source_contract: {
                      version: 1,
                      fingerprint: sourceFingerprint,
                      narration_locked: true,
                    },
                    visual_prompt: experience.visualPrompt ?? null,
                    scenario: experience.scenario ?? null,
                    case_study: experience.caseStudy ?? null,
                    quick_clips: generatedQuickClips,
                    reading_guide: experience.readingGuide ?? null,
                    glossary: experience.glossary ?? null,
                    readiness: experience.readiness ?? null,
                    intelligence: experience.intelligence ?? null,
                  }
                : (extra.sceneData ?? null),
              // course_lessons_generation_status_check accepts queued/generating/generated/approved.
              // Blueprint-only shells are durable work waiting for enrichment, so queued is canonical.
              // A lesson with authored content is still incomplete until the
              // matching version-locked media is rendered and verified.
              generation_status: experience ? 'generating' : 'queued',
              last_generated_at: experience ? new Date().toISOString() : null,
            };
          }),
      };
    });
}

export async function publishCourse(input: PublishInput): Promise<PublishResult> {
  const db = await requireAdminClient();
  try {
    const sourceModules = modulesFrom(input);
    const governedVideoConfig = Array.isArray(input.blueprint)
      ? undefined
      : input.blueprint.videoConfig;
    const modules = buildAtomicPayload(sourceModules, input.courseTitle, governedVideoConfig);
    const courseSlug = slugFrom(input);
    const { data, error } = await (db as any).rpc('publish_course_package_atomic', {
      p_program_id: input.programId ?? null,
      p_course_slug: courseSlug,
      p_course_title: input.courseTitle,
      p_mode: input.mode,
      p_modules: modules,
    });
    if (error) throw new Error(error.message);

    const result = (data ?? {}) as {
      success?: boolean;
      course_id?: string;
      module_count?: number;
      lesson_count?: number;
      skipped_count?: number;
    };
    if (result.success !== true || !result.course_id) {
      return {
        success: false,
        courseId: result.course_id ?? '',
        moduleCount: Number(result.module_count ?? 0),
        lessonCount: Number(result.lesson_count ?? 0),
        skippedCount: Number(result.skipped_count ?? 0),
        warnings: [],
        errors: ['Atomic course persistence did not report success'],
        validation: validatedHandoff,
      };
    }

    const totalDurationMinutes = sourceModules.reduce(
      (moduleTotal, courseModule) =>
        moduleTotal +
        (courseModule.lessons ?? []).reduce(
          (lessonTotal, lesson) => lessonTotal + Number(lesson.durationMinutes ?? 0),
          0,
        ),
      0,
    );
    const blueprint = Array.isArray(input.blueprint) ? null : input.blueprint;
    const description = String(blueprint?.description ?? '').trim();
    const passingScore = Number(
      blueprint?.generationRules?.passingScore ?? blueprint?.finalExam?.passingScore ?? 80,
    );
    const packageChanged = input.mode !== 'missing-only' || Number(result.lesson_count ?? 0) > 0;

    const metadata: Record<string, unknown> = {
      duration_hours: totalDurationMinutes / 60,
      passing_score: passingScore,
      // Content persistence is not course completion. The unified lifecycle
      // advances to 95 while media renders and to 100 only after every required
      // lesson video passes the canonical quality gate.
      generation_progress: 70,
      total_lessons: sourceModules.reduce(
        (count, courseModule) => count + (courseModule.lessons?.length ?? 0),
        0,
      ),
      updated_at: new Date().toISOString(),
    };
    if (description) metadata.description = description;
    if (packageChanged) {
      metadata.review_status = 'draft';
      metadata.reviewed_by = null;
      metadata.reviewed_at = null;
    }

    const { error: metadataError } = await db
      .from('courses')
      .update(metadata)
      .eq('id', result.course_id);
    if (metadataError) {
      throw new Error(`Canonical course metadata normalization failed: ${metadataError.message}`);
    }

    return {
      success: true,
      courseId: result.course_id,
      moduleCount: Number(result.module_count ?? 0),
      lessonCount: Number(result.lesson_count ?? 0),
      skippedCount: Number(result.skipped_count ?? 0),
      warnings: [],
      errors: [],
      validation: validatedHandoff,
    };
  } catch (error) {
    return {
      success: false,
      courseId: '',
      moduleCount: 0,
      lessonCount: 0,
      skippedCount: 0,
      warnings: [],
      errors: [
        `Atomic course persistence failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
      validation: validatedHandoff,
    };
  }
}

/** Controlled compatibility helper only. Application publication is owned by
 * Course Builder persisted-publish-service. */
export async function publishCourseAtomic(
  courseId: string,
  programId?: string | null,
): Promise<{
  success: boolean;
  lessonsPublished?: number;
  curriculumLessonsInserted?: number;
  curriculumLessonsSkipped?: number;
  error?: string;
}> {
  const db = await requireAdminClient();
  const { data, error } = await db.rpc('publish_course_from_staging', {
    p_course_id: courseId,
    p_program_id: programId && programId !== courseId ? programId : null,
  });
  if (error) return { success: false, error: error.message };
  const result = (data ?? {}) as {
    lessons_published?: number;
    curriculum_lessons_inserted?: number;
    curriculum_lessons_skipped?: number;
  };
  return {
    success: true,
    lessonsPublished: result.lessons_published,
    curriculumLessonsInserted: result.curriculum_lessons_inserted,
    curriculumLessonsSkipped: result.curriculum_lessons_skipped,
  };
}
