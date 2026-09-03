import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { QuizQuestion } from './types';
import { generatedAssessmentSchema, generatedLessonContentSchema, quizQuestionSchema } from './ai-contracts';
import {
  loadDurableGenerationCheckpoint,
  persistDurableGenerationCheckpoint,
} from './durable-generation-journal';

export type LessonGenerationCheckpoint = {
  objective: string;
  content: string;
  learning_points: string[];
  scenario: string;
  quiz_questions: QuizQuestion[];
};

type LessonTarget = {
  id: string;
  courseId: string;
};

async function resolveLessonTarget(
  courseTitle: string,
  lessonSlug: string,
): Promise<LessonTarget | null> {
  try {
    const db = await requireAdminClient();
    const { data: courses, error: courseError } = await db
      .from('courses')
      .select('id')
      .eq('title', courseTitle)
      .limit(2);
    if (courseError || !courses || courses.length !== 1) return null;

    const courseId = String(courses[0].id);
    const { data: lessons, error: lessonError } = await db
      .from('course_lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('slug', lessonSlug)
      .limit(2);
    if (lessonError || !lessons || lessons.length !== 1) return null;
    return { id: String(lessons[0].id), courseId };
  } catch (error) {
    logger.warn('[course-factory/checkpoint] target resolution skipped', {
      courseTitle,
      lessonSlug,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function record(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, any>;
}

function textArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

export function normalizePersistedLessonObjectives(input: {
  objective?: unknown;
  learningObjectives?: unknown;
  content?: unknown;
}): string[] {
  const content = record(input.content);
  return Array.from(
    new Set(
      [
        ...textArray(input.learningObjectives),
        typeof input.objective === 'string' ? input.objective : '',
        ...textArray(content?.learning_points),
      ]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).slice(0, 5);
}

/**
 * Repairs objective arrays lost by older publishers so completed database
 * lessons remain valid generation checkpoints. This never invents content:
 * it only normalizes the persisted objective and generated learning points.
 */
export async function repairPersistedLessonObjectives(courseId: string): Promise<number> {
  const db = await requireAdminClient();
  const { data: lessons, error } = await db
    .from('course_lessons')
    .select('id,content,learning_objectives,generation_status')
    .eq('course_id', courseId)
    .eq('generation_status', 'generated');
  if (error) throw new Error(`Persisted checkpoint repair lookup failed: ${error.message}`);

  let repaired = 0;
  for (const lesson of lessons ?? []) {
    const existing = textArray(lesson.learning_objectives);
    if (existing.length >= 3) continue;
    const objectives = normalizePersistedLessonObjectives({
      learningObjectives: lesson.learning_objectives,
      content: lesson.content,
    });
    if (objectives.length < 3) continue;
    const { error: updateError } = await db
      .from('course_lessons')
      .update({ learning_objectives: objectives, updated_at: new Date().toISOString() })
      .eq('id', lesson.id)
      .eq('generation_status', 'generated');
    if (updateError) {
      throw new Error(`Persisted checkpoint repair failed for ${lesson.id}: ${updateError.message}`);
    }
    repaired += 1;
  }
  return repaired;
}

export async function loadLessonGenerationCheckpoint(
  courseTitle: string,
  lessonSlug: string,
): Promise<LessonGenerationCheckpoint | null> {
  const journaled = await loadDurableGenerationCheckpoint<LessonGenerationCheckpoint>({
    courseTitle,
    lessonSlug,
    kind: 'lesson',
  });
  if (journaled) {
    let parsedContent: Record<string, any> | null = null;
    try {
      parsedContent = record(JSON.parse(journaled.content));
    } catch {
      parsedContent = null;
    }
    const strictJournal = generatedLessonContentSchema.safeParse({
      objective: journaled.objective,
      content: parsedContent?.html,
      learning_points: journaled.learning_points,
      scenario: journaled.scenario,
      quiz_questions: journaled.quiz_questions,
      experience: parsedContent?.experience,
    });
    if (strictJournal.success) return journaled;
  }

  const target = await resolveLessonTarget(courseTitle, lessonSlug);
  if (!target) return null;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('course_lessons')
      .select('content,content_json,learning_objectives,quiz_questions,generation_status,script,script_text')
      .eq('id', target.id)
      .maybeSingle();
    if (error || !data || data.generation_status !== 'generated') return null;

    const content = record(data.content);
    const contentJson = record(data.content_json);
    const experience = record(content?.experience) ?? record(contentJson?.experience);
    const html = typeof content?.html === 'string' ? content.html.trim() : '';
    const points = textArray(content?.learning_points);
    const scenario = typeof content?.scenario === 'string' ? content.scenario.trim() : '';
    const objectives = textArray(data.learning_objectives);
    const narration = typeof data.script === 'string' && data.script.trim()
      ? data.script.trim()
      : typeof data.script_text === 'string'
        ? data.script_text.trim()
        : '';
    const quizQuestions = Array.isArray(data.quiz_questions)
      ? data.quiz_questions.filter((question): question is QuizQuestion => Boolean(question && typeof question === 'object'))
      : [];

    if (
      html.length < 500 ||
      points.length < 3 ||
      scenario.length < 80 ||
      objectives.length < 1 ||
      narration.length < 200 ||
      !experience ||
      quizQuestions.length < 3
    ) {
      return null;
    }

    const strictCheckpoint = generatedLessonContentSchema.safeParse({
      objective: objectives[0],
      content: html,
      learning_points: points,
      scenario,
      quiz_questions: quizQuestions,
      experience,
    });
    if (!strictCheckpoint.success) return null;

    const checkpoint = {
      objective: strictCheckpoint.data.objective,
      content: JSON.stringify({
        html: strictCheckpoint.data.content,
        learning_points: strictCheckpoint.data.learning_points,
        scenario: strictCheckpoint.data.scenario,
        experience: strictCheckpoint.data.experience,
      }),
      learning_points: strictCheckpoint.data.learning_points,
      scenario: strictCheckpoint.data.scenario,
      quiz_questions: strictCheckpoint.data.quiz_questions,
    };
    await persistDurableGenerationCheckpoint({
      courseTitle,
      lessonSlug,
      kind: 'lesson',
      payload: checkpoint,
    });
    return checkpoint;
  } catch (error) {
    logger.warn('[course-factory/checkpoint] cached lesson read skipped', {
      courseTitle,
      lessonSlug,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function persistLessonGenerationCheckpoint(input: {
  courseTitle: string;
  lessonSlug: string;
  objective: string;
  html: string;
  learningPoints: string[];
  scenario: string;
  quizQuestions: QuizQuestion[];
  experience: Record<string, any>;
}): Promise<void> {
  const durableCheckpoint: LessonGenerationCheckpoint = {
    objective: input.objective,
    content: JSON.stringify({
      html: input.html,
      learning_points: input.learningPoints,
      scenario: input.scenario,
      experience: input.experience,
    }),
    learning_points: input.learningPoints,
    scenario: input.scenario,
    quiz_questions: input.quizQuestions,
  };
  await persistDurableGenerationCheckpoint({
    courseTitle: input.courseTitle,
    lessonSlug: input.lessonSlug,
    kind: 'lesson',
    payload: durableCheckpoint,
  });

  const target = await resolveLessonTarget(input.courseTitle, input.lessonSlug);
  if (!target) return;

  try {
    const db = await requireAdminClient();
    const narration = typeof input.experience.narrationScript === 'string'
      ? input.experience.narrationScript
      : null;
    const resources = Array.isArray(input.experience.resources) ? input.experience.resources : null;
    const quickClips = Array.isArray(input.experience.quickClips) ? input.experience.quickClips : [];
    const now = new Date().toISOString();

    const { error } = await db
      .from('course_lessons')
      .update({
        content: {
          html: input.html,
          learning_points: input.learningPoints,
          scenario: input.scenario,
          experience: input.experience,
        },
        content_json: { experience: input.experience },
        rendered_html: input.html,
        learning_objectives: [input.objective, ...input.learningPoints].slice(0, 5),
        quiz_questions: input.quizQuestions,
        script: narration,
        script_text: narration,
        bullet_points: input.learningPoints,
        resources,
        scene_data: {
          visual_prompt: input.experience.visualPrompt ?? null,
          scenario: input.experience.scenario ?? null,
          case_study: input.experience.caseStudy ?? null,
          quick_clips: quickClips,
          reading_guide: input.experience.readingGuide ?? null,
          glossary: input.experience.glossary ?? null,
          readiness: input.experience.readiness ?? null,
        },
        video_config: {
          enabled: true,
          narration,
          visual_prompt: input.experience.visualPrompt ?? null,
          quick_clips: quickClips,
          captions: true,
          transcript: narration,
        },
        ai_generated: true,
        approved: false,
        generation_status: 'generated',
        last_generated_at: now,
        updated_at: now,
      })
      .eq('id', target.id);
    if (error) {
      logger.warn('[course-factory/checkpoint] lesson checkpoint write skipped', {
        courseTitle: input.courseTitle,
        lessonSlug: input.lessonSlug,
        error: error.message,
      });
      return;
    }

    const [{ count: generated }, { count: total }] = await Promise.all([
      db
        .from('course_lessons')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', target.courseId)
        .eq('generation_status', 'generated'),
      db
        .from('course_lessons')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', target.courseId),
    ]);
    const progress = total && total > 0
      ? Math.min(80, 15 + Math.round(((generated ?? 0) / total) * 65))
      : 15;
    await db
      .from('courses')
      .update({
        generation_status: 'generating',
        generation_progress: progress,
        updated_at: now,
      })
      .eq('id', target.courseId);
  } catch (error) {
    logger.warn('[course-factory/checkpoint] lesson checkpoint failed safely', {
      courseTitle: input.courseTitle,
      lessonSlug: input.lessonSlug,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function loadAssessmentCheckpoint(
  courseTitle: string,
  lessonSlug: string,
  count: number,
): Promise<QuizQuestion[] | null> {
  const journaled = await loadDurableGenerationCheckpoint<QuizQuestion[]>({
    courseTitle,
    lessonSlug,
    kind: 'assessment',
  });
  if (journaled?.length >= count) {
    const strictJournal = generatedAssessmentSchema.safeParse({ questions: journaled.slice(0, count) });
    if (strictJournal.success) return strictJournal.data.questions;
  }

  const target = await resolveLessonTarget(courseTitle, lessonSlug);
  if (!target) return null;
  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('course_lessons')
      .select('quiz_questions')
      .eq('id', target.id)
      .maybeSingle();
    if (error || !Array.isArray(data?.quiz_questions) || data.quiz_questions.length < count) return null;
    const strictCheckpoint = generatedAssessmentSchema.safeParse({
      questions: data.quiz_questions.slice(0, count),
    });
    if (!strictCheckpoint.success) return null;
    await persistDurableGenerationCheckpoint({
      courseTitle,
      lessonSlug,
      kind: 'assessment',
      payload: strictCheckpoint.data.questions,
    });
    return strictCheckpoint.data.questions;
  } catch {
    return null;
  }
}

export async function loadPartialAssessmentCheckpoint(
  courseTitle: string,
  lessonSlug: string,
): Promise<QuizQuestion[] | null> {
  const journaled = await loadDurableGenerationCheckpoint<QuizQuestion[]>({
    courseTitle,
    lessonSlug,
    kind: 'assessment',
  });
  if (journaled?.length) {
    const validJournal = journaled.flatMap((candidate) => {
      const parsed = quizQuestionSchema.safeParse(candidate);
      return parsed.success ? [parsed.data] : [];
    });
    if (validJournal.length) return validJournal;
  }

  const target = await resolveLessonTarget(courseTitle, lessonSlug);
  if (!target) return null;
  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('course_lessons')
      .select('quiz_questions')
      .eq('id', target.id)
      .maybeSingle();
    if (error || !Array.isArray(data?.quiz_questions)) return null;
    const valid = data.quiz_questions.flatMap((candidate) => {
      const parsed = quizQuestionSchema.safeParse(candidate);
      return parsed.success ? [parsed.data] : [];
    });
    if (!valid.length) return null;
    await persistDurableGenerationCheckpoint({
      courseTitle,
      lessonSlug,
      kind: 'assessment',
      payload: valid,
    });
    return valid;
  } catch {
    return null;
  }
}

export async function persistAssessmentCheckpoint(input: {
  courseTitle: string;
  lessonSlug: string;
  questions: QuizQuestion[];
}): Promise<void> {
  await persistDurableGenerationCheckpoint({
    courseTitle: input.courseTitle,
    lessonSlug: input.lessonSlug,
    kind: 'assessment',
    payload: input.questions,
  });

  const target = await resolveLessonTarget(input.courseTitle, input.lessonSlug);
  if (!target) return;
  try {
    const db = await requireAdminClient();
    const { error } = await db
      .from('course_lessons')
      .update({ quiz_questions: input.questions, updated_at: new Date().toISOString() })
      .eq('id', target.id);
    if (error) logger.warn('[course-factory/checkpoint] assessment checkpoint write skipped', { lessonSlug: input.lessonSlug, error: error.message });
  } catch {
    // Best-effort checkpoint only. The canonical build remains authoritative.
  }
}
