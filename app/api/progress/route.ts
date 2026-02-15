import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const supabase = await createClient();

    if (courseId) {
      // Get progress for specific course
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, order_index, duration_minutes')
        .eq('course_id', courseId)
        .order('order_index');

      const { data: lessonProgress } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed, completed_at, time_spent_seconds')
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      const progressMap = new Map(
        lessonProgress?.map((p) => [p.lesson_id, p]) || []
      );

      const lessonsWithProgress = lessons?.map((lesson) => ({
        ...lesson,
        completed: progressMap.get(lesson.id)?.completed || false,
        completedAt: progressMap.get(lesson.id)?.completed_at,
        timeSpent: progressMap.get(lesson.id)?.time_spent_seconds || 0,
      }));

      const completedCount = lessonProgress?.filter((p) => p.completed).length || 0;
      const totalTime = lessonProgress?.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0) || 0;

      return NextResponse.json({
        userId: user.id,
        courseId,
        enrollment,
        overallProgress: enrollment?.progress || 0,
        completedLessons: completedCount,
        totalLessons: lessons?.length || 0,
        timeSpentSeconds: totalTime,
        lessons: lessonsWithProgress,
      });
    }

    // Get all enrollments with progress
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        id,
        course_id,
        status,
        progress,
        started_at,
        completed_at,
        courses (
          id,
          title,
          description
        )
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    const { data: allProgress } = await supabase
      .from('lesson_progress')
      .select('course_id, completed')
      .eq('user_id', user.id);

    const progressByCourse = new Map<string, { completed: number; total: number }>();
    allProgress?.forEach((p) => {
      const current = progressByCourse.get(p.course_id) || { completed: 0, total: 0 };
      current.total++;
      if (p.completed) current.completed++;
      progressByCourse.set(p.course_id, current);
    });

    const enrollmentsWithDetails = enrollments?.map((e) => ({
      ...e,
      lessonProgress: progressByCourse.get(e.course_id) || { completed: 0, total: 0 },
    }));

    return NextResponse.json({
      userId: user.id,
      enrollments: enrollmentsWithDetails,
      totalEnrollments: enrollments?.length || 0,
      activeCount: enrollments?.filter((e) => e.status === 'active').length || 0,
      completedCount: enrollments?.filter((e) => e.status === 'completed').length || 0,
    });
  } catch (error) {
    logger.error('Progress API error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, lessonId, timeSpentSeconds, lastPositionSeconds } = body;

    if (!courseId || !lessonId) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, lessonId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Upsert lesson progress
    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          time_spent_seconds: timeSpentSeconds || 0,
          last_position_seconds: lastPositionSeconds || 0,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,lesson_id',
        }
      )
      .select()
      .single();

    if (error) {
      logger.error('Progress update error:', error);
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      progress: data,
    });
  } catch (error) {
    logger.error('Progress API error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
