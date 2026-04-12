
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getLearnerProgress } from '@/lib/lms/engine';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

// GET /api/lms/progress?courseId=<uuid>
//
// Returns full learner progress for a course via the engine:
//   completedLessonIds  — array of completed lesson UUIDs
//   checkpointScores    — map of lessonId → { passed, score, passingScore, attemptNumber }
//   stepSubmissions     — map of lessonId → { status }
//   progressPercent     — 0–100
//   courseCompleted     — boolean
//   certificateNumber   — string | null
//
// Falls back to training_lessons-only query when courseId is absent
// (legacy callers that only need a flat completed list).

async function _GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const courseId = req.nextUrl.searchParams.get('courseId');

  if (courseId) {
    // Use engine — covers curriculum_lessons, checkpoint_scores, step_submissions
    const progress = await getLearnerProgress(user.id, courseId);

    return NextResponse.json({
      completedLessonIds:  Array.from(progress.completedLessonIds),
      checkpointScores:    Object.fromEntries(progress.checkpointScores),
      stepSubmissions:     Object.fromEntries(
        Array.from(progress.stepSubmissions.entries()).map(([k, v]) => [k, { status: v.status }])
      ),
      progressPercent:     progress.progressPercent,
      courseCompleted:     progress.courseCompleted,
      certificateNumber:   progress.certificateNumber,
    });
  }

  // Legacy: return flat completed list for user (no courseId)
  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'Admin client failed to initialize' }, { status: 500 });
  const { data: legacyProgress } = await db
    .from('lesson_progress')
    .select('id, completed_at, lesson:course_lessons(title, course_id)')
    .eq('user_id', user.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(10);

  return NextResponse.json({ progress: legacyProgress || [] });
}

export const GET = withApiAudit('/api/lms/progress', _GET as unknown as (req: Request, ...args: any[]) => Promise<Response>);
