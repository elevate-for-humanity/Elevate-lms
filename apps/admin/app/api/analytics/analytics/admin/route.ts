import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const supabase = await requireAdminClient();

  const { count: totalLearners } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: activeThisWeek } = await supabase
    .from('user_activity')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString());

  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('id, user_id, course_id, status, progress_percent');

  const enrollmentRows = enrollments ?? [];
  const completed = enrollmentRows.filter(
    (e: any) => e.status === 'completed' || Number(e.progress_percent ?? 0) >= 100,
  ).length;
  const completionRate = enrollmentRows.length > 0 ? (completed / enrollmentRows.length) * 100 : 0;

  const { data: activityRows } = await supabase
    .from('user_activity')
    .select('duration_seconds')
    .gte('created_at', weekAgo.toISOString());
  const totalSeconds = (activityRows ?? []).reduce(
    (sum: number, row: any) => sum + Number(row.duration_seconds ?? 0),
    0,
  );
  const activeLearnerCount = new Set((enrollmentRows ?? []).map((e: any) => e.user_id).filter(Boolean)).size;
  const averageTimePerWeekHours = activeLearnerCount > 0 ? totalSeconds / 3600 / activeLearnerCount : 0;

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('status', 'published');

  const byProgram: Array<{ programName: string; learners: number; completionRate: number }> = [];
  for (const course of courses ?? []) {
    const courseEnrollments = enrollmentRows.filter((e: any) => e.course_id === course.id);
    const learnerIds = [...new Set(courseEnrollments.map((e: any) => e.user_id).filter(Boolean))];
    const learnerCount = learnerIds.length;
    let courseCompletedCount = 0;

    const { data: lessons } = await supabase
      .from('course_lessons')
      .select('id')
      .eq('course_id', course.id);
    const totalLessons = lessons?.length ?? 0;

    for (const enrollment of courseEnrollments) {
      if (enrollment.status === 'completed' || Number(enrollment.progress_percent ?? 0) >= 100) {
        courseCompletedCount++;
        continue;
      }
      if (totalLessons > 0 && enrollment.user_id) {
        const { data: progress } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', enrollment.user_id)
          .eq('completed', true);
        const completedLessonIds = new Set(progress?.map((p: any) => p.lesson_id) || []);
        const completedLessons = lessons?.filter((l: any) => completedLessonIds.has(l.id)).length || 0;
        if (completedLessons >= totalLessons) courseCompletedCount++;
      }
    }

    const courseCompletionRate = learnerCount > 0 ? (courseCompletedCount / learnerCount) * 100 : 0;
    byProgram.push({
      programName: course.title,
      learners: learnerCount,
      completionRate: Math.round(courseCompletionRate),
    });
  }

  return NextResponse.json({
    totalLearners: totalLearners || 0,
    activeThisWeek: activeThisWeek || 0,
    completionRate: Math.round(completionRate),
    averageTimePerWeekHours: Math.round(averageTimePerWeekHours * 10) / 10,
    byProgram,
  });
}

export const GET = withApiAudit('/api/analytics/analytics/admin', _GET);
