import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(
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
    // Clamp seat time: minimum 1s, maximum 4 hours per lesson
    const MAX_LESSON_SECONDS = 4 * 60 * 60;
    const timeSpentSeconds = Math.min(
      Math.max(1, Number(body.timeSpentSeconds) || 1),
      MAX_LESSON_SECONDS
    );

    const userClient = await createClient();
    const admin = createAdminClient();
    const supabase = admin || userClient; // admin bypasses RLS recursion
    const db = supabase;

    // Get lesson to find course_id
    const { data: lesson, error: lessonError } = await db
      .from('training_lessons')
      .select('id, course_id, title')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Check if user is enrolled in the course
    const { data: enrollment } = await db
      .from('training_enrollments')
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

    // Fetch lesson details for type-specific enforcement
    const { data: lessonDetail } = await db
      .from('training_lessons')
      .select('content_type, duration_minutes')
      .eq('id', lessonId)
      .single();

    const contentType = lessonDetail?.content_type || 'video';

    // Quiz lessons require a passing attempt before they can be marked complete
    if (contentType === 'quiz') {
      const { data: passingAttempt } = await db
        .from('quiz_attempts')
        .select('id')
        .eq('user_uuid', user.id)
        .eq('quiz_id', lessonId)
        .eq('passed', true)
        .limit(1)
        .maybeSingle();

      if (!passingAttempt) {
        return NextResponse.json(
          { error: 'Quiz must be passed before marking complete' },
          { status: 403 }
        );
      }
    }

    // Per-lesson-type minimum seat time (seconds)
    // Prevents instant click-through completion
    const MINIMUM_SEAT_TIME: Record<string, number> = {
      reading: 90,    // 1.5 min minimum for reading lessons
      video: 120,     // 2 min minimum for video lessons (real enforcement is 90% watched client-side)
      quiz: 30,       // 30s minimum for quiz lessons (real enforcement is pass score)
      lab: 60,        // 1 min minimum for lab/assignment lessons
      assignment: 60,
    };

    const minTime = MINIMUM_SEAT_TIME[contentType] || 30;
    if (timeSpentSeconds < minTime) {
      return NextResponse.json(
        {
          error: 'Minimum time requirement not met',
          required: minTime,
          actual: timeSpentSeconds,
          message: `This lesson requires at least ${Math.ceil(minTime / 60)} minute(s) of engagement before it can be marked complete.`,
        },
        { status: 403 }
      );
    }

    // Mark lesson as complete
    const { data: progress, error: progressError } = await db
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

    logger.info('Lesson completed', {
      userId: user.id,
      lessonId,
      courseId: lesson.course_id,
      lessonTitle: lesson.title,
    });

    // Get updated course progress
    const { data: allLessons } = await db
      .from('training_lessons')
      .select('id')
      .eq('course_id', lesson.course_id);

    const { data: completedLessons } = await db
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
      await db
        .from('training_enrollments')
        .update({ progress: progressPercent, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('course_id', lesson.course_id);
    }

    // Check if course is now complete
    const courseCompleted = progressPercent === 100;

    // NOTE: Certificate issuance is handled by /api/lms/progress/complete
    // which enforces quiz pass verification and competency evidence.
    // This endpoint only tracks lesson-level progress.

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
    });
  } catch (error) {
    logger.error('Lesson complete API error:', error);
    return NextResponse.json(
      { error: 'Failed to complete lesson' },
      { status: 500 }
    );
  }
}

async function _DELETE(
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
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Mark lesson as incomplete
    const { error } = await db
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
    const { data: lessonRow } = await db
      .from('training_lessons')
      .select('course_id')
      .eq('id', lessonId)
      .single();

    if (lessonRow?.course_id) {
      const courseId = lessonRow.course_id;

      const { data: allLessons } = await db
        .from('training_lessons')
        .select('id')
        .eq('course_id', courseId);

      const totalLessons = allLessons?.length || 0;

      const { data: completedLessons } = await db
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
        await db
          .from('training_enrollments')
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
export const POST = withApiAudit('/api/lessons/[lessonId]/complete', _POST);
export const DELETE = withApiAudit('/api/lessons/[lessonId]/complete', _DELETE);
