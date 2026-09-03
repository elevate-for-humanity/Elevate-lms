/**
 * Canonical LMS learner interaction endpoint.
 * Reads authored lesson experiences from course_lessons.content_json first.
 * Falls back to optional blueprint interaction specifications.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AttemptSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  interactionId: z.string().min(1).max(240),
  interactionType: z.enum(['knowledge-check', 'scenario', 'case-study']),
  responses: z.array(z.number().int().nonnegative()).min(1).max(50),
});

export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const courseId = request.nextUrl.searchParams.get('courseId');
  const lessonId = request.nextUrl.searchParams.get('lessonId');
  if (!courseId || !lessonId)
    return NextResponse.json({ error: 'courseId and lessonId required' }, { status: 400 });

  try {
    const db = await createClient();
    const { data: lesson, error: lessonError } = await db
      .from('course_lessons')
      .select(
        'id,slug,title,course_id,module_id,content_json,content,quiz_questions,activities,video_url',
      )
      .eq('id', lessonId)
      .eq('course_id', courseId)
      .maybeSingle();
    if (lessonError) throw lessonError;
    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

    const lessonSlug = lesson.slug;
    const contentJson =
      lesson.content_json && typeof lesson.content_json === 'object'
        ? (lesson.content_json as Record<string, any>)
        : {};
    const contentRecord = normalizeContent(lesson.content);
    const storedExperience = contentJson.experience ?? contentRecord.experience;
    const authored =
      storedExperience && typeof storedExperience === 'object'
        ? (storedExperience as Record<string, any>)
        : null;
    // Interaction-specific persistence is optional; lesson completion remains canonical.
    // Do not fail the entire lesson when the optional interaction_progress table is absent.
    let progressRows: Array<Record<string, any>> = [];
    const { data: progress, error: progressError } = await db
      .from('interaction_progress')
      .select('*')
      .eq('learner_id', user.id)
      .eq('course_id', courseId)
      .eq('lesson_id', lessonId)
      .eq('lesson_slug', lessonSlug);
    if (!progressError && progress) progressRows = progress;

    if (authored && Object.keys(authored).length > 0) {
      const interactions = experienceToInteractions(lessonSlug, authored, progressRows);
      return NextResponse.json({
        success: true,
        source: 'lesson-experience',
        lessonSlug,
        interactions,
        flashcards: Array.isArray(authored.flashcards) ? authored.flashcards : [],
        narrationScript: authored.narrationScript ?? null,
        visualPrompt: authored.visualPrompt ?? null,
        practicalTask: authored.practicalTask ?? null,
        interactiveVideo: authored.interactiveVideo ?? null,
        experience: authored,
        meta: {
          totalInteractions: interactions.length,
          completedInteractions: interactions.filter((i) => i.completed).length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      source: 'none',
      lessonSlug,
      interactions: [],
      flashcards: [],
    });
  } catch (error) {
    console.error('[learner/interactions]', error);
    return NextResponse.json({ error: 'Failed to load interactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = AttemptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid interaction attempt' }, { status: 400 });
  }

  const { courseId, lessonId, interactionId, interactionType, responses } = parsed.data;

  try {
    const db = await createClient();
    const { data: lesson, error: lessonError } = await db
      .from('course_lessons')
      .select('id,slug,title,course_id,content_json,content,quiz_questions,activities,video_url')
      .eq('id', lessonId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (lessonError) throw lessonError;
    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

    const contentJson =
      lesson.content_json && typeof lesson.content_json === 'object'
        ? (lesson.content_json as Record<string, any>)
        : {};
    const contentRecord = normalizeContent(lesson.content);
    const storedExperience = contentJson.experience ?? contentRecord.experience;
    const experience =
      storedExperience && typeof storedExperience === 'object'
        ? (storedExperience as Record<string, any>)
        : null;
    if (!experience) {
      return NextResponse.json(
        { error: 'This lesson has not passed the interactive Course Builder gate' },
        { status: 409 },
      );
    }

    const expectedId =
      interactionType === 'knowledge-check'
        ? `${lesson.slug}-kc`
        : interactionType === 'case-study'
          ? `${lesson.slug}-case`
          : `${lesson.slug}-scenario`;
    if (interactionId !== expectedId) {
      return NextResponse.json(
        { error: 'Interaction does not belong to this lesson' },
        { status: 400 },
      );
    }

    const scored = scoreAttempt(interactionType, responses, experience);
    if (!scored) {
      return NextResponse.json(
        { error: 'Interaction is not configured for scoring' },
        { status: 409 },
      );
    }

    const { data: current } = await db
      .from('interaction_progress')
      .select('attempts')
      .eq('learner_id', user.id)
      .eq('lesson_id', lessonId)
      .eq('interaction_id', interactionId)
      .maybeSingle();

    const now = new Date().toISOString();
    const row = {
      learner_id: user.id,
      course_id: courseId,
      lesson_id: lessonId,
      lesson_slug: lesson.slug,
      interaction_id: interactionId,
      interaction_type: interactionType,
      answers: responses,
      score: scored.score,
      completed: scored.completed,
      attempts: Number(current?.attempts ?? 0) + 1,
      weak_objectives: scored.weakObjectives,
      feedback: scored.feedback,
      completed_at: scored.completed ? now : null,
      updated_at: now,
    };
    const { data: saved, error: saveError } = await db
      .from('interaction_progress')
      .upsert(row, { onConflict: 'learner_id,lesson_id,interaction_id' })
      .select('interaction_id,score,completed,attempts,weak_objectives,feedback,updated_at')
      .single();
    if (saveError) throw saveError;

    return NextResponse.json({ success: true, attempt: saved });
  } catch (error) {
    console.error('[learner/interactions/attempt]', error);
    return NextResponse.json({ error: 'Failed to save interaction attempt' }, { status: 500 });
  }
}

function normalizeContent(value: unknown): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value))
    return value as Record<string, any>;
  if (typeof value !== 'string' || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    return { html: value };
  }
  return { html: value };
}

function scoreAttempt(
  type: z.infer<typeof AttemptSchema>['interactionType'],
  responses: number[],
  experience: Record<string, any>,
): {
  score: number;
  completed: boolean;
  weakObjectives: string[];
  feedback: Record<string, unknown>;
} | null {
  if (type === 'knowledge-check') {
    const questions = Array.isArray(experience.knowledgeChecks) ? experience.knowledgeChecks : [];
    if (!questions.length || responses.length !== questions.length) return null;

    const missed: number[] = [];
    questions.forEach((question: any, index: number) => {
      const correct = Number(question.correct ?? question.correctAnswer);
      if (responses[index] !== correct) missed.push(index);
    });
    const correctCount = questions.length - missed.length;
    const score = Math.round((correctCount / questions.length) * 100);
    const passingScore = Number(experience.remediation?.passingScore ?? 80);
    const objectiveMap = Array.isArray(experience.remediation?.objectiveMap)
      ? experience.remediation.objectiveMap
      : [];
    const weakObjectives = missed
      .map((index) => String(objectiveMap[index] ?? '').trim())
      .filter(Boolean);

    return {
      score,
      completed: score >= passingScore,
      weakObjectives: [...new Set(weakObjectives)],
      feedback: {
        correctCount,
        questionCount: questions.length,
        passingScore,
        reviewMessage:
          experience.remediation?.reviewMessage ??
          'Review the missed objectives and retry the knowledge check.',
      },
    };
  }

  const activity = type === 'case-study' ? experience.caseStudy : experience.scenario;
  const options = Array.isArray(activity?.options) ? activity.options : [];
  const selected = options[responses[0]];
  if (!selected) return null;
  const completed = selected.isCorrect === true;
  return {
    score: completed ? 100 : 0,
    completed,
    weakObjectives: completed ? [] : [String(activity.title ?? 'Applied decision')],
    feedback: {
      selected: responses[0],
      message:
        selected.feedback ??
        (completed ? 'Correct. Apply that reasoning on the job.' : 'Review the lesson and retry.'),
    },
  };
}

type Interaction = {
  id: string;
  type: string;
  title: string;
  position: string;
  completed: boolean;
  score?: number;
  attempts: number;
  data: Record<string, unknown>;
};

function stateFor(id: string, rows: Array<Record<string, any>>) {
  const row = rows.find((item) => item.interaction_id === id || item.interaction_type === id);
  return {
    completed: !!row?.completed,
    score: row?.score as number | undefined,
    attempts: Number(row?.attempts ?? 0),
  };
}

function experienceToInteractions(
  slug: string,
  experience: Record<string, any>,
  rows: Array<Record<string, any>>,
): Interaction[] {
  const out: Interaction[] = [];
  const add = (suffix: string, type: string, title: string, data: any, position = 'inline') => {
    if (data === undefined || data === null || (Array.isArray(data) && data.length === 0)) return;
    const id = `${slug}-${suffix}`;
    out.push({
      id,
      type,
      title,
      position,
      ...stateFor(id, rows),
      data: typeof data === 'object' ? data : { value: data },
    });
  };
  if (Array.isArray(experience.knowledgeChecks) && experience.knowledgeChecks.length > 0) {
    add('kc', 'knowledge-check', 'Knowledge Check', {
      questions: experience.knowledgeChecks,
      passingScore: experience.remediation?.passingScore ?? 80,
      remediation: experience.remediation ?? null,
    });
  }
  add(
    'scenario',
    'scenario',
    experience.scenario?.title ?? 'Workplace Scenario',
    experience.scenario,
    'checkpoint',
  );
  add('hotspots', 'click-to-reveal', 'Interactive Diagram', experience.hotspots);
  add('drag-drop', 'drag-drop', 'Drag and Drop', experience.dragDrop);
  add('matching', 'matching', 'Matching Activity', experience.matching);
  add(
    'case',
    'case-study',
    experience.caseStudy?.title ?? 'Case Study',
    experience.caseStudy,
    'checkpoint',
  );
  add(
    'simulation',
    'simulation',
    experience.simulation?.title ?? 'Simulation',
    experience.simulation,
    'end',
  );
  add('decision-tree', 'decision-tree', 'Decision Practice', experience.decisionTree, 'checkpoint');
  add(
    'practical',
    'practical',
    experience.practicalTask?.title ?? 'Hands-on Practical',
    experience.practicalTask,
    'end',
  );
  add(
    'interactive-video',
    'interactive-video',
    experience.interactiveVideo?.title ?? 'Interactive Video',
    experience.interactiveVideo,
  );
  return out;
}
