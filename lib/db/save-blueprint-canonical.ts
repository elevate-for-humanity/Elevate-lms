/**
 * Persist an ingested CourseBlueprint through the canonical Course Factory
 * persistence boundary. Ingestion/classification/compiler behavior remains
 * independent; only final course-package persistence is centralized.
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { publishCourse } from '@/lib/course-factory/publisher';
import type { BlueprintModule } from '@/lib/curriculum/blueprints/types';
import type { CourseBlueprint, LessonBlueprint } from '@/lib/ai/course-ingestion';

export interface SaveBlueprintResult {
  courseId: string;
  moduleCount: number;
  lessonCount: number;
  questionCount: number;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function inferStepType(contentType: string | undefined, title: string): string {
  const t = (contentType ?? '').toLowerCase();
  const titleLower = title.toLowerCase();

  if (t === 'quiz' || titleLower.includes('quiz')) return 'quiz';
  if (t === 'exam' || titleLower.includes('exam') || titleLower.includes('final')) return 'exam';
  if (t === 'checkpoint' || titleLower.includes('checkpoint')) return 'checkpoint';
  if (t === 'lab' || titleLower.includes('lab') || titleLower.includes('practical')) return 'lab';
  if (t === 'assignment' || titleLower.includes('assignment')) return 'assignment';
  return 'lesson';
}

function lessonSlug(lesson: LessonBlueprint, moduleIndex: number, lessonIndex: number): string {
  const type = inferStepType(lesson.content_type, lesson.title);
  const base = slugify(lesson.title) || `module-${moduleIndex + 1}-lesson-${lessonIndex + 1}`;
  if (type === 'lesson' || base.includes(type)) return base;
  return `${base}-${type}`;
}

function toBlueprintModules(blueprint: CourseBlueprint): BlueprintModule[] {
  return (blueprint.modules ?? []).map((mod, mi) => {
    const lessons = (mod.lessons ?? []).map((lesson, li) => {
      const compiled = lesson.compiled;
      const slug = lessonSlug(lesson, mi, li);
      const quizQuestions = compiled?.knowledge_check?.map((question, qi) => ({
        id: `${slug}-q${qi + 1}`,
        question: question.question,
        options: question.options,
        correctAnswer: Math.max(0, question.options.indexOf(question.correct_answer)),
        explanation: question.explanation,
      }));

      const content = compiled
        ? JSON.stringify({
            html: compiled.narration_script,
            narration_script: compiled.narration_script,
            learning_objectives: compiled.lesson_objectives,
            slide_outline: compiled.slide_outline,
            practice_exercise: compiled.practice_exercise,
            instructor_notes: compiled.instructor_notes,
            source_description: lesson.description,
          })
        : JSON.stringify({
            html: lesson.content ?? '',
            source_description: lesson.description,
          });

      return {
        slug,
        title: lesson.title,
        order: lesson.order_index ?? li + 1,
        objective:
          compiled?.lesson_objectives?.[0] ??
          lesson.description ??
          `Complete ${lesson.title}`,
        learningObjectives: compiled?.lesson_objectives ?? [],
        content,
        durationMinutes: compiled?.estimated_minutes ?? lesson.duration_minutes ?? undefined,
        quizQuestions: quizQuestions?.length ? quizQuestions : undefined,
        passingScore: quizQuestions?.length ? blueprint.passing_score ?? 70 : undefined,
      };
    });

    return {
      slug: slugify(mod.title) || `module-${mi + 1}`,
      title: mod.title,
      description: mod.description,
      orderIndex: mod.order_index ?? mi + 1,
      minLessons: lessons.length,
      maxLessons: lessons.length,
      quizRequired: lessons.some((lesson) => (lesson.quizQuestions?.length ?? 0) > 0),
      practicalRequired: lessons.some((lesson) =>
        lesson.slug.includes('-lab') || lesson.slug.includes('-assignment'),
      ),
      isCritical: true,
      requiredLessonTypes: [],
      competencies: [],
      lessons,
    };
  });
}

export async function saveBlueprintToCanonical(
  blueprint: CourseBlueprint,
  options: { program_id?: string | null; created_by?: string | null } = {},
): Promise<SaveBlueprintResult> {
  const courseSlug = `ingested-${slugify(blueprint.title) || 'course'}-${Date.now().toString(36)}`;
  const modules = toBlueprintModules(blueprint);

  const result = await publishCourse({
    programId: options.program_id ?? null,
    courseSlug,
    courseTitle: blueprint.title,
    blueprint: modules,
    mode: 'replace',
    contentSource: 'blueprint',
    videoConfig: { enabled: false },
  });

  if (!result.success || !result.courseId) {
    throw new Error(`Failed to persist ingested course: ${result.errors.join('; ') || 'unknown error'}`);
  }

  // Preserve ingestion-specific metadata after the atomic package write.
  const db = await requireAdminClient();
  const { error: metadataError } = await db
    .from('courses')
    .update({
      description: blueprint.description ?? null,
      generation_status: 'draft',
      created_by: options.created_by ?? null,
      metadata: {
        certificate_enabled: blueprint.certificate_enabled ?? false,
        certificate_title: blueprint.certificate_title ?? null,
        passing_score: blueprint.passing_score ?? 70,
        skill_level: blueprint.skill_level ?? 'beginner',
        estimated_duration_hours: blueprint.estimated_duration_hours ?? null,
        category: blueprint.category ?? null,
        target_audience: blueprint.target_audience ?? null,
        completion_criteria: blueprint.completion_criteria ?? null,
        ingestion_warnings: blueprint.warnings ?? [],
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', result.courseId);

  if (metadataError) {
    throw new Error(`Course persisted but ingestion metadata update failed: ${metadataError.message}`);
  }

  return {
    courseId: result.courseId,
    moduleCount: result.moduleCount,
    lessonCount: result.lessonCount,
    questionCount: blueprint.quiz_questions?.length ?? 0,
  };
}
