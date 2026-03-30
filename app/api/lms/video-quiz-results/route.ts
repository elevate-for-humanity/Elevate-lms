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
 * Upserts into interactive_video_quiz_answers — one row per user+lesson+question.
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

  if (!question || selectedAnswer === undefined || isCorrect === undefined) {
    return safeError('Missing required fields: question, selectedAnswer, isCorrect', 400);
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('interactive_video_quiz_answers')
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId ?? null,
          question,
          selected_answer: selectedAnswer,
          correct_answer: correctAnswer ?? null,
          is_correct: isCorrect,
          timestamp_sec: timestamp ?? null,
          answered_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id,question' }
      );

    if (error) {
      logger.error('video-quiz-results upsert error', error);
      return safeError('Failed to save quiz result', 500);
    }

    return NextResponse.json({ ok: true, isCorrect });
  } catch (err) {
    logger.error('video-quiz-results error', err instanceof Error ? err : new Error(String(err)));
    return safeInternalError(err, 'Failed to save quiz result');
  }
}
