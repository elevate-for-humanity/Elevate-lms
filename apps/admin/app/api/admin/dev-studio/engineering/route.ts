import {NextRequest,NextResponse} from 'next/server';
import {apiRequireDevStudio} from '@/lib/devstudio/api-auth';
import {applyRateLimit} from '@/lib/api/withRateLimit';
import {requireAdminClient} from '@/lib/supabase/admin';
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
  return NextResponse.json({repairId:repair.id,status,executed:false,engine:'openhands',
    summary:'Repair saved for OpenHands. PARIS will verify its commits, run independent checks, open a protected pull request, and verify the production release.'},{status:202});
}

/** Dashboard status reads never dispatch, approve, publish or replay work. */
export async function GET(request: NextRequest){
 const rateLimited=await applyRateLimit(request,'api');if(rateLimited)return rateLimited;
 const auth=await apiRequireDevStudio(request);if(auth.error)return auth.error;
 const db=await requireAdminClient();
 const {data,error}=await db.from('paris_code_repairs')
  .select('id,status,source_job_id,workflow_run_id,candidate,verification,release_sha,updated_at')
  .eq('actor_id',auth.id).order('updated_at',{ascending:false}).limit(25);
 if(error)return NextResponse.json({error:'Repair status is temporarily unavailable.'},{status:503});
 const repairs=(data??[]).map(row=>{
  const candidate=row.candidate as any,verification=row.verification as any;
  const branch=candidate?.branch?.name??candidate?.checkpoint?.branch;
  const taskId=candidate?.openhands_task_id??candidate?.checkpoint?.taskId;
  const pr=verification?.pullRequest;
  const releaseSha=/^[a-f0-9]{40}$/.test(row.release_sha??'')?row.release_sha:null;
  return {repairId:row.id,status:row.status,area:row.source_job_id?'Course Builder':'Engineering',
   engine:!candidate||candidate?.provider==='openhands'||candidate?.kind==='openhands-checkpoint'?'openhands':'internal',
   taskId:typeof taskId==='string'?taskId:null,
   branch:typeof branch==='string'&&/^studio\/[a-zA-Z0-9/_-]+$/.test(branch)?branch:null,
   pullRequest:typeof pr?.number==='number'?{number:pr.number,url:`https://github.com/elevate-for-humanity/Elevate-lms/pull/${pr.number}`}:null,
   workflowUrl:Number.isSafeInteger(row.workflow_run_id)?`https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/${row.workflow_run_id}`:null,
   releaseSha,verifiedLive:row.status==='verified'&&Boolean(releaseSha),updatedAt:row.updated_at};
 });
 return NextResponse.json({repairs},{headers:{'Cache-Control':'no-store'}});
}
