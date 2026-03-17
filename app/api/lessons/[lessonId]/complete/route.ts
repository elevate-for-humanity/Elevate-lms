import { logger } from '@/lib/logger';
import { checkEligibilityAndAuthorize } from '@/lib/services/exam-eligibility';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import {
  recordStepCompletion,
  recordStepUncompletion,
} from '@/lib/lms/engine';

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

    // Get lesson to find course_id.
    // lms_lessons is a view: curriculum_lessons (priority) UNION training_lessons (fallback).
    const { data: lesson, error: lessonError } = await db
      .from('lms_lessons')
      .select('id, course_id, title')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Check if user is enrolled and approved
    const { data: enrollment } = await db
      .from('training_enrollments')
      .select('id, status, approved_at, program_id')
      .eq('user_id', user.id)
      .eq('course_id', lesson.course_id)
      .single();

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    if (enrollment.status === 'pending_approval' || !enrollment.approved_at) {
      return NextResponse.json(
        { error: 'Enrollment pending approval' },
        { status: 403 }
      );
    }

    // Fetch lesson details for type-specific enforcement
    const { data: lessonDetail } = await db
      .from('lms_lessons')
      .select('content_type, duration_minutes')
      .eq('id', lessonId)
      .single();

    const contentType = lessonDetail?.content_type || 'video';

    // Quiz lessons require a passing attempt before they can be marked complete.
    // HVAC quizzes use a local question bank (not the quizzes table), so
    // quiz_attempts rows are never written for them. The client enforces the
    // 80% pass threshold before calling this endpoint, so we skip the DB gate
    // when no passing attempt exists but the lesson belongs to the HVAC course.
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
        // Allow completion if this is an HVAC course lesson (local quiz bank,
        // no quiz_attempts rows). Client already enforced pass score.
        const HVAC_COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';
        if (lesson.course_id !== HVAC_COURSE_ID) {
          return NextResponse.json(
            { error: 'Quiz must be passed before marking complete' },
            { status: 403 }
          );
        }
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
          enrollment_id: enrollment.id,
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

    // Delegate progress recalculation, enrollment % update, and certificate
    // issuance to the engine. This is the single path for all three concerns.
    const completionResult = await recordStepCompletion(
      user.id,
      lessonId,
      lesson.course_id,
      enrollment.id,
      timeSpentSeconds
    );

    const { progressPercent, courseCompleted, certificateNumber } = completionResult;

    // When a course completes, check if it satisfies all required courses
    // for any program the learner is enrolled in.
    if (courseCompleted) {
      try {
        const { checkProgramCompletion, completeProgramEnrollment } =
          await import('@/lib/lms/completion-evaluator');
        const completedPrograms = await checkProgramCompletion(user.id, lesson.course_id);
        for (const prog of completedPrograms) {
          await completeProgramEnrollment(
            prog.program_enrollment_id,
            prog.user_id,
            prog.program_id
          );
          logger.info('[program-completion] Program completed via course', {
            userId:              user.id,
            courseId:            lesson.course_id,
            programId:           prog.program_id,
            programEnrollmentId: prog.program_enrollment_id,
          });
        }
      } catch (progErr) {
        logger.error('[program-completion] Check failed (non-fatal):', progErr);
      }
    }

    // HVAC workflow: advance credential sequence when all lessons complete
    if (courseCompleted && lesson.course_id === 'f0593164-55be-5867-98e7-8a86770a8dd0') {
      try {
        const { advanceHvacWorkflow } = await import('@/lib/courses/hvac-completion-workflow');
        const wfResult = await advanceHvacWorkflow(user.id);
        logger.info('[hvac-workflow] Auto-advanced on course completion', { userId: user.id, ...wfResult });
      } catch (wfErr) {
        logger.error('[hvac-workflow] Auto-advance failed (non-fatal):', wfErr);
      }
    }

    // Credential eligibility check: fires on every lesson completion.
    // Only creates an exam_funding_authorization when the learner has met all
    // domain coverage and completion rules. Non-fatal — lesson completion is
    // already recorded above and must not be rolled back on eligibility errors.
    let eligibilityResult: Awaited<ReturnType<typeof checkEligibilityAndAuthorize>> | null = null;
    if (enrollment.program_id) {
      // Resolve the primary credential for this program, then check eligibility.
      // We do this here rather than inside the service to avoid an extra DB round-trip
      // when the enrollment has no program_id (legacy enrollments without program linkage).
      try {
        const { data: primaryCredential } = await db
          .from('program_credentials')
          .select('credential_id')
          .eq('program_id', enrollment.program_id)
          .eq('is_primary', true)
          .maybeSingle();

        if (primaryCredential?.credential_id) {
          eligibilityResult = await checkEligibilityAndAuthorize(
            user.id,
            primaryCredential.credential_id,
            enrollment.program_id,
          );

          if (eligibilityResult.authorizationCreated) {
            logger.info('[credential-pipeline] Exam funding authorization created on lesson completion', {
              userId: user.id,
              lessonId,
              programId: enrollment.program_id,
              credentialId: primaryCredential.credential_id,
            });
          }
        }
      } catch (eligErr) {
        logger.error('[credential-pipeline] Eligibility check failed (non-fatal):', eligErr);
      }
    }

    return NextResponse.json({
      success: true,
      lessonId,
      lessonTitle: lesson.title,
      completed: true,
      completedAt: progress.completed_at,
      courseProgress: {
        progressPercent,
        courseCompleted,
        certificateNumber: certificateNumber ?? null,
      },
      credentialEligibility: eligibilityResult
        ? {
            isEligible:           eligibilityResult.isEligible,
            blockingReason:       eligibilityResult.blockingReason,
            authorizationCreated: eligibilityResult.authorizationCreated,
          }
        : null,
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
    const db = createAdminClient() || await createClient();

    // Resolve course_id for progress recalculation
    const { data: lessonRow } = await db
      .from('lms_lessons')
      .select('course_id')
      .eq('id', lessonId)
      .single();

    if (!lessonRow?.course_id) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Delegate uncomplete + progress recalc to engine
    try {
      await recordStepUncompletion(user.id, lessonId, lessonRow.course_id);
    } catch (err) {
      logger.error('recordStepUncompletion failed:', err);
      return NextResponse.json({ error: 'Failed to mark lesson incomplete' }, { status: 500 });
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
