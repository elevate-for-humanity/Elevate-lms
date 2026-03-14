import { createClient } from '@/lib/supabase/server';

import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/exams/start/route.ts
import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { selectQuestionsForExamAttempt } from '@/lib/assessments/selectQuestions';
import { getProctoringLaunchUrl } from '@/lib/integrations/proctoring';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const db = supabase;
  const session = await requireApiAuth();
  const { examId } = await request.json();

  if (!examId) {
    return NextResponse.json({ error: 'examId is required' }, { status: 400 });
  }

  const { data: exam, error: examError } = await db
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single();

  if (examError || !exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  const studentId = (session as any).userId || (session as any).user?.id;

  // Check attempts
  const { count } = await db
    .from('exam_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', examId)
    .eq('student_id', studentId);

  const previousAttempts = count || 0;

  if (previousAttempts >= exam.max_attempts) {
    return NextResponse.json(
      { error: 'Maximum attempts reached for this exam' },
      { status: 403 }
    );
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';

  const questions = await selectQuestionsForExamAttempt(examId, exam.adaptive);

  // Create attempt
  const { data: attempt, error: attemptError } = await db
    .from('exam_attempts')
    .insert({
      exam_id: examId,
      student_id: studentId,
      status: 'in_progress',
      attempt_number: previousAttempts + 1,
      ip_address: ip,
      user_agent: ua,
    })
    .select()
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json(
      { error: 'Failed to create attempt' },
      { status: 500 }
    );
  }

  // Create question rows
  const questionRows = questions.map((q, index) => ({
    attempt_id: attempt.id,
    question_id: q.id,
    position: index + 1,
    shown_difficulty: q.difficulty,
  }));

  await db.from('exam_attempt_questions').insert(questionRows);

  // Return questions without correct answers to the client
  const payload = questions.map((q, index) => ({
    id: questionRows[index].question_id,
    position: index + 1,
    type: q.type,
    prompt: q.prompt,
    choices: q.choices,
  }));

  const proctoringUrl =
    exam.proctoring_required && exam.proctoring_provider
      ? getProctoringLaunchUrl({
          provider: exam.proctoring_provider as string,
          examId: exam.id,
          attemptId: attempt.id,
          studentId,
        })
      : null;

  return NextResponse.json({
    attemptId: attempt.id,
    timeLimitMinutes: exam.time_limit_minutes,
    questions: payload,
    proctoringUrl,
  });
}
export const POST = withApiAudit('/api/exams/start', _POST);
