import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function parseCSV(raw: string) {
  const lines = raw.trim().split(/\r?\n/);
  const head = lines.shift();
  if (!head) return [];
  const cols = head.split(',').map((value) => value.trim().toLowerCase());
  return lines.filter(Boolean).map((line) => {
    const vals = line.split(',').map((value) => value.trim());
    return Object.fromEntries(cols.map((column, index) => [column, vals[index] ?? '']));
  });
}

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
  if (!profile?.role || !['admin', 'super_admin', 'staff', 'partner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = await requireAdminClient();
  const rows = parseCSV(await req.text());
  const errors: Array<{ row: Record<string, string>; err: string }> = [];
  let issued = 0;

  for (const row of rows) {
    try {
      const email = row.email?.trim();
      if (!email) {
        errors.push({ row, err: 'Missing email' });
        continue;
      }

      const { data: learner, error: learnerError } = await db
        .from('profiles')
        .select('id,email,full_name')
        .ilike('email', email)
        .maybeSingle();
      if (learnerError) throw learnerError;
      if (!learner?.id) {
        errors.push({ row, err: 'User not found' });
        continue;
      }

      let courseQuery = db.from('courses').select('id,title,slug,program_id');
      if (row.course_id) courseQuery = courseQuery.eq('id', row.course_id);
      else if (row.course_slug) courseQuery = courseQuery.eq('slug', row.course_slug);
      else {
        errors.push({ row, err: 'Missing course_id or course_slug' });
        continue;
      }

      const { data: course, error: courseError } = await courseQuery.maybeSingle();
      if (courseError) throw courseError;
      if (!course?.id) {
        errors.push({ row, err: 'Course not found' });
        continue;
      }

      const enrollment = await resolveCourseEnrollment(learner.id, course.id);
      if (!enrollment) {
        errors.push({ row, err: 'Learner is not enrolled in this course' });
        continue;
      }

      const { checkCourseCompletion } = await import('@/lib/course-completion');
      const completion = await checkCourseCompletion(learner.id, course.id);
      if (!completion.isComplete) {
        errors.push({
          row,
          err: `Course requirements not met: ${completion.missingRequirements.join('; ')}`,
        });
        continue;
      }

      const issueDate = row.issued_at || null;
      const expiresAt = row.expires_at || null;
      const { issueCertificate } = await import('@/lib/certificates/issue-certificate');
      const result = await issueCertificate({
        supabase: db,
        enrollmentId: enrollment.id,
        studentId: learner.id,
        studentName: learner.full_name || learner.email || 'Learner',
        studentEmail: learner.email || undefined,
        courseId: course.id,
        courseTitle: course.title,
        issuedBy: user.id,
        issueDate,
        expiresAt,
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
          completionMethod: 'bulk_staff_requested_after_verified_course_completion',
        },
      });

      if (!result.success || !result.certificate) {
        errors.push({ row, err: result.error || 'Certificate issuance failed' });
        continue;
      }

      if (!result.alreadyIssued) {
        await db.from('enrollment_events').insert({
          user_id: learner.id,
          course_id: course.id,
          funding_program_id: enrollment.funding_program_id || null,
          kind: 'CERTIFIED',
        });
      }

      if (enrollment.program_id || course.program_id) {
        const { checkProgramCompletion, completeProgramEnrollment } =
          await import('@/lib/lms/completion-evaluator');
        const completedPrograms = await checkProgramCompletion(learner.id, course.id);
        for (const program of completedPrograms) {
          await completeProgramEnrollment(
            program.program_enrollment_id,
            program.user_id,
            program.program_id,
          );
        }
      }

      issued++;
    } catch (error) {
      errors.push({ row, err: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return NextResponse.json({ ok: errors.length === 0, issued, errors });
}

export const POST = withApiAudit('/api/cert/bulk-issue', _POST);
