import {NextRequest,NextResponse} from 'next/server';
import {apiRequireAdmin} from '@/lib/admin/guards';
import {requireAdminClient} from '@/lib/supabase/admin';
import {requestCourseWorker} from '@/lib/gcp/course-worker-launch';
import {COURSE_AI_ROLES} from '@/lib/ultimate-course-builder/worker/paris-monitor.mjs';
import {safeInternalError} from '@/lib/api/safe-error';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 const auth=await apiRequireAdmin(req);if(auth.error)return auth.error;
 const input=await req.json().catch(()=>null);
 if(!/^[a-f0-9-]{36}$/i.test(input?.buildId??'')||typeof input?.enabled!=='boolean')
  return NextResponse.json({error:'Select a saved build and autopilot setting.'},{status:400});
 try{
  const db=await requireAdminClient();
  const {data:job,error}=await db.from('ultimate_build_jobs').select('id,monitor,execution_generation')
   .eq('build_id',input.buildId).eq('job_type','course_build').order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(error)throw error;
  if(!job)return NextResponse.json({error:'Start and save this course before enabling monitoring.'},{status:409});
  const monitor={...job.monitor,enabled:input.enabled,coordinator:'PARIS',agents:COURSE_AI_ROLES,
   configuredBy:auth.id,configuredAt:new Date().toISOString()};
  const saved=await db.from('ultimate_build_jobs').update({monitor}).eq('id',job.id)
   .eq('execution_generation',job.execution_generation).eq('monitor',JSON.stringify(job.monitor)).select('id');
  if(saved.error)throw saved.error;
  if(saved.data?.length!==1)return NextResponse.json({error:'Worker state changed. Refresh and try again.'},{status:409});
  const launch=input.enabled?await requestCourseWorker():null;
  return NextResponse.json({ok:true,monitor,launch,message:input.enabled
   ? 'PARIS monitoring enabled. Recovery preserves checkpoints and retry limits. '+launch?.message
   : 'PARIS automatic recovery disabled. An active worker continues to its checkpoint.'});
 }catch(error){return safeInternalError(error,'Course autopilot configuration failed','Autopilot setting could not be saved.');}
}
