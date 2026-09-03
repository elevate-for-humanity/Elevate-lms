import { logger } from '@/lib/logger';
import { checkEligibilityAndAuthorize } from '@/lib/services/exam-eligibility';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import {
  recordStepCompletion,
  recordStepUncompletion,
  enforceCheckpointGate,
} from '@/lib/lms/engine';
import type { CheckpointGateError } from '@/lib/lms/engine';
import { assertLessonAccess, accessErrorResponse } from '@/lib/lms/access-control';
import { checkCompetencyGate } from '@/lib/lms/competency-gate';
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ACTIVE_ENROLLMENT_STATUSES = new Set([
  'active',
  'enrolled',
  'in_progress',
  'completed',
  'confirmed',
]);

const MINIMUM_SEAT_TIME: Record<string, number> = {
  lesson: 90,
  reading: 90,
  video: 120,
  quiz: 30,
  checkpoint: 30,
  exam: 30,
  lab: 60,
  assignment: 60,
};

async function _POST(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { lessonId } = await params;
    try {
      await assertLessonAccess(user.id, lessonId);
    } catch (error) {
      const { status, body } = accessErrorResponse(error);
      return NextResponse.json(body, { status });
    }

    const requestBody = await request.json().catch(() => ({}));
    const timeSpentSeconds = Math.min(
      Math.max(1, Number(requestBody.timeSpentSeconds) || 1),
      4 * 60 * 60,
    );

    const db = await requireAdminClient();
    const { data: lesson, error: lessonError } = await db
      .from('course_lessons')
      .select('id,course_id,module_id,title,lesson_type,duration_minutes')
      .eq('id', lessonId)
      .maybeSingle();
    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const enrollment = await resolveCourseEnrollment(user.id, lesson.course_id);
    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }

    const enrollmentStatus = String(enrollment.status || '').toLowerCase();
    if (enrollmentStatus === 'pending_funding_verification') {
      return NextResponse.json(
        {
          error:
            'Enrollment pending funding verification. Complete payment or funding approval to continue.',
        },
        { status: 403 },
      );
    }
    if (enrollmentStatus === 'pending_approval') {
      return NextResponse.json({ error: 'Enrollment pending approval' }, { status: 403 });
    }
    if (!ACTIVE_ENROLLMENT_STATUSES.has(enrollmentStatus)) {
      return NextResponse.json({ error: 'Enrollment is not active' }, { status: 403 });
    }

    try {
      await enforceCheckpointGate(user.id, lessonId, lesson.course_id);
    } catch (gateError) {
      const gate = gateError as CheckpointGateError;
      if (gate.code === 'CHECKPOINT_NOT_PASSED') {
        return NextResponse.json(
          {
            error: gate.message,
            code: gate.code,
            checkpointLessonId: gate.checkpointLessonId,
            requiredScore: gate.requiredScore,
          },
          { status: 403 },
        );
      }
      throw gateError;
    }

    const { canCompleteLesson } = await import('@/lib/ojt/canCompleteLesson');
    if (!(await canCompleteLesson(user.id, lessonId))) {
      return NextResponse.json(
        { error: 'Complete required shop work before finishing this lesson', code: 'OJT_INCOMPLETE' },
        { status: 403 },
      );
    }

    const competencyGate = await checkCompetencyGate(db, { userId: user.id, lessonId });
    if (!competencyGate.allowed) {
      return NextResponse.json(
        {
          error: 'Instructor sign-off required before this lesson can be marked complete.',
          code: 'COMPETENCY_SIGNOFF_REQUIRED',
          pendingChecks: competencyGate.missingKeys,
        },
        { status: 403 },
      );
    }

    const contentType = lesson.lesson_type || 'lesson';
    if (['quiz', 'checkpoint', 'exam'].includes(contentType)) {
      const { data: passingScore, error: scoreError } = await db
        .from('checkpoint_scores')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', lesson.course_id)
        .eq('lesson_id', lessonId)
        .eq('passed', true)
        .limit(1)
        .maybeSingle();
      if (scoreError) throw scoreError;
      if (!passingScore) {
        return NextResponse.json(
          { error: 'Required assessment must be passed before marking this lesson complete' },
          { status: 403 },
        );
      }
    }

    const minimumSeconds = MINIMUM_SEAT_TIME[contentType] ?? 30;
    if (timeSpentSeconds < minimumSeconds) {
      return NextResponse.json(
        {
          error: 'Minimum time requirement not met',
          required: minimumSeconds,
          actual: timeSpentSeconds,
        },
        { status: 403 },
      );
    }

    logger.info('Lesson completing', {
      userId: user.id,
      lessonId,
      courseId: lesson.course_id,
      lessonTitle: lesson.title,
    });

    const completionResult = await recordStepCompletion(
      user.id,
      lessonId,
      lesson.course_id,
      enrollment.id,
      timeSpentSeconds,
    );
    const completedAt = new Date().toISOString();

    try {
      const { data: linkedCompetencies } = await db
        .from('lesson_competencies')
        .select('competency_id')
        .eq('lesson_id', lessonId);
      for (const { competency_id } of linkedCompetencies ?? []) {
        const [{ data: competency }, { data: existing }] = await Promise.all([
          db.from('competencies').select('minimum_touchpoints').eq('id', competency_id).maybeSingle(),
          db
            .from('student_competency_progress')
            .select('id,touchpoints,is_mastered')
            .eq('user_id', user.id)
            .eq('competency_id', competency_id)
            .maybeSingle(),
        ]);
        const newTouchpoints = (existing?.touchpoints ?? 0) + 1;
        const isMastered = newTouchpoints >= (competency?.minimum_touchpoints ?? 1);
        await db.from('student_competency_progress').upsert(
          {
            user_id: user.id,
            competency_id,
            program_id: enrollment.program_id,
            touchpoints: newTouchpoints,
            is_mastered: isMastered,
            mastered_at: isMastered && !existing?.is_mastered ? completedAt : undefined,
            updated_at: completedAt,
          },
          { onConflict: 'user_id,competency_id' },
        );
      }
    } catch (competencyError) {
      logger.warn('Competency progress update failed (non-fatal):', competencyError);
    }

    const { progressPercent, courseCompleted, certificateNumber } = completionResult;
    if (courseCompleted) {
      try {
        const { checkProgramCompletion, completeProgramEnrollment } =
          await import('@/lib/lms/completion-evaluator');
        const completedPrograms = await checkProgramCompletion(user.id, lesson.course_id);
        for (const program of completedPrograms) {
          await completeProgramEnrollment(
            program.program_enrollment_id,
            program.user_id,
            program.program_id,
          );
        }
      } catch (programError) {
        logger.error(
          '[program-completion] Check failed (non-fatal):',
          programError instanceof Error ? programError : new Error(String(programError)),
        );
      }
    }

    let eligibilityResult: Awaited<ReturnType<typeof checkEligibilityAndAuthorize>> | null = null;
    if (enrollment.program_id) {
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
        }
      } catch (eligibilityError) {
        logger.error(
          '[credential-pipeline] Eligibility check failed (non-fatal):',
          eligibilityError instanceof Error ? eligibilityError : new Error(String(eligibilityError)),
        );
      }
    }

    try {
      const xapiEndpoint = process.env.XAPI_LRS_ENDPOINT;
      if (xapiEndpoint) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
        void fetch(`${siteUrl}/api/xapi/statement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actor: { objectType: 'Agent', account: { homePage: siteUrl, name: user.id } },
            verb: {
              id: 'http://adlnet.gov/expapi/verbs/completed',
              display: { 'en-US': 'completed' },
            },
            object: {
              objectType: 'Activity',
              id: `${siteUrl}/lms/courses/${lesson.course_id}/lessons/${lessonId}`,
              definition: {
                name: { 'en-US': lesson.title },
                type: 'http://adlnet.gov/expapi/activities/lesson',
              },
            },
            result: { completion: true, success: true },
            timestamp: completedAt,
          }),
        }).catch(() => undefined);
      }
    } catch {
      // xAPI remains optional.
    }

    return NextResponse.json({
      success: true,
      lessonId,
      lessonTitle: lesson.title,
      completed: true,
      completedAt,
      courseProgress: {
        progressPercent,
        courseCompleted,
        certificateNumber: certificateNumber ?? null,
      },
      credentialEligibility: eligibilityResult
        ? {
            isEligible: eligibilityResult.isEligible,
            blockingReason: eligibilityResult.blockingReason,
            authorizationCreated: eligibilityResult.authorizationCreated,
          }
        : null,
    });
  } catch (error) {
    logger.error(
      'Lesson complete API error:',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: 'Failed to complete lesson' }, { status: 500 });
  }
}

async function _DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { lessonId } = await params;
    const db = await requireAdminClient();
    const { data: lesson } = await db
      .from('course_lessons')
      .select('course_id')
      .eq('id', lessonId)
      .maybeSingle();
    if (!lesson?.course_id) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

    try {
      await assertLessonAccess(user.id, lessonId);
      const enrollment = await resolveCourseEnrollment(user.id, lesson.course_id);
      if (!enrollment) {
        return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
      }
      await recordStepUncompletion(user.id, lessonId, lesson.course_id);
    } catch (error) {
      logger.error(
        'recordStepUncompletion failed:',
        error instanceof Error ? error : new Error(String(error)),
      );
      return NextResponse.json({ error: 'Failed to mark lesson incomplete' }, { status: 500 });
    }

    return NextResponse.json({ success: true, lessonId, completed: false });
  } catch (error) {
    logger.error(
      'Lesson uncomplete API error:',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: 'Failed to uncomplete lesson' }, { status: 500 });
  }
}

export const POST = withApiAudit(
  '/api/lessons/[lessonId]/complete',
  _POST as unknown as (req: Request, ...args: any[]) => Promise<Response>,
);
export const DELETE = withApiAudit(
  '/api/lessons/[lessonId]/complete',
  _DELETE as unknown as (req: Request, ...args: any[]) => Promise<Response>,
);
