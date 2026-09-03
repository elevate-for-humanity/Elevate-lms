import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ELIGIBLE_STATUSES = ['active', 'enrolled', 'completed', 'graduated'];

export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder')
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const enrollmentId = String(body.enrollment_id || '');
  const periodType = body.period_type === 'weekly' ? 'weekly' : 'daily';
  const workDate = String(body.work_date || '');
  const activities = String(body.activities || '').trim();
  const hours = Number(body.hours);
  const progressPercent = Number(body.progress_percent);

  if (!UUID.test(enrollmentId) || !/^\d{4}-\d{2}-\d{2}$/.test(workDate))
    return NextResponse.json(
      { error: 'Select a student and valid training date.' },
      { status: 400 },
    );
  if (!Number.isFinite(hours) || hours < 0.25 || hours > 60)
    return NextResponse.json(
      { error: 'Training hours must be between 0.25 and 60.' },
      { status: 400 },
    );
  if (!Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100)
    return NextResponse.json(
      { error: 'Progress must be a whole number from 0 to 100.' },
      { status: 400 },
    );
  if (activities.length < 10 || activities.length > 2000)
    return NextResponse.json(
      { error: 'Describe the training completed in 10 to 2,000 characters.' },
      { status: 400 },
    );
  if (workDate > new Date().toISOString().slice(0, 10))
    return NextResponse.json(
      { error: 'Training cannot be logged for a future date.' },
      { status: 400 },
    );

  const { data: enrollment } = await ctx.db
    .from('program_enrollments')
    .select('id,user_id,program_id,program_slug,status,enrollment_state,progress_percent')
    .eq('id', enrollmentId)
    .eq('program_holder_id', ctx.holderId)
    .maybeSingle();
  if (
    !enrollment ||
    !ELIGIBLE_STATUSES.includes(String(enrollment.status)) ||
    !ctx.programIds.includes(enrollment.program_id)
  )
    return NextResponse.json(
      { error: 'This student is not in your enrolled HVAC roster.' },
      { status: 403 },
    );
  if (progressPercent < Number(enrollment.progress_percent || 0))
    return NextResponse.json(
      { error: 'Progress cannot be lower than the student’s current progress.' },
      { status: 400 },
    );

  const { error: entryError } = await ctx.db.from('hour_entries').insert({
    user_id: enrollment.user_id,
    program_holder_id: ctx.holderId,
    program_slug: enrollment.program_slug || 'hvac-technician',
    source_type: 'program_holder_training_log',
    source_entity_name:
      periodType === 'weekly' ? 'Weekly HVAC training summary' : 'Daily HVAC training progress',
    work_date: workDate,
    hours_claimed: hours,
    category: `${periodType}_training`,
    notes: activities,
    entered_by_email: ctx.user.email || ctx.profile.email || 'program-holder',
    status: 'submitted',
    approval_status: 'submitted',
    submitted_by_partner: true,
  });
  if (entryError)
    return NextResponse.json({ error: 'Training log could not be saved.' }, { status: 500 });

  const { error: progressError } = await ctx.db
    .from('program_enrollments')
    .update({
      progress_percent: progressPercent,
      last_progress_update: workDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', enrollment.id)
    .eq('program_holder_id', ctx.holderId);
  if (progressError)
    return NextResponse.json(
      { error: 'Hours were saved, but student progress could not be updated. Contact Admin.' },
      { status: 500 },
    );

  return NextResponse.json({ ok: true });
}
