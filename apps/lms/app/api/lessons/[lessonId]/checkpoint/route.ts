/**
 * POST /api/lessons/[lessonId]/checkpoint
 *
 * Records a checkpoint/quiz/exam attempt. The server is authoritative for
 * scoring: clients submit answers only; score and passing threshold are loaded
 * from the canonical lesson assessment contract.
 */

import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { recordCheckpointAttempt } from '@/lib/lms/engine';
import { logger } from '@/lib/logger';
import { assertLessonAccess, accessErrorResponse } from '@/lib/lms/access-control';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendTeamsMessage } from '@/lib/notifications/teams';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type StoredQuizQuestion = {
  id?: string;
  prompt?: string;
  question?: string;
  options?: string[];
  correctAnswer?: number | string | boolean;
};

function scoreAnswers(questions: StoredQuizQuestion[], answers: Record<string, number>): number {
  if (!questions.length) throw new Error('Assessment has no questions');

  let correct = 0;
  questions.forEach((question, index) => {
    const questionId = String(question.id ?? index);
    const selectedIndex = answers[questionId];
    if (!Number.isInteger(selectedIndex)) return;

    const options = Array.isArray(question.options) ? question.options : [];
    const expected = question.correctAnswer;
    if (typeof expected === 'number') {
      if (selectedIndex === expected) correct += 1;
      return;
    }
    if (typeof expected === 'boolean') {
      const selected = options[selectedIndex] ?? (selectedIndex === 0 ? 'True' : selectedIndex === 1 ? 'False' : '');
      if (selected.toLowerCase() === String(expected).toLowerCase()) correct += 1;
      return;
    }
    if (typeof expected === 'string') {
      const selected = options[selectedIndex];
      if (selected !== undefined && selected.trim() === expected.trim()) correct += 1;
    }
  });

  return Math.round((correct / questions.length) * 100);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { lessonId } = await params;

  try {
    await assertLessonAccess(user.id, lessonId);
  } catch (e) {
    const { status, body } = accessErrorResponse(e);
    return NextResponse.json(body, { status });
  }

  let body: {
    courseId: string;
    moduleOrder?: number;
    answers?: Record<string, number>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { courseId, moduleOrder = 0, answers = {} } = body;
  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .in('status', ['active', 'enrolled', 'in_progress', 'completed', 'confirmed'])
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
  }

  try {
    const db = await requireAdminClient();
    const { data: lesson, error: lessonError } = await db
      .from('course_lessons')
      .select('id, course_id, lesson_type, passing_score, quiz_questions, is_published')
      .eq('id', lessonId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (lessonError || !lesson || !lesson.is_published) {
      return NextResponse.json({ error: 'Published assessment not found' }, { status: 404 });
    }
    if (!['checkpoint', 'quiz', 'exam'].includes(String(lesson.lesson_type))) {
      return NextResponse.json({ error: 'Lesson is not an assessment' }, { status: 400 });
    }

    const questions = Array.isArray(lesson.quiz_questions)
      ? (lesson.quiz_questions as StoredQuizQuestion[])
      : [];
    if (!questions.length) {
      return NextResponse.json({ error: 'Assessment questions are not configured' }, { status: 409 });
    }

    const score = scoreAnswers(questions, answers);
    const passingScore = Number.isFinite(Number(lesson.passing_score))
      ? Math.max(0, Math.min(100, Number(lesson.passing_score)))
      : 80;

    const result = await recordCheckpointAttempt(
      user.id,
      lessonId,
      courseId,
      moduleOrder,
      score,
      passingScore,
      answers,
    );

    logger.info('[checkpoint] Server-scored attempt recorded', {
      userId: user.id,
      lessonId,
      courseId,
      score,
      passed: result.passed,
      attemptNumber: result.attemptNumber,
    });

    if (!result.passed) {
      sendTeamsMessage(
        'Checkpoint Failed',
        `A learner failed a checkpoint on attempt ${result.attemptNumber}.`,
        {
          'User ID': user.id,
          'Lesson ID': lessonId,
          'Course ID': courseId,
          Score: `${score}% (passing: ${passingScore}%)`,
          Attempt: String(result.attemptNumber),
        },
      ).then(() => {}, () => {});
    }

    return NextResponse.json(result);
  } catch (err) {
    logger.error(
      '[checkpoint] recordCheckpointAttempt failed:',
      err instanceof Error ? err : new Error(String(err)),
    );
    return NextResponse.json({ error: 'Failed to record checkpoint attempt' }, { status: 500 });
  }
}
