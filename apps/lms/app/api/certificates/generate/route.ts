import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const session = await createClient();
    const {
      data: { user },
      error: authError,
    } = await session.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const enrollmentId = body?.enrollmentId ? String(body.enrollmentId) : null;
    const requestedCourseId = body?.courseId ? String(body.courseId) : null;
    const programSlug = body?.programSlug ? String(body.programSlug) : null;
    if (!enrollmentId && !requestedCourseId && !programSlug) {
      return NextResponse.json(
        { error: 'Missing enrollmentId, courseId, or programSlug' },
        { status: 400 },
      );
    }

    const db = await requireAdminClient();
    let enrollment: any = null;
    let program: any = null;
    let course: any = null;

    if (programSlug) {
      const { data: programRow, error: programError } = await db
        .from('programs')
        .select('id,title,name,slug,issuance_policy')
        .eq('slug', programSlug)
        .maybeSingle();
      if (programError) throw programError;
      if (!programRow) return NextResponse.json({ error: 'Program not found' }, { status: 404 });
      program = programRow;

      const { data: enrollmentRow, error: enrollmentError } = await db
        .from('program_enrollments')
        .select(
          'id,user_id,student_id,course_id,program_id,status,funding_source,funding_status,amount_paid_cents,stripe_payment_intent_id',
        )
        .eq('program_id', program.id)
        .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
        .maybeSingle();
      if (enrollmentError) throw enrollmentError;
      enrollment = enrollmentRow;
    } else if (enrollmentId) {
      const { data: enrollmentRow, error: enrollmentError } = await db
        .from('program_enrollments')
        .select(
          'id,user_id,student_id,course_id,program_id,status,funding_source,funding_status,amount_paid_cents,stripe_payment_intent_id',
        )
        .eq('id', enrollmentId)
        .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
        .maybeSingle();
      if (enrollmentError) throw enrollmentError;
      enrollment = enrollmentRow;
    } else if (requestedCourseId) {
      enrollment = await resolveCourseEnrollment(user.id, requestedCourseId);
    }

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }
    if (enrollment.status === 'pending_funding_verification') {
      return NextResponse.json(
        { error: 'Certificate issuance is blocked while funding verification is pending.' },
        { status: 403 },
      );
    }

    if (!program && enrollment.program_id) {
      const { data: programRow, error: programError } = await db
        .from('programs')
        .select('id,title,name,slug,issuance_policy')
        .eq('id', enrollment.program_id)
        .maybeSingle();
      if (programError) throw programError;
      program = programRow;
    }

    const courseId = requestedCourseId || enrollment.course_id || null;
    if (courseId) {
      const { data: courseRow, error: courseError } = await db
        .from('courses')
        .select('id,title,slug,duration_hours,program_id')
        .eq('id', courseId)
        .maybeSingle();
      if (courseError) throw courseError;
      course = courseRow;
    }

    const programScoped = Boolean(programSlug || program?.issuance_policy === 'apprenticeship_certificate');

    if (programScoped) {
      if (!program?.id || !enrollment.id) {
        return NextResponse.json({ error: 'Program enrollment context is incomplete' }, { status: 400 });
      }

      const { checkProgramReadiness, completeProgramEnrollment } =
        await import('@/lib/lms/completion-evaluator');
      const readiness = await checkProgramReadiness(enrollment.id, user.id, program.id);
      if (!readiness.ready) {
        return NextResponse.json(
          {
            error: 'Program completion requirements not met',
            blocking_reasons: readiness.missingRequirements,
            evidence: readiness.evidence,
          },
          { status: 400 },
        );
      }

      await completeProgramEnrollment(enrollment.id, user.id, program.id);
      const { data: certificate, error: certificateError } = await db
        .from('certificates')
        .select('*')
        .or(`student_id.eq.${user.id},user_id.eq.${user.id}`)
        .eq('program_id', program.id)
        .is('course_id', null)
        .maybeSingle();
      if (certificateError) throw certificateError;
      if (!certificate) {
        return NextResponse.json({ error: 'Program certificate could not be resolved' }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        certificate,
        message: 'Program completion verified and certificate issued',
      });
    }

    if (!course?.id) {
      return NextResponse.json({ error: 'Course context is required' }, { status: 400 });
    }

    const { checkCourseCompletion } = await import('@/lib/course-completion');
    const completion = await checkCourseCompletion(user.id, course.id);
    if (!completion.isComplete) {
      return NextResponse.json(
        {
          error: 'Course completion requirements not met',
          blocking_reasons: completion.missingRequirements,
        },
        { status: 400 },
      );
    }

    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('full_name,email')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const studentName = profile?.full_name || profile?.email || user.email || 'Student';
    const { issueCertificate } = await import('@/lib/certificates/issue-certificate');
    const issued = await issueCertificate({
      supabase: db,
      enrollmentId: enrollment.id,
      studentId: user.id,
      studentName,
      studentEmail: profile?.email || user.email || undefined,
      courseId: course.id,
      courseTitle: course.title,
      issuedBy: user.id,
      competencyEvidence: {
        seatTimeHours: completion.recordedSeatTimeHours,
        seatTimeSeconds: Math.round(completion.recordedSeatTimeHours * 3600),
        examSessionId: completion.examSession?.id || null,
        examProvider: completion.examSession?.provider || null,
        examResult: completion.examSession?.result || null,
        examScore: completion.examSession?.score || null,
        examProctorId: completion.examSession?.proctor_id || null,
        examDate: completion.examSession?.completed_at || null,
        completionVerifiedAt: new Date().toISOString(),
        completionMethod: 'course_requirements_verified',
      },
      credentialStack: { issuance_policy: 'course_certificate' },
      issuanceSnapshot: {
        snapshot_version: 2,
        build_sha: process.env.COMMIT_REF?.slice(0, 12) || process.env.GITHUB_SHA?.slice(0, 12) || 'dev',
        issued_at: new Date().toISOString(),
        funding_source: enrollment.funding_source || null,
        funding_status_at_issuance: enrollment.funding_status || null,
        amount_paid_cents: enrollment.amount_paid_cents || null,
        payment_reference: enrollment.stripe_payment_intent_id || null,
        enrollment_id: enrollment.id,
        enrollment_status_at_issuance: enrollment.status || null,
        issuance_policy: 'course_certificate',
        course_completion: {
          lessons_completed: completion.completedInternalLessons,
          required_lessons: completion.totalInternalLessons,
          assessments_passed: completion.passedQuizzes,
          required_assessments: completion.totalQuizzes,
          seat_time_hours: completion.recordedSeatTimeHours,
          required_seat_time_hours: completion.requiredSeatTimeHours,
          exam_session_id: completion.examSession?.id || null,
        },
        issued_by: user.id,
      },
    });

    if (!issued.success || !issued.certificate) {
      return NextResponse.json({ error: issued.error || 'Certificate issuance failed' }, { status: 500 });
    }

    if (program?.id) {
      const { checkProgramCompletion, completeProgramEnrollment } =
        await import('@/lib/lms/completion-evaluator');
      const completedPrograms = await checkProgramCompletion(user.id, course.id);
      for (const completedProgram of completedPrograms) {
        await completeProgramEnrollment(
          completedProgram.program_enrollment_id,
          completedProgram.user_id,
          completedProgram.program_id,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      certificate: issued.certificate,
      message: issued.alreadyIssued ? 'Certificate already exists' : 'Certificate generated successfully',
    });
  } catch (error) {
    logger.error(
      'Error in /api/certificates/generate',
      normalizeError(error, 'Certificate generation failed'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/certificates/generate', _POST);
