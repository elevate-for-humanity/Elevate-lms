// pre-auth-registry: exempt - authenticated Program Holder and canonical enrollment ownership are verified before insert.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') return NextResponse.json({error:'Program Holder session required.'},{status:403});
  const body = await request.json().catch(()=>null);
  const enrollmentId = String(body?.enrollmentId || '');
  const date = String(body?.date || '');
  const hours = Number(body?.hours);
  const work = String(body?.work || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(enrollmentId) || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(date+'T00:00:00Z')) || date > new Date().toISOString().slice(0,10) ||
      !Number.isFinite(hours) || hours < 0.25 || hours > 24 || Math.round(hours*4)!==hours*4 ||
      work.length < 10 || work.length > 2000) {
    return NextResponse.json({error:'Select an enrolled student, valid date, quarter-hour increments, and describe the work.'},{status:400});
  }
  const {data: enrollment, error: lookupError} = await ctx.db.from('program_enrollments')
    .select('id,user_id,program_id,program_slug,status')
    .eq('id',enrollmentId).eq('program_holder_id',ctx.holderId)
    .in('status',['active','enrolled','in_progress']).maybeSingle();
  if (lookupError) return NextResponse.json({error:'Unable to verify enrollment.'},{status:500});
  if (!enrollment || !enrollment.user_id || !ctx.programIds.includes(enrollment.program_id))
    return NextResponse.json({error:'Student is not actively enrolled in your assigned program.'},{status:403});
  const {error} = await ctx.db.from('hour_entries').insert({
    user_id:enrollment.user_id,program_holder_id:ctx.holderId,program_slug:enrollment.program_slug,
    source_type:'manual',source_entity_name:'Program Holder training log',
    work_date:date,hours_claimed:hours,accepted_hours:0,category:'training',
    notes:work,entered_by_email:ctx.user.email || ctx.profile.email,status:'pending',
    approval_status:'pending',submitted_by_partner:true
  });
  return error ? NextResponse.json({error:'Unable to submit hours for Admin review.'},{status:500})
    : NextResponse.json({ok:true,status:'pending'},{status:201});
}
