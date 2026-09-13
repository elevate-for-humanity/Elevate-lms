// pre-auth-registry: exempt - requireProgramHolder and holder filters authorize every operation.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export async function GET() {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const [{ data, error }, { data: applicants }] = await Promise.all([
    ctx.db.from('program_holder_meetings').select('*').eq('program_holder_id', ctx.holderId).order('starts_at'),
    ctx.db.from('program_holder_students').select('id,applicant_name').eq('program_holder_id', ctx.holderId).in('status',['applied','pending','enrolled']).order('applicant_name'),
  ]);
  return error ? NextResponse.json({ error: 'Unable to load meetings.' }, { status: 500 }) : NextResponse.json({ meetings: data ?? [], applicants: applicants ?? [] });
}

export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const studentId = String(body.programHolderStudentId || '');
  const startsAt = String(body.startsAt || '');
  const method = String(body.meetingMethod || 'phone');
  if (!studentId || !startsAt || !['phone','video','in_person'].includes(method)) return NextResponse.json({ error: 'Applicant, date, time, and meeting method are required.' }, { status: 400 });
  const { data: student } = await ctx.db.from('program_holder_students').select('id,applicant_name').eq('id', studentId).eq('program_holder_id', ctx.holderId).maybeSingle();
  if (!student) return NextResponse.json({ error: 'Applicant is not assigned to this Program Holder.' }, { status: 404 });
  const { data, error } = await ctx.db.from('program_holder_meetings').insert({program_holder_id:ctx.holderId,program_holder_student_id:student.id,title:String(body.title||`Enrollment meeting with ${student.applicant_name||'applicant'}`).slice(0,180),starts_at:startsAt,duration_minutes:Number(body.durationMinutes||30),meeting_method:method,meeting_url:body.meetingUrl||null,location:body.location||null,agenda:String(body.agenda||'').slice(0,2000)||null,created_by:ctx.user.id}).select('*').single();
  return error ? NextResponse.json({ error: 'Unable to schedule meeting.' }, { status: 500 }) : NextResponse.json({ meeting: data }, { status: 201 });
}
