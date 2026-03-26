import { NextRequest, NextResponse } from 'next/server';

import { requireApiRole } from '@/lib/auth/require-api-role';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { checkCourseCompletion } from '@/lib/course-completion';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getCourseRequirements } from '@/lib/courses/completion-requirements';
import { startCredentialAttempt } from '@/lib/services/credential-pipeline';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

/**
 * Mark course as completed
 * POST /api/lms/progress/complete
 *
 * Completion requires:
 * 1. All internal lessons completed
 * 2. All required external modules completed
 * 3. All quiz-type lessons passed (score >= 70%)
 *
 * Certificate issuance includes quiz scores, exam session linkage,
 * and seat time in the credential metadata.
 */
async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireApiRole(['student', 'admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;

    const { user, db } = auth;

    // Handle both JSON and FormData
    let courseId: string;
    let evidenceUrl: string | null = null;

    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await req.json();
      courseId = body.courseId;
      evidenceUrl = body.evidenceUrl || null;
    } else {
      const formData = await req.formData();
      courseId = String(formData.get('courseId') || '');
      evidenceUrl = String(formData.get('evidenceUrl') || '') || null;
    }

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    // ── ENROLLMENT OWNERSHIP ─────────────────────────────────────────
    // Verify the user is enrolled in this course before allowing completion.
    // Explicit access gate: status OR enrollment_state must grant access.
    // pending_funding_verification retains provisional LMS access by policy.
    // See enrollment_grants_lms_access() in DB and docs/enrollment-funding-states.md.
    const { data: enrollment } = await db
      .from('program_enrollments')
      .select('id, status, enrollment_state')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    const accessStates = ['active', 'in_progress', 'enrolled', 'confirmed', 'pending_funding_verification'];
    if (!enrollment || (!accessStates.includes(enrollment.status) && !accessStates.includes(enrollment.enrollment_state))) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 },
      );
    }

    // ── COMPLETION GATE ──────────────────────────────────────────────
    // Verify all course requirements are met before allowing completion.
    // This prevents certificates from being issued without demonstrated
    // competency (lessons, quizzes, external modules).

    const completionStatus = await checkCourseCompletion(user.id, courseId);

    if (!completionStatus.isComplete) {
      return NextResponse.json({
        error: 'Course requirements not met',
        missingRequirements: completionStatus.missingRequirements,
        progress: {
          internalLessons: `${completionStatus.completedInternalLessons}/${completionStatus.totalInternalLessons}`,
          externalModules: `${completionStatus.completedExternalModules}/${completionStatus.totalExternalModules}`,
        },
      }, { status: 403 });
    }

    // ── QUIZ PASS VERIFICATION ───────────────────────────────────────
    // All quiz-type lessons must have a passing attempt (score >= 70%).
    // This is checked separately from lesson completion because a student
    // can "complete" a quiz lesson without passing it.

    const quizCheck = await verifyQuizzesPassed(db, user.id, courseId);
    if (!quizCheck.allPassed) {
      return NextResponse.json({
        error: 'Not all required quizzes have been passed',
        failedQuizzes: quizCheck.failedQuizzes,
        message: 'A passing score of 70% or higher is required on all quizzes before course completion.',
      }, { status: 403 });
    }

    // ── GATHER COMPETENCY EVIDENCE ───────────────────────────────────
    // Collect quiz scores, seat time, and exam session data for the
    // certificate metadata. This creates an auditable credential record.

    const seatTime = await getSeatTimeHours(db, user.id, courseId);
    const examSession = await getLatestExamSession(db, user.id, courseId);

    // Get course details
    const { data: course } = await db
      .from('courses')
      .select('slug, title, metadata')
      .eq('id', courseId)
      .single();

    // ── PROCTORED EXAM GATE ──────────────────────────────────────────
    // Courses with industry certification exams (e.g., EPA 608) require
    // a logged and passing proctored exam session before certificate
    // issuance. This enforces the credentialing chain of custody:
    //   Training → Quizzes → Proctored Exam → Certificate
    const requirements = getCourseRequirements(course?.slug || '');

    if (requirements.examRequirement) {
      const { provider, examName, requiredResult } = requirements.examRequirement;

      if (!examSession || examSession.result !== requiredResult) {
        return NextResponse.json({
          error: 'Proctored exam requirement not met',
          examRequirement: {
            examName,
            provider,
            requiredResult,
            currentStatus: examSession
              ? `Exam logged but result is "${examSession.result}" (requires "${requiredResult}")`
              : 'No proctored exam session found for this student',
          },
          message: `This course requires a passing ${examName} proctored exam before a certificate can be issued. Contact your proctor to schedule the exam.`,
        }, { status: 403 });
      }
    }

    // ── SEAT TIME GATE ───────────────────────────────────────────────
    // Enforce minimum LMS theory hours. This covers the online portion;
    // in-person lab/shop hours are tracked separately via hour_entries.
    if (requirements.minimumSeatTimeHours && seatTime.totalHours < requirements.minimumSeatTimeHours) {
      return NextResponse.json({
        error: 'Minimum seat time requirement not met',
        seatTimeRequirement: {
          required: requirements.minimumSeatTimeHours,
          recorded: seatTime.totalHours,
          deficit: Math.round((requirements.minimumSeatTimeHours - seatTime.totalHours) * 10) / 10,
        },
        message: `This course requires at least ${requirements.minimumSeatTimeHours} hours of instructional time. You have ${seatTime.totalHours} hours recorded. Continue engaging with lesson content to meet this requirement.`,
      }, { status: 403 });
    }

    // Update progress to completed
    const { error } = await db.from('lms_progress').upsert(
      {
        user_id: user.id,
        course_id: courseId,
        course_slug: course?.slug,
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress_percent: 100,
        evidence_url: evidenceUrl,
        last_activity_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,course_id',
      }
    );

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Get user profile for certificate
    const { data: profile } = await db
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Award points for course completion (100 points per course)
    try {
      const { data: currentProfile } = await db
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();

      await db
        .from('profiles')
        .update({ points: (currentProfile?.points || 0) + 100 })
        .eq('id', user.id);
    } catch (pointsErr) {
      logger.error("Points award failed", pointsErr instanceof Error ? pointsErr : undefined);
    }

    // Generate certificate with competency evidence
    try {
      const { issueCertificate } = await import('@/lib/certificates/issue-certificate');
      await issueCertificate({
        supabase: db,
        studentId: user.id,
        courseId,
        studentName: profile?.full_name || 'Student',
        studentEmail: profile?.email || user.email || undefined,
        courseTitle: course?.title || 'Course Completion',
        programHours: seatTime.totalHours || null,
        competencyEvidence: {
          quizScores: quizCheck.scores,
          seatTimeHours: seatTime.totalHours,
          seatTimeSeconds: seatTime.totalSeconds,
          examSessionId: examSession?.id || null,
          examProvider: examSession?.provider || null,
          examResult: examSession?.result || null,
          examScore: examSession?.score || null,
          examProctorId: examSession?.proctor_id || null,
          examDate: examSession?.completed_at || null,
          completionVerifiedAt: new Date().toISOString(),
          completionMethod: 'competency_verified',
        },
      });
    } catch (certError) {
      logger.error("Certificate generation failed", certError instanceof Error ? certError : undefined);
    }

    // ── CREDENTIAL PIPELINE TRIGGER ─────────────────────────────────
    // After course completion, check if this course is linked to a credential
    // that requires an exam. If so, start the credential attempt and resolve
    // the funding decision. The learner is then routed to /lms/certification
    // where they see their next required action (pay / wait for approval / schedule).
    let credentialAttemptId: string | null = null;
    let fundingDecision = null;

    try {
      const { data: courseCredential } = await db
        .from('courses')
        .select('credential_id, program_id')
        .eq('id', courseId)
        .maybeSingle();

      if (courseCredential?.credential_id) {
        const result = await startCredentialAttempt(
          user.id,
          courseCredential.credential_id,
          courseCredential.program_id ?? null
        );
        if ('attemptId' in result) {
          credentialAttemptId = result.attemptId;
          fundingDecision = result.funding;
        }
      }
    } catch (pipelineErr) {
      // Pipeline failure must not block completion — log and continue
      logger.error('Credential pipeline trigger failed', pipelineErr instanceof Error ? pipelineErr : undefined);
    }

    // Redirect if form submission, JSON response if API call
    if (
      contentType?.includes('application/x-www-form-urlencoded') ||
      contentType?.includes('multipart/form-data')
    ) {
      return NextResponse.redirect(
        new URL(`/lms/courses/${courseId}`, req.url)
      );
    }

    return NextResponse.json({
      success: true,
      ...(credentialAttemptId && {
        credentialAttemptId,
        fundingDecision,
        nextStep: fundingDecision?.requiresCheckout
          ? `/lms/payments/checkout?attemptId=${credentialAttemptId}`
          : `/lms/certification`,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── HELPER: Verify all quiz-type lessons have a passing attempt ────────
async function verifyQuizzesPassed(
  db: any,
  userId: string,
  courseId: string
): Promise<{ allPassed: boolean; failedQuizzes: string[]; scores: Record<string, number> }> {
  // Get all quiz-type lessons for this course
  const { data: quizLessons } = await db
    .from('course_lessons')
    .select('id, title')
    .eq('course_id', courseId)
    .eq('lesson_type', 'quiz');

  if (!quizLessons || quizLessons.length === 0) {
    return { allPassed: true, failedQuizzes: [], scores: {} };
  }

  const failedQuizzes: string[] = [];
  const scores: Record<string, number> = {};

  for (const quiz of quizLessons) {
    // Check for a passing attempt (score >= 70)
    const { data: bestAttempt } = await db
      .from('quiz_attempts')
      .select('score, passed')
      .eq('user_id', userId)
      .eq('quiz_id', quiz.id)
      .eq('passed', true)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bestAttempt) {
      scores[quiz.title] = Number(bestAttempt.score);
    } else {
      failedQuizzes.push(quiz.title);
    }
  }

  return {
    allPassed: failedQuizzes.length === 0,
    failedQuizzes,
    scores,
  };
}

// ── HELPER: Get accumulated seat time for the course ──────────────────
async function getSeatTimeHours(
  db: any,
  userId: string,
  courseId: string
): Promise<{ totalSeconds: number; totalHours: number }> {
  const { data } = await db
    .from('lesson_progress')
    .select('time_spent_seconds')
    .eq('user_id', userId)
    .eq('course_id', courseId);

  const totalSeconds = (data || []).reduce(
    (sum: number, row: any) => sum + (row.time_spent_seconds || 0),
    0
  );

  return {
    totalSeconds,
    totalHours: Math.round((totalSeconds / 3600) * 10) / 10,
  };
}

// ── HELPER: Get latest exam session for this student + course ─────────
async function getLatestExamSession(
  db: any,
  userId: string,
  courseId: string
): Promise<any | null> {
  // Look up the course slug to match against exam_sessions.program_slug
  const { data: course } = await db
    .from('courses')
    .select('slug')
    .eq('id', courseId)
    .single();

  if (!course?.slug) return null;

  const { data: session } = await db
    .from('exam_sessions')
    .select('id, provider, result, score, proctor_id, proctor_name, completed_at')
    .eq('student_id', userId)
    .eq('program_slug', course.slug)
    .eq('result', 'pass')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return session;
}

export const POST = withApiAudit('/api/lms/progress/complete', _POST as unknown as (req: Request, ...args: any[]) => Promise<Response>);
