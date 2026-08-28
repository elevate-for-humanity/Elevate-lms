import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getCurrentUser } from '@/lib/auth';
import { assertLessonAccess, accessErrorResponse } from '@/lib/lms/access-control';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type QuizAnswerBody = {
  lessonId?: unknown;
  courseId?: unknown;
  question?: unknown;
  selectedAnswer?: unknown;
  correctAnswer?: unknown;
  isCorrect?: unknown;
  timestamp?: unknown;
};

function integer(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null;
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as QuizAnswerBody | null;
  const lessonId = typeof body?.lessonId === 'string' ? body.lessonId.trim() : '';
  const courseId = typeof body?.courseId === 'string' ? body.courseId.trim() : '';
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  const selectedAnswer = integer(body?.selectedAnswer);
  const correctAnswer = integer(body?.correctAnswer);
  const timestamp = typeof body?.timestamp === 'number' && Number.isFinite(body.timestamp)
    ? Math.max(0, body.timestamp)
    : null;

  if (
    !lessonId ||
    !courseId ||
    !question ||
    question.length > 2000 ||
    selectedAnswer === null ||
    selectedAnswer < 0 ||
    correctAnswer === null ||
    correctAnswer < 0 ||
    typeof body?.isCorrect !== 'boolean'
  ) {
    return NextResponse.json(
      { error: 'A valid lesson, question, selected answer, correct answer, and result are required.' },
      { status: 400 },
    );
  }

  try {
    await assertLessonAccess(user.id, lessonId);
  } catch (error) {
    const { status, body: errorBody } = accessErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }

  const db = await requireAdminClient();
  const { data: lesson, error: lessonError } = await db
    .from('course_lessons')
    .select('course_id')
    .eq('id', lessonId)
    .maybeSingle();
  if (lessonError || !lesson || lesson.course_id !== courseId) {
    return NextResponse.json({ error: 'The lesson does not belong to the requested course.' }, { status: 400 });
  }
  const { error } = await db.from('interactive_video_quiz_answers').upsert(
    {
      user_id: user.id,
      course_id: courseId,
      lesson_id: lessonId,
      question,
      selected_answer: selectedAnswer,
      correct_answer: correctAnswer,
      is_correct: body.isCorrect,
      timestamp_sec: timestamp,
      answered_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_id,question' },
  );

  if (error) {
    logger.error('Interactive video quiz answer persistence failed', error, {
      userId: user.id,
      lessonId,
    });
    return NextResponse.json({ error: 'Unable to save the checkpoint response.' }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
