import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { getUserEnrollments } from '@/lib/enrollments/getUserEnrollments';
import { readHoursPages } from '@/lib/apprenticeship/admin-hours';
import { summarizeLearnerProgress, type PublishedProgressLesson, type RecordedLessonProgress } from '@/lib/learner/progress-summary';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const { user, error: authError } = await requireAuth(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { enrollments, error } = await getUserEnrollments(user.id);
    if (error) throw new Error('Enrollment records unavailable');
    const eligible = enrollments.filter(row => ['active', 'enrolled', 'in_progress', 'confirmed', 'completed'].includes(row.status.toLowerCase()));
    const ids = [...new Set(eligible.map(row => row.course_id).filter((id): id is string => Boolean(id)))];
    const db = await createClient();
    const [lessons, progress, attempts] = ids.length ? await Promise.all([
      readHoursPages<PublishedProgressLesson>((from, to) => db.from('course_lessons').select('id,course_id,title')
        .in('course_id', ids).eq('is_published', true).order('order_index').order('id').range(from, to)),
      readHoursPages<RecordedLessonProgress>((from, to) => db.from('lesson_progress').select('lesson_id,course_id,completed,completed_at,updated_at,time_spent_seconds')
        .eq('user_id', user.id).in('course_id', ids).order('id').range(from, to)),
      readHoursPages<{ score: number }>((from, to) => db.from('quiz_attempts').select('score')
        .eq('user_uuid', user.id).in('course_id', ids).not('completed_at', 'is', null).order('id').range(from, to)),
    ]) : [[], [], []];
    const summary = summarizeLearnerProgress(eligible, lessons, progress, attempts.map(attempt => attempt.score));
    const range = request.nextUrl.searchParams.get('range');
    const days = range === 'month' ? 30 : range === 'year' ? 365 : 7;
    const end = new Date();
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - days + 1));
    const weeklyActivity = Array.from({ length: days }, (_, index) => {
      const date = new Date(start); date.setUTCDate(date.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      const completed = new Set(progress.filter(row => row.completed && row.completed_at?.startsWith(key) && lessons.some(lesson => lesson.id === row.lesson_id)).map(row => row.lesson_id)).size;
      return { day: key, completed };
    });
    const activity = range === 'year'
      ? [...weeklyActivity.reduce((months, day) => {
          const key = day.day.slice(0, 7);
          months.set(key, (months.get(key) || 0) + day.completed);
          return months;
        }, new Map<string, number>())].map(([day, completed]) => ({ day, completed }))
      : weeklyActivity;
    return NextResponse.json({ success: true, data: { ...summary, weeklyActivity: activity } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    logger.error('Learner progress unavailable', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Progress could not be loaded. Please try again.' }, { status: 503 });
  }
}
