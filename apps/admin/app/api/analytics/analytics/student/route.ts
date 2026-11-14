// app/api/analytics/student/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getUserEnrollments } from '@/lib/enrollments/getUserEnrollments';
import { readHoursPages } from '@/lib/apprenticeship/admin-hours';
import { summarizeLearnerProgress, type PublishedProgressLesson, type RecordedLessonProgress } from '@/lib/learner/progress-summary';
import { summarizeRecordedActivity, type RecordedActivity } from '@/lib/learner/recorded-activity';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enrollmentResult = await getUserEnrollments(user.id);
    if (enrollmentResult.error) throw new Error('Enrollment records unavailable');
    const enrollments = enrollmentResult.enrollments.filter(row => ['active', 'enrolled', 'in_progress', 'confirmed', 'completed'].includes(row.status.toLowerCase()));
    const ids = [...new Set(enrollments.map(row => row.course_id).filter((id): id is string => Boolean(id)))];
    const [lessons, progress, activity] = await Promise.all([
      ids.length ? readHoursPages<PublishedProgressLesson>((from, to) => supabase.from('course_lessons')
        .select('id,course_id,title').in('course_id', ids).eq('is_published', true).order('id').range(from, to)) : [],
      ids.length ? readHoursPages<RecordedLessonProgress>((from, to) => supabase.from('lesson_progress')
        .select('lesson_id,course_id,completed,completed_at,updated_at,time_spent_seconds').eq('user_id', user.id).in('course_id', ids).order('id').range(from, to)) : [],
      readHoursPages<RecordedActivity>((from, to) => supabase.from('learning_activity')
        .select('activity_date,created_at,seconds_watched').eq('user_id', user.id).order('id').range(from, to)),
    ]);
    const { overallProgress } = summarizeLearnerProgress(enrollments, lessons, progress, []);
    const response = {
      completionRate: overallProgress.completionRate,
      coursesInProgress: overallProgress.coursesInProgress,
      coursesCompleted: overallProgress.coursesCompleted,
      ...summarizeRecordedActivity(activity),
    };

    return NextResponse.json(response, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    logger.error('[Student Analytics API Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/analytics/analytics/student', _GET);
