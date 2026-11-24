import {NextRequest,NextResponse} from 'next/server';
import {apiRequireDevStudio} from '@/lib/devstudio/api-auth';
import {applyRateLimit} from '@/lib/api/withRateLimit';
import {requireAdminClient} from '@/lib/supabase/admin';
import {repairDashboardReceipt,repairTaskId} from '@/lib/devstudio/repair-dashboard';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const task = String(body.task ?? body.goal ?? '').trim();
  if (!task) return NextResponse.json({ error: 'task is required' }, { status: 400 });
  if(task.length>12000)return NextResponse.json({error:'Repair task exceeds 12000 characters.'},{status:400});
  const key=request.headers.get('idempotency-key');
  if(key && !/^[a-f0-9-]{36}$/.test(key))return NextResponse.json({error:'Invalid repair request key.'},{status:400});
  const fingerprint=key?`studio-openhands:${auth.id}:${key}`:undefined;

  const {enqueueParisRepair} = await import('@/lib/ai/runtime/code-repair');
  // Persist ownership first. The signed workflow stages the patch with its
  // short-lived job token, so closing Studio cannot interrupt or lose the task.
  const repair = await enqueueParisRepair({actorId:auth.id,goal:task,...(fingerprint?{fingerprint}:{})});
  if(!repair.id)return NextResponse.json({error:'Durable repair task could not be confirmed.'},{status:503});
  let status='queued';
  if(fingerprint){
    const db=await requireAdminClient();
    const existing=await db.from('paris_code_repairs').select('actor_id,goal,status').eq('id',repair.id).single();
    if(existing.error)return NextResponse.json({error:'Repair receipt could not be verified. Check status before retrying.'},{status:503});
    if(existing.data?.actor_id!==auth.id || existing.data?.goal!==task)return NextResponse.json({error:'This request key belongs to a different repair.'},{status:409});
    status=existing.data.status;
  }
  return NextResponse.json({repairId:repair.id,status,executed:false,engine:'paris',
    summary:'Repair saved. PARIS runs it on the owned engine and verifies its commits, runs independent checks, opens a protected pull request, and verifies the production release. OpenHands is opt-in only and is not used unless PARIS_REPAIR_ENGINE=openhands.'},{status:202});
}

/** Dashboard status reads never dispatch, approve, publish or replay work. */
export async function GET(request: NextRequest){
 const rateLimited=await applyRateLimit(request,'api');if(rateLimited)return rateLimited;
 const auth=await apiRequireDevStudio(request);if(auth.error)return auth.error;
 const db=await requireAdminClient();
 const {data,error}=await db.from('paris_code_repairs')
  .select('id,status,source_job_id,workflow_run_id,candidate,verification,release_sha,error_code,updated_at')
  .eq('actor_id',auth.id).order('updated_at',{ascending:false}).limit(25);
 if(error)return NextResponse.json({error:'Repair status is temporarily unavailable.'},{status:503});
 const taskIds=[...new Set((data??[]).map(repairTaskId).filter((id):id is string=>Boolean(id)))];
 const tasks=new Map<string,any>();
 if(taskIds.length){
  const receipt=await db.from('ai_tasks')
   .select('id,user_id,tenant_id,tool_name,status,requires_approval,approval_status,approval_reason,correlation_id,tool_output')
   .eq('user_id',auth.id).eq('tool_name','openhands.execute').is('tenant_id',null).in('id',taskIds);
  if(receipt.error)return NextResponse.json({error:'Repair approval evidence is temporarily unavailable.'},{status:503});
  for(const task of receipt.data??[])tasks.set(task.id,task);
 }
 const repairs=(data??[]).map(row=>repairDashboardReceipt(row,tasks.get(repairTaskId(row)??''),auth.id));
 return NextResponse.json({repairs},{headers:{'Cache-Control':'no-store'}});
}
