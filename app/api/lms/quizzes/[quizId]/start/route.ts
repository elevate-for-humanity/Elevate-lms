import { logger } from '@/lib/logger';
import { requireApiRole } from '@/lib/auth/require-api-role';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const auth = await requireApiRole(['student', 'admin', 'super_admin']);
  if (auth instanceof NextResponse) return auth;

  const { user, db } = auth;
  const { quizId } = await params;

  // Check if quiz exists and resolve course_id for enrollment check.
  // quizzes.course_id is the direct link — no multi-join needed.
  const { data: quiz, error: quizError } = await db
    .from('quizzes')
    .select('id, course_id, max_attempts, requires_proctoring')
    .eq('id', quizId)
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  // A quiz with no course_id is corrupt data — fail closed rather than
  // skipping enrollment verification and allowing an unscoped write.
  if (!quiz.course_id) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  // Verify enrollment before creating any attempt.
  // Without this, any authenticated user can start attempts for any quiz ID.
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', quiz.course_id)
    .in('status', ['active', 'enrolled', 'in_progress', 'completed', 'confirmed'])
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
  }

  // Check existing attempts
  const { data: existingAttempts } = await db
    .from('quiz_attempts')
    .select('id, completed_at')
    .eq('quiz_id', quizId)
    .eq('user_id', user.id);

  const completedAttempts = existingAttempts?.filter(a => a.completed_at) || [];
  
  // Check if max attempts reached
  if (quiz.max_attempts && completedAttempts.length >= quiz.max_attempts) {
    return NextResponse.json({ error: 'Maximum attempts reached' }, { status: 403 });
  }

  // Check for in-progress attempt
  const inProgressAttempt = existingAttempts?.find(a => !a.completed_at);
  
  if (inProgressAttempt) {
    // Resume existing attempt
    return NextResponse.redirect(new URL(`/lms/quizzes/${quizId}`, request.url));
  }

  // Create new attempt
  const { data: newAttempt, error: attemptError } = await db
    .from('quiz_attempts')
    .insert({
      quiz_id: quizId,
      user_id: user.id,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (attemptError) {
    logger.error('Error creating quiz attempt:', attemptError);
    return NextResponse.json({ error: 'Failed to start quiz' }, { status: 500 });
  }

  // Create exam session for proctored quizzes
  if (quiz.requires_proctoring && newAttempt) {
    const { data: profile } = await db
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const { error: sessionError } = await db
      .from('exam_sessions')
      .insert({
        student_id: user.id,
        student_name: profile?.full_name || user.email || 'Unknown',
        student_email: profile?.email || user.email,
        provider: 'other',
        exam_name: `Quiz: ${quizId}`,
        delivery_method: 'online_proctored',
        status: 'in_progress',
        result: 'pending',
        started_at: new Date().toISOString(),
        proctor_name: 'System (automated)',
        duration_min: 0,
        quiz_attempt_id: newAttempt.id,
      })
      .select('id')
      .single();

    if (sessionError) {
      logger.error('Error creating exam session for proctored quiz:', sessionError);
      // Don't block the quiz — monitoring is best-effort
    }
  }

  // Redirect to quiz page
  return NextResponse.redirect(new URL(`/lms/quizzes/${quizId}`, request.url));
}
export const POST = withApiAudit('/api/lms/quizzes/[quizId]/start', _POST);
