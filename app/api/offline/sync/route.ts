import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { pendingActions } = await req.json();

    // Process pending actions from offline queue
    if (pendingActions && Array.isArray(pendingActions)) {
      for (const action of pendingActions) {
        // Handle different action types
        switch (action.type) {
          case 'progress_update':
            await supabase
              .from('enrollments')
              .update({ progress: action.progress })
              .eq('id', action.enrollmentId);
            break;

          case 'lesson_complete':
            await supabase.from('lesson_completions').insert({
              user_id: user.id,
              lesson_id: action.lessonId,
              completed_at: action.timestamp,
            });
            break;

          case 'quiz_submission':
            await supabase.from('quiz_submissions').insert({
              user_id: user.id,
              quiz_id: action.quizId,
              answers: action.answers,
              submitted_at: action.timestamp,
            });
            break;

          default:
            logger.warn(`Unknown action type: ${action.type}`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      synced: pendingActions?.length || 0,
    });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Sync error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Sync failed' },
      { status: 500 }
    );
  }
}
