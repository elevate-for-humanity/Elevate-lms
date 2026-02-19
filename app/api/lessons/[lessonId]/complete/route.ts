import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId } = await params;
    const body = await request.json().catch(() => ({}));
    const { timeSpentSeconds } = body;

    const supabase = await createClient();

    // Get lesson to find course_id
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, course_id, title')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Check if user is enrolled in the course
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', lesson.course_id)
      .single();

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Mark lesson as complete
    const { data: progress, error: progressError } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          course_id: lesson.course_id,
          completed: true,
          completed_at: new Date().toISOString(),
          time_spent_seconds: timeSpentSeconds || 0,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,lesson_id',
        }
      )
      .select()
      .single();

    if (progressError) {
      logger.error('Lesson completion error:', progressError);
      return NextResponse.json(
        { error: 'Failed to mark lesson complete' },
        { status: 500 }
      );
    }

    // Get updated course progress
    const { data: allLessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', lesson.course_id);

    const { data: completedLessons } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', lesson.course_id)
      .eq('completed', true);

    const totalLessons = allLessons?.length || 0;
    const completedCount = completedLessons?.length || 0;
    const progressPercent = totalLessons > 0 
      ? Math.round((completedCount / totalLessons) * 100) 
      : 0;

    // Update enrollment progress (enrollments is a view, update underlying table)
    const { error: rpcError } = await supabase.rpc('update_enrollment_progress_manual', {
      p_user_id: user.id,
      p_course_id: lesson.course_id,
      p_progress: progressPercent
    });
    
    if (rpcError) {
      // Fallback: try direct update if RPC doesn't exist
      await supabase
        .from('enrollments')
        .update({ progress: progressPercent, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('course_id', lesson.course_id);
    }

    // Check if course is now complete
    const courseCompleted = progressPercent === 100;

    // Auto-create certificate if course completed
    let certificate = null;
    if (courseCompleted) {
      // Fetch actual course title (lesson.title is the lesson name, not the course)
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', lesson.course_id)
        .single();

      const { issueCertificate } = await import('@/lib/certificates/issue-certificate');
      const certResult = await issueCertificate({
        supabase,
        studentId: user.id,
        courseId: lesson.course_id,
        enrollmentId: enrollment.id,
        studentName: user.user_metadata?.full_name || user.email || 'Student',
        courseTitle: course?.title || lesson.title,
      });
      if (certResult.success && certResult.certificate) {
        certificate = certResult.certificate;
      }
    }

    return NextResponse.json({
      success: true,
      lessonId,
      lessonTitle: lesson.title,
      completed: true,
      completedAt: progress.completed_at,
      courseProgress: {
        completedLessons: completedCount,
        totalLessons,
        progressPercent,
        courseCompleted,
      },
      certificate,
    });
  } catch (error) {
    logger.error('Lesson complete API error:', error);
    return NextResponse.json(
      { error: 'Failed to complete lesson' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId } = await params;
    const supabase = await createClient();

    // Mark lesson as incomplete
    const { error } = await supabase
      .from('lesson_progress')
      .update({
        completed: false,
        completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to mark lesson incomplete' },
        { status: 500 }
      );
    }

    // Recalculate enrollment progress (same logic as POST handler)
    const { data: lessonRow } = await supabase
      .from('lessons')
      .select('course_id')
      .eq('id', lessonId)
      .single();

    if (lessonRow?.course_id) {
      const courseId = lessonRow.course_id;

      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);

      const totalLessons = allLessons?.length || 0;

      const { data: completedLessons } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .in('lesson_id', (allLessons || []).map((l: any) => l.id));

      const completedCount = completedLessons?.length || 0;
      const progressPercent = totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0;

      // Update enrollment progress
      const { error: rpcError } = await supabase.rpc('update_enrollment_progress_manual', {
        p_user_id: user.id,
        p_course_id: courseId,
        p_progress: progressPercent,
      });

      if (rpcError) {
        // Fallback: direct update
        await supabase
          .from('enrollments')
          .update({ progress: progressPercent, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('course_id', courseId);
      }
    }

    return NextResponse.json({
      success: true,
      lessonId,
      completed: false,
    });
  } catch (error) {
    logger.error('Lesson uncomplete API error:', error);
    return NextResponse.json(
      { error: 'Failed to uncomplete lesson' },
      { status: 500 }
    );
  }
}
