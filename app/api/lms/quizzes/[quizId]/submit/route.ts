import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

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

  const { quizId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  // Save individual answers
  for (const result of answerResults) {
    await db
      .from('quiz_attempt_answers')
      .insert({
        attempt_id: attemptId,
        question_id: result.question_id,
        selected_answer_id: result.selected_answer_id || null,
        is_correct: result.is_correct,
        points_earned: result.points_earned,
      });
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

  return NextResponse.json({
    success: true,
    score: scorePercentage,
    passed,
    earnedPoints,
    totalPoints,
  });
}
export const POST = withApiAudit('/api/lms/quizzes/[quizId]/submit', _POST);
