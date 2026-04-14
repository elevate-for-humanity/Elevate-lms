import { logger } from '@/lib/logger';
import { requireApiRole } from '@/lib/auth/require-api-role';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { updateProgressAfterQuiz } from '@/lib/lms/update-program-progress';

interface SubmitRequest {
  attemptId: string;
  answers: Record<string, string>; // questionId -> answerId
}

async function _POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

  const auth = await requireApiRole(['student', 'admin', 'super_admin']);
  if (auth instanceof NextResponse) return auth;

  const { user, db } = auth;
  const { quizId } = await params;

  let body: SubmitRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { attemptId, answers } = body;

  if (!attemptId || !answers) {
    return NextResponse.json({ error: 'Missing attemptId or answers' }, { status: 400 });
  }

  // Verify attempt belongs to user and is not completed
  const { data: attempt, error: attemptError } = await db
    .from('quiz_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .eq('quiz_id', quizId)
    .is('completed_at', null)
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Invalid or completed attempt' }, { status: 400 });
  }

  // Get quiz details
  const { data: quiz } = await db
    .from('quizzes')
    .select('passing_score')
    .eq('id', quizId)
    .single();

  // Get questions with correct answers
  const { data: questions } = await db
    .from('quiz_questions')
    .select(`
      id,
      points,
      quiz_answers (
        id,
        is_correct
      )
    `)
    .eq('quiz_id', quizId);

  if (!questions) {
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }

  // Calculate score
  let earnedPoints = 0;
  let totalPoints = 0;
  const answerResults: Array<{
    question_id: string;
    selected_answer_id: string;
    is_correct: boolean;
    points_earned: number;
  }> = [];

  for (const question of questions) {
    const questionPoints = question.points || 1;
    totalPoints += questionPoints;

    const selectedAnswerId = answers[question.id];
    const correctAnswer = question.quiz_answers?.find((a: { id: string; is_correct: boolean }) => a.is_correct);
    const isCorrect = selectedAnswerId === correctAnswer?.id;

    if (isCorrect) {
      earnedPoints += questionPoints;
    }

    answerResults.push({
      question_id: question.id,
      selected_answer_id: selectedAnswerId || '',
      is_correct: isCorrect,
      points_earned: isCorrect ? questionPoints : 0,
    });
  }

  const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = scorePercentage >= (quiz?.passing_score || 70);

  // Save all answers in a single batch insert instead of one round-trip per
  // question. For a 50-question quiz the old loop made 50 sequential DB calls.
  if (answerResults.length > 0) {
    const { error: answersError } = await db
      .from('quiz_attempt_answers')
      .insert(
        answerResults.map((result) => ({
          attempt_id: attemptId,
          question_id: result.question_id,
          selected_answer_id: result.selected_answer_id || null,
          is_correct: result.is_correct,
          points_earned: result.points_earned,
        }))
      );

    if (answersError) {
      logger.error('Error saving quiz answers:', answersError);
      return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 });
    }
  }

  // Update attempt with results
  const { error: updateError } = await db
    .from('quiz_attempts')
    .update({
      completed_at: new Date().toISOString(),
      score: scorePercentage,
      points_earned: earnedPoints,
      points_possible: totalPoints,
      passed,
    })
    .eq('id', attemptId);

  if (updateError) {
    logger.error('Error updating attempt:', updateError);
    return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
  }

  // Update durable progress summary — best-effort, must not block response
  await updateProgressAfterQuiz(user.id, quizId);

  return NextResponse.json({
    success: true,
    score: scorePercentage,
    passed,
    earnedPoints,
    totalPoints,
  });
}
export const POST = withApiAudit('/api/lms/quizzes/[quizId]/submit', _POST);
