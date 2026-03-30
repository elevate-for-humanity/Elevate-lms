import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/lms/video-quiz-results
 * Persists an in-video quiz answer from InteractiveVideoPlayer.
 * Stored in lesson_progress.metadata as a running log of quiz attempts.
 */
export async function POST(request: NextRequest) {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  const { user } = auth;

  let body: {
    question?: string;
    selectedAnswer?: number;
    correctAnswer?: number;
    isCorrect?: boolean;
    timestamp?: number;
    lessonId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const { question, selectedAnswer, correctAnswer, isCorrect, timestamp, lessonId } = body;

  if (question === undefined || selectedAnswer === undefined || isCorrect === undefined) {
    return safeError('Missing required fields: question, selectedAnswer, isCorrect', 400);
  }

  try {
    const supabase = await createClient();

    const result = {
      question,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      timestamp: timestamp ?? null,
      answeredAt: new Date().toISOString(),
    };

    // If a lessonId is provided, append to lesson_progress.metadata
    if (lessonId) {
      const { data: existing } = await supabase
        .from('lesson_progress')
        .select('id, metadata')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (existing) {
        const meta = (existing.metadata as Record<string, any>) ?? {};
        const videoQuizzes: any[] = Array.isArray(meta.videoQuizzes) ? meta.videoQuizzes : [];
        videoQuizzes.push(result);

        await supabase
          .from('lesson_progress')
          .update({ metadata: { ...meta, videoQuizzes } })
          .eq('id', existing.id);
      }
    }

    return NextResponse.json({ ok: true, isCorrect });
  } catch (err) {
    logger.error('video-quiz-results error', err instanceof Error ? err : new Error(String(err)));
    return safeInternalError(err, 'Failed to save quiz result');
  }
}
