// pre-auth-registry: exempt - requireProgramHolder establishes authenticated user and holder ownership; enrollment is verified against holder before inserting report.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
export const dynamic='force-dynamic';

export async function POST(request:Request) {
 const ctx=await requireProgramHolder();
 if(ctx.mode!=='holder')return NextResponse.json({error:'Program Holder session required.'},{status:403});
 const body=await request.json().catch(()=>null);
 const enrollmentId=String(body?.enrollmentId||'');
 const start=String(body?.start||''),end=String(body?.end||'');
 const hours=Number(body?.hours),progress=String(body?.progress||''),notes=String(body?.notes||'').trim();
 const allowed=['attendance','instruction','practice','assessment','safety','support'];
 const checks=body?.checks;
 if(!/^[a-f0-9-]{36}$/i.test(enrollmentId)|| !/^\d{4}-\d{2}-\d{2}$/.test(start)|| !/^\d{4}-\d{2}-\d{2}$/.test(end)||start>end||
 !Number.isFinite(hours)||hours<0||hours>168||!['on_track','needs_support','at_risk','milestone_met'].includes(progress)||
 !Array.isArray(checks)||checks.some((v:unknown)=>typeof v!=='string'||!allowed.includes(v))||!notes||notes.length>4000) {
  return NextResponse.json({error:'Choose a student and provide valid report details.'},{status:400});
 }
 const {data:student,error:studentError}=await ctx.db.from('program_enrollments')
  .select('id,full_name,program_id,status').eq('id',enrollmentId).eq('program_holder_id',ctx.holderId)
  .in('status',['active','enrolled','in_progress','completed','graduated']).maybeSingle();
 if(studentError)return NextResponse.json({error:'Unable to verify student enrollment.'},{status:500});
 if(!student)return NextResponse.json({error:'Student is not enrolled with this Program Holder.'},{status:403});
 const {error}=await ctx.db.from('program_holder_reports').insert({
  program_holder_id:ctx.holderId,user_id:ctx.user.id,
  title:'Progress report — '+(student.full_name||'Enrolled student'),
  report_type:'student_progress',status:'submitted',hours_worked:hours,period_start:start,period_end:end,
  content:notes,submitted_at:new Date().toISOString(),
  metadata:{enrollment_id:student.id,program_id:student.program_id,student_name:student.full_name,progress,checklist:checks,reported_hours_unverified:true}
 });
 return error?NextResponse.json({error:'Unable to submit progress report.'},{status:500}):NextResponse.json({ok:true},{status:201});
}
