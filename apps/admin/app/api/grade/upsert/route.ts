import { safeInternalError } from '@/lib/api/safe-error';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { canEditCourse } from '@/lib/authGuards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logStaffRecordAccess } from '@/lib/audit/ferpa';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is instructor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const gradingRoles = ['instructor', 'admin', 'super_admin', 'staff'];
  if (!profile?.role || !gradingRoles.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { gradeItemId, enrollmentId, assignmentSubmissionId, points, feedback } = await req.json();

  if (assignmentSubmissionId) {
    if (
      typeof assignmentSubmissionId !== 'string' ||
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(assignmentSubmissionId)
    ) {
      return NextResponse.json({ error: 'Invalid submission ID' }, { status: 400 });
    }
    const db = await requireAdminClient();
    const { data: submission, error: submissionError } = await db
      .from('assignment_submissions')
      .select('id,assignment_id,course_id,user_id,student_id')
      .eq('id', assignmentSubmissionId)
      .maybeSingle();
    if (submissionError) return safeInternalError(submissionError, 'Unable to load submission');
    if (!submission || !(await canEditCourse(submission.course_id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { data: assignment, error: assignmentError } = await db
      .from('assignments')
      .select('id,max_points')
      .eq('id', submission.assignment_id)
      .eq('course_id', submission.course_id)
      .maybeSingle();
    if (assignmentError) return safeInternalError(assignmentError, 'Unable to load assignment');
    if (
      !assignment ||
      typeof points !== 'number' ||
      !Number.isFinite(points) ||
      points < 0 ||
      points > assignment.max_points ||
      assignment.max_points <= 0 ||
      (feedback !== undefined && (typeof feedback !== 'string' || feedback.length > 20000))
    ) {
      return NextResponse.json(
        {
          error:
            'Provide valid points within the assignment maximum and feedback under 20,000 characters',
        },
        { status: 400 },
      );
    }
    const { data: saved, error } = await db
      .from('assignment_submissions')
      .update({
        grade: points,
        feedback: feedback ?? '',
        graded_by: user.id,
        graded_at: new Date().toISOString(),
        status: 'graded',
      })
      .eq('id', submission.id)
      .eq('course_id', submission.course_id)
      .select('id')
      .maybeSingle();
    if (error || !saved)
      return safeInternalError(error ?? new Error('Grade was not saved'), 'Unable to save grade');
    await logStaffRecordAccess(
      user.id,
      profile.role,
      submission.user_id || submission.student_id,
      'grades',
      'update',
      submission.id,
    );
    return NextResponse.json({ ok: true });
  }

  if (!gradeItemId || !enrollmentId || points === undefined || points === null) {
    return NextResponse.json(
      { error: 'gradeItemId, enrollmentId, and points are required' },
      { status: 400 },
    );
  }

  // Verify this grade item belongs to a course taught by instructor
  const { data: gradeItem } = await supabase
    .from('grade_items')
    .select(
      `
      id,
      courses:course_id (
        instructor_id
      )
    `,
    )
    .eq('id', gradeItemId)
    .maybeSingle();

  if (
    !gradeItem ||
    (gradeItem.courses as { instructor_id?: string } | null)?.instructor_id !== user.id
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Upsert the grade
  const { error } = await supabase.from('grades').upsert(
    {
      grade_item_id: gradeItemId,
      enrollment_id: enrollmentId,
      points,
      graded_at: new Date().toISOString(),
    },
    {
      onConflict: 'grade_item_id,enrollment_id',
    },
  );

  if (error) {
    logger.error('Failed to upsert grade:', error);
    return safeInternalError(error as Error, 'Internal server error');
  }

  // FERPA: log grade update
  await logStaffRecordAccess(user.id, profile.role, enrollmentId, 'grades', 'update', gradeItemId);

  return NextResponse.json({ ok: true });
}
export const POST = withApiAudit('/api/grade/upsert', _POST);
