import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await session
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.role || !['admin', 'super_admin', 'staff', 'partner', 'instructor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { user_id, course_id, expires_at } = await req.json();
  if (!user_id || !course_id) {
    return NextResponse.json({ error: 'Missing user_id or course_id' }, { status: 400 });
  }

  const learnerId = String(user_id);
  const courseId = String(course_id);
  const db = await requireAdminClient();

  const [{ data: course, error: courseError }, enrollment] = await Promise.all([
    db.from('courses').select('id,title,slug,program_id').eq('id', courseId).maybeSingle(),
    resolveCourseEnrollment(learnerId, courseId),
  ]);
  if (courseError) throw courseError;
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  if (!enrollment) {
    return NextResponse.json({ error: 'Learner is not enrolled in this course' }, { status: 400 });
  }

  const { checkCourseCompletion } = await import('@/lib/course-completion');
  const completion = await checkCourseCompletion(learnerId, courseId);
  if (!completion.isComplete) {
    return NextResponse.json(
      {
        error: 'Course completion requirements not met',
        blocking_reasons: completion.missingRequirements,
      },
      { status: 400 },
    );
  }

  const { data: learnerProfile, error: learnerProfileError } = await db
    .from('profiles')
    .select('full_name,email')
    .eq('id', learnerId)
    .maybeSingle();
  if (learnerProfileError) throw learnerProfileError;

  const { issueCertificate } = await import('@/lib/certificates/issue-certificate');
  const issued = await issueCertificate({
    supabase: db,
    enrollmentId: enrollment.id,
    studentId: learnerId,
    studentName: learnerProfile?.full_name || learnerProfile?.email || 'Learner',
    studentEmail: learnerProfile?.email || undefined,
    courseId,
    courseTitle: course.title,
    issuedBy: user.id,
    expiresAt: expires_at || null,
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
      completionMethod: 'staff_requested_after_verified_course_completion',
    },
  });
  if (!issued.success || !issued.certificate) {
    return NextResponse.json({ error: issued.error || 'Certificate issuance failed' }, { status: 500 });
  }

  await db.from('enrollment_events').insert({
    user_id: learnerId,
    course_id: courseId,
    funding_program_id: enrollment.funding_program_id || null,
    kind: 'CERTIFIED',
  });

  if (enrollment.program_id || course.program_id) {
    const { checkProgramCompletion, completeProgramEnrollment } =
      await import('@/lib/lms/completion-evaluator');
    const completedPrograms = await checkProgramCompletion(learnerId, courseId);
    for (const program of completedPrograms) {
      await completeProgramEnrollment(
        program.program_enrollment_id,
        program.user_id,
        program.program_id,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    serial: issued.certificate.certificate_number,
    certificate: issued.certificate,
  });
}

export const POST = withApiAudit('/api/cert/issue', _POST);
