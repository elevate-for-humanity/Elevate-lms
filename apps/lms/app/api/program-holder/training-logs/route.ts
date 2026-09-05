// pre-auth-registry: exempt - requireProgramHolder verifies the authenticated user and holder relationship.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ELIGIBLE = ['active', 'enrolled', 'completed', 'graduated'];

export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const enrollmentId = String(body.enrollment_id || '');
  const workDate = String(body.work_date || '');
  const milestone = String(body.milestone || '').trim();
  const work = String(body.work_completed || '').trim();
  const skills = String(body.skills_learned || '').trim();
  const hours = Number(body.hours);
  const progressPercent = Number(body.progress_percent);
  if (!UUID.test(enrollmentId) || !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) return NextResponse.json({ error: 'Select a student and valid training date.' }, { status: 400 });
  if (workDate > new Date().toISOString().slice(0, 10)) return NextResponse.json({ error: 'Training cannot be logged for a future date.' }, { status: 400 });
  if (!Number.isFinite(hours) || hours < 0.25 || hours > 48) return NextResponse.json({ error: 'Entry hours must be between 0.25 and 48.' }, { status: 400 });
  if (!Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100) return NextResponse.json({ error: 'Progress must be a whole number from 0 to 100.' }, { status: 400 });
  if (!milestone || work.length < 10 || skills.length < 10 || body.attested !== 'true') return NextResponse.json({ error: 'Milestone, work performed, skills learned, and attestation are required.' }, { status: 400 });
  const { data: enrollment } = await ctx.db.from('program_enrollments').select('id,user_id,program_id,program_slug,status,progress_percent,total_hours_completed').eq('id', enrollmentId).eq('program_holder_id', ctx.holderId).maybeSingle();
  if (!enrollment || !ELIGIBLE.includes(String(enrollment.status)) || !ctx.programIds.includes(enrollment.program_id)) return NextResponse.json({ error: 'This student is not in your enrolled roster.' }, { status: 403 });
  if (progressPercent < Number(enrollment.progress_percent || 0)) return NextResponse.json({ error: 'Progress cannot be lower than the current progress.' }, { status: 400 });
  const totalHours = Math.min(48, Number(enrollment.total_hours_completed || 0) + hours);
  const notes = `Milestone: ${milestone}\nWork performed: ${work}\nSkills learned: ${skills}\nProgram Holder attestation: signed`;
  const { error: entryError } = await ctx.db.from('hour_entries').insert({ user_id: enrollment.user_id, program_holder_id: ctx.holderId, program_slug: enrollment.program_slug || 'assigned-program', source_type: 'program_holder_workone_progress', source_entity_name: milestone, work_date: workDate, hours_claimed: hours, category: 'workone_48_hour_milestone', notes, entered_by_email: ctx.user.email || ctx.profile.email || 'program-holder', status: 'submitted', approval_status: 'submitted', submitted_by_partner: true });
  if (entryError) return NextResponse.json({ error: 'The milestone could not be saved.' }, { status: 500 });
  const { error: progressError } = await ctx.db.from('program_enrollments').update({ progress_percent: progressPercent, total_hours_completed: totalHours, last_progress_update: workDate, updated_at: new Date().toISOString() }).eq('id', enrollment.id).eq('program_holder_id', ctx.holderId);
  if (progressError) return NextResponse.json({ error: 'Hours were saved, but cumulative progress could not be updated.' }, { status: 500 });
  return NextResponse.json({ ok: true, total_hours_completed: totalHours });
}
