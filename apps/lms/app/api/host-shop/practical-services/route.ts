import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';
import { canOwnerRecordService, validPracticalServiceDate } from '@/lib/apprenticeship/practical-service-policy.mjs';
export const dynamic='force-dynamic';
async function context(){
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();if(!user)return null;
 const db=await requireAdminClient();
 const {data:members}=await db.from('partner_users').select('partner_id,role,status').eq('user_id',user.id).eq('status','active');
 const {data:profile}=await db.from('profiles').select('role').eq('id',user.id).maybeSingle();
 return {user,db,members:members||[],admin:['admin','super_admin','org_admin'].includes(profile?.role||'')};
}
async function authorize(ctx:NonNullable<Awaited<ReturnType<typeof context>>>,enrollmentId:string){
 const runtime=await resolveApprenticeshipRuntimeContext(ctx.db,{enrollmentId,requireRegisteredStandard:false});
 if(!runtime?.placement || !['active','enrolled','in_progress','confirmed'].includes(runtime.enrollment.status))return null;
 const {data:shop}=await ctx.db.from('shops').select('partner_id,owner_id,active').eq('id',runtime.placement.shop_id).maybeSingle();
 const allowed=ctx.admin||ctx.members.some((m:any)=>m.partner_id===shop?.partner_id&&['owner','partner_admin','admin','supervisor','mentor','manager'].includes(m.role));
 if(!allowed || !shop?.active)return null;
 (runtime as any).canRecord=canOwnerRecordService({userId:ctx.user.id,studentId:runtime.studentId,shop,members:ctx.members});
 return runtime;
}
export async function GET(req:NextRequest){
 const ctx=await context();if(!ctx)return NextResponse.json({error:'Unauthorized'},{status:401});
 const id=req.nextUrl.searchParams.get('enrollmentId')||'';
 const runtime=await authorize(ctx,id);if(!runtime)return NextResponse.json({error:'Not authorized for enrollment'},{status:403});
 const {data,error}=await ctx.db.from('host_shop_practical_service_entries').select('id,competency_id,service_name,performed_on,subject_type,mentor_notes,verified_at').eq('enrollment_id',id).is('voided_at',null).order('performed_on',{ascending:false}).limit(500);
 return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json({entries:data||[],canRecord:(runtime as any).canRecord});
}
export async function POST(req:NextRequest){
 const ctx=await context();if(!ctx)return NextResponse.json({error:'Unauthorized'},{status:401});
 const body=await req.json().catch(()=>null);
 const enrollmentId=String(body?.enrollmentId||'');
 const runtime=await authorize(ctx,enrollmentId);
 if(!runtime)return NextResponse.json({error:'Not authorized for enrollment'},{status:403});
 if(!(runtime as any).canRecord)return NextResponse.json({error:'Only the Host Shop owner may check off a service; students have read-only progress.'},{status:403});
 // Ordinary service logs are independent of formal Appendix A sign-offs.
 const competency=body?.competencyId ? runtime.contract?.standard.competencies.find(c=>c.id===body.competencyId) : null;
 if(body?.competencyId&&!competency)return NextResponse.json({error:'Unknown competency'},{status:400});
 const serviceName=String(body?.serviceName||'').trim().slice(0,120);
 const subjectType=String(body?.subjectType||'');
 const performedOn=String(body?.performedOn||'');
 if(!serviceName||!['patron','mannequin','student'].includes(subjectType)||!validPracticalServiceDate(performedOn))return NextResponse.json({error:'Valid service, subject and past/current date required'},{status:400});
 const {data,error}=await ctx.db.from('host_shop_practical_service_entries').insert({enrollment_id:enrollmentId,placement_id:runtime.placement.id,shop_id:runtime.placement.shop_id,student_id:runtime.placement.student_id,competency_id:competency?.id||null,service_name:serviceName,performed_on:performedOn,subject_type:subjectType,mentor_user_id:ctx.user.id,mentor_notes:String(body?.notes||'').slice(0,1000)}).select('id').single();
 return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json({ok:true,id:data.id},{status:201});
}
