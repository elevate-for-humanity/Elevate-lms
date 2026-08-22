import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { courseId } = await params;
    const db = await requireAdminClient();
    const { data: course, error: courseError } = await db
      .from('courses')
      .select('id,title,slug')
      .eq('id', courseId)
      .maybeSingle();
    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const enrollment = await resolveCourseEnrollment(user.id, courseId);
    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }
    if (['pending_approval', 'pending_funding_verification'].includes(enrollment.status)) {
      return NextResponse.json({ error: 'Enrollment is not yet authorized for completion' }, { status: 403 });
    }

    const { checkCourseCompletion } = await import('@/lib/course-completion');
    const completion = await checkCourseCompletion(user.id, courseId);
    if (!completion.isComplete) {
      return NextResponse.json(
        { error: 'Course requirements not met', missingRequirements: completion.missingRequirements },
        { status: 403 },
      );
    }

    const completedAt = new Date().toISOString();
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('full_name,first_name,last_name,email')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const studentName =
      profile?.full_name ||
      `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
      user.email ||
      'Student';

    const { issueCertificate } = await import('@/lib/certificates/issue-certificate');
    const certResult = await issueCertificate({
      supabase: db,
      studentId: user.id,
      courseId,
      enrollmentId: enrollment.id,
      studentName,
      studentEmail: profile?.email || user.email || undefined,
      courseTitle: course.title,
      competencyEvidence: {
        seatTimeHours: completion.recordedSeatTimeHours,
        seatTimeSeconds: Math.round(completion.recordedSeatTimeHours * 3600),
        examSessionId: completion.examSession?.id || null,
        examProvider: completion.examSession?.provider || null,
        examResult: completion.examSession?.result || null,
        examScore: completion.examSession?.score || null,
        examProctorId: completion.examSession?.proctor_id || null,
        examDate: completion.examSession?.completed_at || null,
        completionVerifiedAt: completedAt,
        completionMethod: 'course_requirements_verified',
      },
    });

    if (!certResult.success || !certResult.certificate) {
      return NextResponse.json(
        { error: certResult.error || 'Course certificate issuance failed' },
        { status: 500 },
      );
    }

    // Course completion does not mutate program_enrollments.status. Only the
    // program evaluator may complete a program after every required course gate
    // has passed.
    const { checkProgramCompletion, completeProgramEnrollment } =
      await import('@/lib/lms/completion-evaluator');
    const completedPrograms = await checkProgramCompletion(user.id, courseId);
    for (const program of completedPrograms) {
      await completeProgramEnrollment(
        program.program_enrollment_id,
        program.user_id,
        program.program_id,
      );
    }

    return NextResponse.json({
      success: true,
      courseId,
      courseTitle: course.title,
      completedAt,
      certificate: {
        id: certResult.certificate.id,
        certificateNumber: certResult.certificate.certificate_number,
        issuedAt: certResult.certificate.issued_at,
        verificationUrl: certResult.certificate.verification_url,
        downloadUrl: `/api/certificates/${certResult.certificate.id}/download`,
      },
      programCompletions: completedPrograms.length,
      student: profile
        ? { name: studentName, email: profile.email }
        : { name: studentName, email: user.email || null },
    });
  } catch (error) {
    logger.error(
      'Course complete API error',
      normalizeError(error, 'Course complete error'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Failed to complete course' }, { status: 500 });
  }
}

async function _GET(request: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { courseId } = await params;
    const db = await requireAdminClient();
    const enrollment = await resolveCourseEnrollment(user.id, courseId);

    const [{ data: certificate }, completion] = await Promise.all([
      db
        .from('certificates')
        .select('id,certificate_number,issued_at,verification_url')
        .or(`student_id.eq.${user.id},user_id.eq.${user.id}`)
        .eq('course_id', courseId)
        .maybeSingle(),
      enrollment
        ? import('@/lib/course-completion').then(({ checkCourseCompletion }) =>
            checkCourseCompletion(user.id, courseId),
          )
        : Promise.resolve(null),
    ]);

    const progress = completion
      ? completion.totalInternalLessons
        ? Math.round((completion.completedInternalLessons / completion.totalInternalLessons) * 100)
        : 0
      : 0;

    return NextResponse.json({
      courseId,
      enrolled: Boolean(enrollment),
      enrollmentStatus: enrollment?.status || 'not_enrolled',
      progress,
      lessonsCompleted: completion?.completedInternalLessons || 0,
      totalLessons: completion?.totalInternalLessons || 0,
      canComplete: Boolean(completion?.isComplete),
      missingRequirements: completion?.missingRequirements ?? [],
      certificate: certificate || null,
    });
  } catch (error) {
    logger.error(
      'Course completion status error',
      normalizeError(error, 'Completion status error'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Failed to get completion status' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/courses/[courseId]/complete', _GET);
export const POST = withApiAudit('/api/courses/[courseId]/complete', _POST);
