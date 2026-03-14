
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/exams/submit/route.ts
import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

  const supabase = createSupabaseClient();
  const db = supabase;
  const session = await requireApiAuth();
  const { attemptId, answers } = await request.json();

  if (!attemptId || !Array.isArray(answers)) {
    return NextResponse.json(
      { error: 'attemptId and answers[] are required' },
      { status: 400 }
    );
  }

  const { data: attempt, error: attemptError } = await db
    .from('exam_attempts')
    .select(
      '*, exam:exams(*), exam_attempt_questions(*, question:questions(*))'
    )
    .eq('id', attemptId)
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
  }

  const userId = (session as any).userId || (session as any).user?.id;
  if (attempt.student_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (attempt.status === 'completed') {
    return NextResponse.json(
      { error: 'Attempt already completed' },
      { status: 400 }
    );
  }

  // Check time limit
  const now = new Date();
  const elapsedMinutes =
    (now.getTime() - new Date(attempt.started_at).getTime()) / (1000 * 60);
  if (elapsedMinutes > attempt.exam.time_limit_minutes + 5) {
    // 5-minute grace
    return NextResponse.json({ error: 'Time limit exceeded' }, { status: 400 });
  }

  // Map answers by attemptQuestionId
  const answerMap = new Map<string, any>();
  for (const a of answers) {
    answerMap.set(a.attemptQuestionId, a.answer);
  }

  // Grade
  let correctCount = 0;
  const updates = [];

  for (const aq of attempt.exam_attempt_questions) {
    const studentAnswer = answerMap.get(aq.id);
    if (typeof studentAnswer === 'undefined') continue;

    const correctAnswer = aq.question.correct_answer;
    const isCorrect =
      JSON.stringify(studentAnswer) === JSON.stringify(correctAnswer);
    if (isCorrect) correctCount++;

    updates.push(
      db
        .from('exam_attempt_questions')
        .update({
          student_answer: studentAnswer,
          is_correct: isCorrect,
          answered_at: now.toISOString(),
        })
        .eq('id', aq.id)
    );
  }

  if (updates.length > 0) {
    await Promise.all(updates);
  }

  const totalQuestions = attempt.exam_attempt_questions.length || 1;
  const score = (correctCount / totalQuestions) * 100;

  await db
    .from('exam_attempts')
    .update({
      status: 'completed',
      completed_at: now.toISOString(),
      score,
    })
    .eq('id', attempt.id);

  const passed = score >= attempt.exam.passing_score;

  return NextResponse.json({
    score,
    passed,
    correctCount,
    totalQuestions,
  });
}
export const POST = withApiAudit('/api/exams/submit', _POST);
