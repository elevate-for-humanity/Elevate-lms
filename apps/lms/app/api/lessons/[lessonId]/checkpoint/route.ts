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
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';
import { requireAdminClient } from '@/lib/supabase/admin';
import {evaluateAnswer,scoreAnswers,type StoredQuizQuestion} from '@/lib/lms/assessment-feedback';
import { sendTeamsMessage } from '@/lib/notifications/teams';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  // Match lesson completion: direct course enrollment and program-course grants
  // use the same user_id OR student_id ownership boundary.
  const enrollment = await resolveCourseEnrollment(user.id, courseId);
  if (
    !enrollment ||
    !['active', 'enrolled', 'in_progress', 'completed', 'confirmed'].includes(enrollment.status)
  ) {
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
    if (
      !['checkpoint', 'quiz', 'exam', 'lesson', 'reading', 'video'].includes(
        String(lesson.lesson_type),
      )
    ) {
      return NextResponse.json({ error: 'Lesson is not an assessment' }, { status: 400 });
    }

    const questions = Array.isArray(lesson.quiz_questions)
      ? (lesson.quiz_questions as StoredQuizQuestion[])
      : [];
    if (!questions.length) {
      return NextResponse.json(
        { error: 'Assessment questions are not configured' },
        { status: 409 },
      );
    }

    // Do not record or pass a quiz with missing answer keys. Personal
    // reflection fields are saved by the separate workbook route, not graded.
    if (questions.some((question) => !evaluateAnswer(question, undefined).configured)) {
      return NextResponse.json({ error: 'Assessment answer key requires instructor review' }, { status: 409 });
    }
    const score = scoreAnswers(questions, answers);
    const passingScore =
      lesson.passing_score != null && Number.isFinite(Number(lesson.passing_score))
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
      ).then(
        () => {},
        () => {},
      );
    }

    const feedback = questions.map((question, index) => {
      const questionId = String(question.id || `q-${index + 1}`);
      const evaluation = evaluateAnswer(question, answers[questionId] ?? answers[String(index)]);
      return {
        question: question.question || question.question_text || question.prompt || `Question ${index + 1}`,
        correct: evaluation.correct,
        correctAnswer: evaluation.correctOption,
        explanation: question.explanation ||
          (evaluation.correct ? 'That is the correct selection.' : 'Review the lesson explanation, then try the question again.'),
      };
    });
    return NextResponse.json({ ...result, feedback });
  } catch (err) {
    logger.error(
      '[checkpoint] recordCheckpointAttempt failed:',
      err instanceof Error ? err : new Error(String(err)),
    );
    return NextResponse.json({ error: 'Failed to record checkpoint attempt' }, { status: 500 });
  }
}
