// pre-auth-registry: exempt - requireProgramHolder verifies the authenticated user and active holder relationship before any closeout write.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder')
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const enrollmentId = String(body.enrollment_id || '');
  const start = String(body.training_start_date || '');
  const end = String(body.training_end_date || '');
  const certificateDate = String(body.certificate_issued_date || '');
  const hours = Number(body.total_hours_completed);
  const summary = String(body.completion_summary || '').trim();
  if (
    !UUID.test(enrollmentId) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(certificateDate)
  )
    return NextResponse.json(
      { error: 'Student and all required dates are required.' },
      { status: 400 },
    );
  const today = new Date().toISOString().slice(0, 10);
  if (end < start || end > today || certificateDate > today)
    return NextResponse.json(
      { error: 'Completion dates must be valid and cannot be in the future.' },
      { status: 400 },
    );
  if (!Number.isFinite(hours) || hours <= 0 || hours > 1000)
    return NextResponse.json({ error: 'Enter valid completed hands-on hours.' }, { status: 400 });
  if (
    body.lms_completed !== 'true' ||
    body.practical_skills_verified !== 'true' ||
    body.certificate_received !== 'true' ||
    summary.length < 20
  )
    return NextResponse.json(
      {
        error:
          'Confirm coursework, practical skills, certificate receipt, and provide a final summary.',
      },
      { status: 400 },
    );
  const { data: enrollment } = await ctx.db
    .from('program_enrollments')
    .select('id,user_id,program_id,program_slug')
    .eq('id', enrollmentId)
    .eq('program_holder_id', ctx.holderId)
    .maybeSingle();
  if (!enrollment || !ctx.programIds.includes(enrollment.program_id))
    return NextResponse.json(
      { error: 'This student is not in your HVAC roster.' },
      { status: 403 },
    );
  const { error } = await ctx.db
    .from('program_enrollments')
    .update({
      status: 'graduated',
      enrollment_state: 'graduated',
      training_start_date: start,
      training_end_date: end,
      completed_at: `${end}T12:00:00.000Z`,
      certificate_issued_at: `${certificateDate}T12:00:00.000Z`,
      total_hours_completed: hours,
      progress_percent: 100,
      lms_completed: true,
      practical_skills_verified: true,
      last_progress_update: end,
      updated_at: new Date().toISOString(),
    })
    .eq('id', enrollment.id)
    .eq('program_holder_id', ctx.holderId);
  if (error)
    return NextResponse.json({ error: 'Student closeout could not be saved.' }, { status: 500 });
  await ctx.db
    .from('hour_entries')
    .insert({
      user_id: enrollment.user_id,
      program_holder_id: ctx.holderId,
      program_slug: enrollment.program_slug || 'hvac-technician',
      source_type: 'program_holder_student_closeout',
      source_entity_name: 'HVAC student completion closeout',
      work_date: end,
      hours_claimed: hours,
      category: 'student_closeout',
      notes: summary,
      entered_by_email: ctx.user.email || ctx.profile.email || 'program-holder',
      status: 'submitted',
      approval_status: 'submitted',
      submitted_by_partner: true,
    });
  return NextResponse.json({ ok: true });
}
