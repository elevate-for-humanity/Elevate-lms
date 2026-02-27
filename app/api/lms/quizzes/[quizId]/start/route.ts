import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const { quizId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if quiz exists
  const { data: quiz, error: quizError } = await db
    .from('quizzes')
    .select('id, max_attempts')
    .eq('id', quizId)
    .single();

  if (quizError || !quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
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

  // Redirect to quiz page
  return NextResponse.redirect(new URL(`/lms/quizzes/${quizId}`, request.url));
}
export const POST = withApiAudit('/api/lms/quizzes/[quizId]/start', _POST);
