// GET /api/learner/progress?range=week|month|all
// Returns progress data for the authenticated learner used by ProgressTrackingDashboard.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'week';

  const rangeStart = new Date();
  if (range === 'week') rangeStart.setDate(rangeStart.getDate() - 7);
  else if (range === 'month') rangeStart.setMonth(rangeStart.getMonth() - 1);
  else rangeStart.setFullYear(2000); // 'all'

  // Fetch enrollments with course info
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('id, program_id, status, created_at, programs(title)')
    .eq('user_id', user.id)
    .in('status', ['active', 'completed']);

  // Fetch lesson progress
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed, completed_at, course_id')
    .eq('user_id', user.id);

  const completedLessons = progress?.filter(p => p.completed) ?? [];
  const recentCompleted = completedLessons.filter(
    p => p.completed_at && new Date(p.completed_at) >= rangeStart
  );

  // Build per-course progress
  const courseMap = new Map<string, { title: string; completed: number; total: number }>();
  for (const enr of enrollments ?? []) {
    const prog = enrollments ? progress?.filter(p => p.course_id === enr.program_id) ?? [] : [];
    courseMap.set(enr.program_id, {
      title: (enr.programs as any)?.title ?? 'Course',
      completed: prog.filter(p => p.completed).length,
      total: prog.length || 1,
    });
  }

  const courses = Array.from(courseMap.entries()).map(([id, c]) => ({
    id,
    title: c.title,
    progress: Math.round((c.completed / c.total) * 100),
    lessonsCompleted: c.completed,
    totalLessons: c.total,
    lastActivity: '',
    status: 'on-track' as const,
    nextMilestone: '',
  }));

  // Weekly activity — count completions per day for last 7 days
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyActivity = days.map((day, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().slice(0, 10);
    const count = completedLessons.filter(
      p => p.completed_at?.slice(0, 10) === dayStr
    ).length;
    return { day, hours: Math.round(count * 0.5 * 10) / 10, completed: count };
  });

  const overallProgress = {
    completionRate: courses.length
      ? Math.round(courses.reduce((s, c) => s + c.progress, 0) / courses.length)
      : 0,
    studyHours: Math.round(completedLessons.length * 0.5 * 10) / 10,
    coursesInProgress: (enrollments ?? []).filter(e => e.status === 'active').length,
    coursesCompleted: (enrollments ?? []).filter(e => e.status === 'completed').length,
    streak: 0,
    averageScore: 0,
  };

  return NextResponse.json({
    data: {
      overallProgress,
      courses,
      weeklyActivity,
      milestones: [],
    },
  });
}
