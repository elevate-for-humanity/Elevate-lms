/**
 * Canonical Course Factory persistence layer.
 *
 * Course Factory owns generation, validation and package assembly. This module
 * persists an already-validated package through one PostgreSQL transaction.
 */
import { requireAdminClient } from '@/lib/supabase/admin';
import { getInstructorForCourse } from '@/lib/ai-instructors';
import type { CredentialBlueprint } from '@/lib/curriculum/blueprints/types';
import type { BlueprintModule, BuildMode, ValidationResult } from './types';
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
  ok: true, valid: true, errors: [], warnings: [], errorCount: 0, warningCount: 0,
};
const DB_LESSON_TYPES = new Set(['lesson','quiz','checkpoint','lab','assignment','exam','certification']);

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

function normalizeLessonContent(content: string | undefined, objective: string | undefined): Record<string, unknown> | null {
  if (!content?.trim()) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch {}
  return { html: content, learning_points: objective?.trim() ? [objective.trim()] : [], scenario: '' };
}

function normalizeLessonType(lesson: Record<string, any>, slug: string): string {
  const requested = String(lesson.lessonType ?? lesson.stepType ?? '').trim();
  if (DB_LESSON_TYPES.has(requested)) return requested;
  if (requested === 'practical') return 'lab';
  return inferStepType(slug);
}

function buildAtomicPayload(modules: BlueprintModule[], courseTitle: string) {
  const instructor = getInstructorForCourse(courseTitle);
  return [...modules].sort((a,b) => a.orderIndex - b.orderIndex).map((courseModule) => {
    const moduleExtra = courseModule as typeof courseModule & Record<string, any>;
    return {
      slug: courseModule.slug,
      title: courseModule.title,
      description: courseModule.description ?? null,
      order_index: courseModule.orderIndex,
      domain_key: courseModule.domainKey ?? null,
      target_hours: moduleExtra.targetHours ?? null,
      is_required: moduleExtra.isRequired ?? true,
      lessons: [...(courseModule.lessons ?? [])].sort((a,b) => a.order - b.order).map((lesson) => {
        const extra = lesson as typeof lesson & Record<string, any>;
        const stepType = normalizeLessonType(extra, lesson.slug);
        const content = normalizeLessonContent(lesson.content, lesson.objective);
        const experience = content?.experience && typeof content.experience === 'object' && !Array.isArray(content.experience)
          ? content.experience as Record<string, any> : null;
        const learningPoints = Array.isArray(content?.learning_points)
          ? content.learning_points.filter((p): p is string => typeof p === 'string' && p.trim().length > 0) : [];
        const practicalTask = experience?.practicalTask && typeof experience.practicalTask === 'object' ? experience.practicalTask : null;
        const generatedExercises = Array.isArray(experience?.exercises) ? experience.exercises.map((e: Record<string,any>) => ({ type:'exercise', ...e })) : [];
        const generatedResources = Array.isArray(experience?.resources) ? experience.resources : [];
        const generatedQuickClips = Array.isArray(experience?.quickClips) ? experience.quickClips : [];
        const activities = [
          ...(Array.isArray(extra.activities) ? extra.activities : []),
          ...generatedExercises,
          ...(practicalTask ? [{ type:'practical', ...practicalTask }] : []),
        ];
        const renderedHtml = typeof extra.renderedHtml === 'string' ? extra.renderedHtml : typeof content?.html === 'string' ? content.html : null;
        const instructorNotes = Array.isArray(lesson.instructorNotes) ? lesson.instructorNotes.join('\n\n') : (lesson.instructorNotes ?? null);
        return {
          slug: lesson.slug,
          title: lesson.title,
          lesson_type: stepType,
          order_index: lesson.order,
          objective: lesson.objective ?? null,
          content,
          content_json: experience ? { experience } : {},
          rendered_html: renderedHtml,
          quiz_questions: lesson.quizQuestions?.map((question,index) => ({
            id: question.id || `${lesson.slug}-q${index+1}`,
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            domainKey: lesson.domainKey ?? courseModule.domainKey ?? null,
            competencyKeys: (question as any).competencyKeys ?? [],
          })) ?? null,
          passing_score: lesson.passingScore ?? (stepType === 'exam' ? 80 : ['checkpoint','quiz'].includes(stepType) ? 70 : null),
          activities: activities.length ? activities : null,
          resources: generatedResources.length ? generatedResources : (extra.resources ?? null),
          duration_minutes: lesson.durationMinutes ?? null,
          video_url: extra.videoUrl ?? lesson.videoFile ?? null,
          video_config: extra.videoConfig ?? (experience ? {
            enabled: true,
            instructor: instructor.name,
            instructor_id: instructor.id,
            instructor_avatar: instructor.avatar,
            narration: experience.narrationScript ?? null,
            visual_prompt: experience.visualPrompt ?? null,
            quick_clips: generatedQuickClips,
            captions: true,
            transcript: experience.narrationScript ?? null,
          } : null),
          learning_objectives: lesson.learningObjectives ?? null,
          competency_checks: lesson.competencyChecks ?? experience?.knowledgeChecks ?? null,
          instructor_notes: instructorNotes,
          practical_required: extra.practicalRequired ?? (Boolean(practicalTask) || stepType === 'lab'),
          required_artifacts: Array.isArray(extra.requiredArtifacts) ? extra.requiredArtifacts : practicalTask?.evidence ? [String(practicalTask.evidence)] : [],
          unlock_rule: extra.unlockRule ?? null,
          partner_exam_code: lesson.partnerExamCode ?? null,
          domain_key: lesson.domainKey ?? courseModule.domainKey ?? null,
          hour_category: extra.hourCategory ?? (stepType === 'lab' ? 'practical' : stepType === 'exam' ? 'exam' : 'didactic'),
          evidence_type: extra.evidenceType ?? (stepType === 'lab' ? 'observation' : null),
          delivery_method: extra.deliveryMethod ?? 'online_async',
          requires_instructor_signoff: extra.requiresInstructorSignoff ?? Boolean(practicalTask && stepType === 'lab'),
          instructor_requirement: extra.instructorRequirement ?? null,
          minimum_seat_time_minutes: extra.minimumSeatTimeMinutes ?? lesson.durationMinutes ?? null,
          fieldwork_eligible: extra.fieldworkEligible ?? false,
          is_required: extra.isRequired ?? true,
          ai_generated: extra.aiGenerated ?? Boolean(experience),
          approved: false,
          compliance_profile_key: extra.complianceProfileKey ?? null,
          script_text: extra.scriptText ?? experience?.narrationScript ?? null,
          script: extra.script ?? experience?.narrationScript ?? null,
          bullet_points: extra.bulletPoints ?? learningPoints,
          scene_data: extra.sceneData ?? (experience ? {
            visual_prompt: experience.visualPrompt ?? null,
            scenario: experience.scenario ?? null,
            case_study: experience.caseStudy ?? null,
            quick_clips: generatedQuickClips,
            reading_guide: experience.readingGuide ?? null,
            glossary: experience.glossary ?? null,
            readiness: experience.readiness ?? null,
          } : null),
          generation_status: experience ? 'generated' : 'pending',
          last_generated_at: experience ? new Date().toISOString() : null,
        };
      }),
    };
  });
}

export async function publishCourse(input: PublishInput): Promise<PublishResult> {
  const db = await requireAdminClient();
  try {
    const modules = buildAtomicPayload(modulesFrom(input), input.courseTitle);
    const courseSlug = slugFrom(input);
    const { data, error } = await (db as any).rpc('publish_course_package_atomic', {
      p_program_id: input.programId ?? null,
      p_course_slug: courseSlug,
      p_course_title: input.courseTitle,
      p_mode: input.mode,
      p_modules: modules,
    });
    if (error) throw new Error(error.message);
    const result = (data ?? {}) as { success?:boolean; course_id?:string; module_count?:number; lesson_count?:number; skipped_count?:number };
    return {
      success: result.success === true,
      courseId: result.course_id ?? '',
      moduleCount: Number(result.module_count ?? 0),
      lessonCount: Number(result.lesson_count ?? 0),
      skippedCount: Number(result.skipped_count ?? 0),
      warnings: [],
      errors: result.success === true ? [] : ['Atomic course persistence did not report success'],
      validation: validatedHandoff,
    };
  } catch (error) {
    return {
      success:false, courseId:'', moduleCount:0, lessonCount:0, skippedCount:0, warnings:[],
      errors:[`Atomic course persistence failed: ${error instanceof Error ? error.message : String(error)}`],
      validation: validatedHandoff,
    };
  }
}

/** Controlled compatibility helper only. Application publication is owned by
 * Course Builder persisted-publish-service. */
export async function publishCourseAtomic(courseId: string, programId?: string | null): Promise<{
  success:boolean; lessonsPublished?:number; curriculumLessonsInserted?:number; curriculumLessonsSkipped?:number; error?:string;
}> {
  const db = await requireAdminClient();
  const { data, error } = await db.rpc('publish_course_from_staging', {
    p_course_id: courseId,
    p_program_id: programId && programId !== courseId ? programId : null,
  });
  if (error) return { success:false, error:error.message };
  const result = (data ?? {}) as { lessons_published?:number; curriculum_lessons_inserted?:number; curriculum_lessons_skipped?:number };
  return {
    success:true,
    lessonsPublished:result.lessons_published,
    curriculumLessonsInserted:result.curriculum_lessons_inserted,
    curriculumLessonsSkipped:result.curriculum_lessons_skipped,
  };
}
