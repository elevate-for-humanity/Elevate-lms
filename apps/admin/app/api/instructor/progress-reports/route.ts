import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { normalizeRoles } from '@/lib/rbac/role-matrix';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  program_enrollment_id: z.string().uuid(),
  instructional_hours: z.number().positive().max(48),
  classroom_topics: z.string().trim().min(3).max(5000),
  hands_on_activities: z.string().trim().min(3).max(5000),
  competencies_covered: z.array(z.string().trim().min(1).max(160)).max(50).default([]),
  attendance_status: z.enum(['present', 'partial', 'excused_absence', 'unexcused_absence']),
  progress_status: z.enum(['on_track', 'needs_support', 'completed']),
  ready_for_testing: z.boolean().default(false),
  instructor_notes: z.string().trim().max(5000).optional().default(''),
  input_method: z.enum(['manual', 'voice', 'mixed']).default('manual'),
});

async function _POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const authDb = await createClient();
  const {
    data: { user },
  } = await authDb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    authDb.from('profiles').select('full_name,email,role').eq('id', user.id).maybeSingle(),
    authDb.from('user_roles').select('roles(name)').eq('user_id', user.id),
  ]);
  const roles = normalizeRoles([
    profile?.role,
    ...(roleRows ?? []).map((row: any) => row.roles?.name),
  ]);
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  if (!isAdmin && !roles.includes('instructor'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Complete the required progress fields with valid hours.' },
      { status: 400 },
    );
  const input = parsed.data;
  const db = await requireAdminClient();
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id,user_id,program_id,status,profiles(full_name,email),programs(title)')
    .eq('id', input.program_enrollment_id)
    .maybeSingle();
  if (!enrollment?.user_id)
    return NextResponse.json({ error: 'Student enrollment not found.' }, { status: 404 });

  if (!isAdmin) {
    const { data: assignment } = await db
      .from('program_instructors')
      .select('program_id')
      .eq('instructor_id', user.id)
      .eq('program_id', enrollment.program_id)
      .maybeSingle();
    if (!assignment)
      return NextResponse.json(
        { error: 'This student is not assigned to your program.' },
        { status: 403 },
      );
  }

  const report = {
    instructor_id: user.id,
    student_id: enrollment.user_id,
    program_enrollment_id: enrollment.id,
    program_id: enrollment.program_id,
    instructional_hours: input.instructional_hours,
    classroom_topics: input.classroom_topics,
    hands_on_activities: input.hands_on_activities,
    competencies_covered: input.competencies_covered,
    attendance_status: input.attendance_status,
    progress_status: input.ready_for_testing ? 'completed' : input.progress_status,
    ready_for_testing: input.ready_for_testing,
    instructor_notes: input.instructor_notes || null,
    input_method: input.input_method,
  };
  const { data: saved, error } = await db
    .from('instructor_progress_reports')
    .insert(report)
    .select('id,created_at')
    .single();
  if (error)
    return NextResponse.json({ error: 'The progress form could not be saved.' }, { status: 500 });

  await db.from('instructor_attestations').insert({
    instructor_id: user.id,
    instructor_name: profile?.full_name || profile?.email || 'Instructor',
    instructor_role: isAdmin ? 'sponsor_admin' : 'instructor',
    attestation_type: input.ready_for_testing ? 'competency_checkpoint' : 'weekly_review',
    student_id: enrollment.user_id,
    program_id: enrollment.program_id,
    competencies_covered: input.competencies_covered,
    engagement_verified:
      input.attendance_status === 'present' || input.attendance_status === 'partial',
    engagement_notes: `${input.classroom_topics}\n\nHands-on: ${input.hands_on_activities}${input.instructor_notes ? `\n\nNotes: ${input.instructor_notes}` : ''}`,
    hours_attested: input.instructional_hours,
    attestation_method: 'digital_signature',
  });

  const { data: totals } = await db
    .from('instructor_progress_reports')
    .select('instructional_hours')
    .eq('program_enrollment_id', enrollment.id);
  const totalHours = (totals ?? []).reduce(
    (sum: number, row: any) => sum + Number(row.instructional_hours || 0),
    0,
  );
  const enrollmentUpdate: Record<string, unknown> = {
    total_hours_completed: Math.min(48, totalHours),
  };
  if (input.ready_for_testing)
    Object.assign(enrollmentUpdate, {
      practical_skills_verified: true,
      status: 'completed',
      progress_percent: 100,
      training_end_date: new Date().toISOString().slice(0, 10),
    });
  await db.from('program_enrollments').update(enrollmentUpdate).eq('id', enrollment.id);

  if (input.ready_for_testing) {
    const studentName =
      (enrollment.profiles as any)?.full_name || (enrollment.profiles as any)?.email || 'Student';
    const programName = (enrollment.programs as any)?.title || 'program';
    const recipient = process.env.ADMIN_EMAIL || PLATFORM_DEFAULTS.supportEmail;
    await db.from('email_queue').insert({
      recipient_email: recipient,
      to_email: recipient,
      subject: `${studentName} is ready for testing`,
      body: `${profile?.full_name || 'An instructor'} marked ${studentName} complete and ready for testing in ${programName}. Review progress report ${saved.id}.`,
      text_body: `${profile?.full_name || 'An instructor'} marked ${studentName} complete and ready for testing in ${programName}. Review progress report ${saved.id}.`,
      status: 'pending',
      scheduled_for: new Date().toISOString(),
      related_id: saved.id,
      related_type: 'instructor_progress_report',
      metadata: {
        student_id: enrollment.user_id,
        program_id: enrollment.program_id,
        report_id: saved.id,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    report: saved,
    total_hours: totalHours,
    testing_notification_queued: input.ready_for_testing,
  });
}

export const POST = withApiAudit('/api/instructor/progress-reports', _POST);
