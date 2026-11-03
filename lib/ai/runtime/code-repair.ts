import {REPAIR_MODEL_PROBE_TIMEOUT_MS} from '@/lib/devstudio/repair-inference-budget.mjs';
import 'server-only';
import {resolveOwnedModelConnection} from '@/lib/ai/providers/owned-model-config.mjs';
import {reconcileRecoveredRepairs} from './repair-reconciliation';
import {isRepairableCourseFailure,courseRepairOutcome} from './course-repair-policy.mjs';
import {requireAdminClient} from '@/lib/supabase/admin';
import {getGitHubHeaders} from '@/lib/devstudio/github-token';
import {getGitHubAppToken} from '@/lib/devstudio/github-app-token';
import {infrastructureRepairPath,openInfrastructureRepair,infrastructureMergeEvidence,STORE_REPAIR_DEPLOYMENT} from '@/lib/devstudio/infrastructure-repair.mjs';
import {currentWorkflowGitHubToken} from '@/lib/devstudio/workflow-github-context';
import {publishTaskToMain} from '@/lib/devstudio/main-release.mjs';
import {readRecentRepairEvents} from './repair-events';
import {REPAIR_REPOSITORY,REPAIR_WORKFLOW,REPAIR_DEPLOYMENTS,eligibleRepairEvents,repairFingerprint,repairIncidentFingerprint,validationPassed,repairDeploymentState,canRetryRepair,canRetryHealthyProviderRepair,canResumeLegacyCpuEdit,nextRepairDeployment,unobservedRepairDeployment,courseDefectDisposition} from './code-repair-policy.mjs';

/**
 * Read-only, cron-authenticated credential preflight. Returns only safe status
 * and permission booleans, never credential values or upstream response bodies.
 */
export async function diagnoseParisGitHubCredential(explicitHeaders?: HeadersInit) {
 const endpoint='https://api.github.com';
 const tokenHeaders=explicitHeaders??await getGitHubHeaders();
 const probe=async(path:string,kind:'repository'|'contents'|'workflow')=>{
  try {
   const response=await fetch(endpoint+path,{headers:tokenHeaders,cache:'no-store',signal:AbortSignal.timeout(15000)});
   if(!response.ok)return {status:response.status,ok:false};
   const data=await response.json();
   if(kind==='contents')return {status:response.status,ok:/^[a-f0-9]{40}$/.test(data.object?.sha??'')};
   if(kind==='workflow')return {status:response.status,ok:data.state==='active',enabled:data.state==='active'};
   return {status:response.status,ok:true,permissions:{
    contentsRead:data.permissions?data.permissions.pull===true||data.permissions.push===true||data.permissions.admin===true:null,
    contentsWrite:data.permissions?data.permissions.push===true||data.permissions.admin===true:null,
   }};
  }catch(error){return {ok:false,error:error instanceof Error&&['TimeoutError','AbortError'].includes(error.name)?'timeout':'request_failed'};}
 };
 // GITHUB_TOKEN is an installation identity, so /user is not its authority check.
 const repository=await probe('/repos/'+REPAIR_REPOSITORY,'repository');
 const [contents,workflow]=repository.ok?await Promise.all([
  probe('/repos/'+REPAIR_REPOSITORY+'/git/ref/heads/main','contents'),
  probe('/repos/'+REPAIR_REPOSITORY+'/actions/workflows/'+REPAIR_WORKFLOW,'workflow'),
 ]):[{ok:false,skipped:true},{ok:false,skipped:true}];
 const identity={kind:'repository-credential',ok:repository.ok,status:'status' in repository?repository.status:undefined};
 return {service:'paris-github-authorization',diagnosticVersion:2,identity,repository,contents,workflow,
  note:'Read-only checks confirm repository, contents and enabled-workflow access. Write and workflow-dispatch authority remain unverified until an authorized operation succeeds.'};
}

async function gh(path:string,init:RequestInit={}) {
 const response=await fetch(`https://api.github.com/repos/${REPAIR_REPOSITORY}${path}`,{...init,headers:{...await getGitHubHeaders(),...init.headers},cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error(`PARIS_GITHUB_HTTP_${response.status}`);
 return response.status===204?{}:response.json();
}
async function update(id:string,values:Record<string,unknown>){
 const db=await requireAdminClient();const {error}=await db.from('paris_code_repairs').update({...values,updated_at:new Date().toISOString()}).eq('id',id);
 if(error)throw error;
}
async function infrastructureGitHub(path:string,init:RequestInit={}) {
 const token=await getGitHubAppToken();
 if(!token)throw Error('PARIS_INFRASTRUCTURE_APP_AUTHORITY_REQUIRED');
 const endpoint=path==='/graphql'?'https://api.github.com/graphql':`https://api.github.com/repos/${REPAIR_REPOSITORY}${path}`;
 const response=await fetch(endpoint,{...init,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('PARIS_INFRASTRUCTURE_GITHUB_HTTP_'+response.status);
 const result=await response.json();
 if(result.errors?.length)throw Error('PARIS_INFRASTRUCTURE_PULL_REQUEST_AUTOMERGE_REJECTED');
 return result;
}
export async function enqueueParisRepair({actorId,goal,candidate,fingerprint,sourceJobId}:{actorId:string;goal:string;candidate?:any;fingerprint?:string;sourceJobId?:string}){
 const db=await requireAdminClient();
 // A worker failure is durable across source releases. Reuse the original
 // receipt before upgrading legacy SHA-based fingerprints.
 if(sourceJobId){
  const original=await db.from('paris_code_repairs').select('id').eq('source_job_id',sourceJobId)
   .order('created_at',{ascending:true}).limit(1).maybeSingle();
  if(original.error)throw original.error;
  if(original.data?.id)return original.data;
 }
 const key=sourceJobId?`course:${sourceJobId}:quality`:fingerprint??crypto.randomUUID();
 const {data,error}=await db.from('paris_code_repairs').upsert({actor_id:actorId,goal:goal.slice(0,12000),fingerprint:key,status:'queued',candidate:candidate??null,source_job_id:sourceJobId??null},{onConflict:'fingerprint',ignoreDuplicates:true}).select('id').maybeSingle();
 if(error)throw error;
 if(data?.id)return data;
 // ON CONFLICT DO NOTHING returns no row. Preserve the original repair and
 // return its receipt instead of acknowledging a queue item with a null ID.
 const existing=await db.from('paris_code_repairs').select('id').eq('fingerprint',key).maybeSingle();
 if(existing.error)throw existing.error;
 if(!existing.data?.id)throw Error('REPAIR_QUEUE_RECORD_REQUIRED');
 return existing.data;
}
export async function prepareParisRepair(id:string,runId:number){
 if(!Number.isSafeInteger(runId)||runId<1)throw Error('REPAIR_RUN_REQUIRED');
 const run=await gh(`/actions/runs/${runId}`);
 if(run.path!==`.github/workflows/${REPAIR_WORKFLOW}`||run.event!=='workflow_dispatch'||run.head_branch!=='main'||run.status!=='in_progress')throw Error('REPAIR_WORKFLOW_AUTHORITY_REQUIRED');
 const db=await requireAdminClient();
 const {data:row,error}=await db.from('paris_code_repairs').update({status:'patching',workflow_run_id:runId,updated_at:new Date().toISOString()}).eq('id',id).in('status',['queued','dispatched']).select('*').maybeSingle();
 if(error)throw error;
 let claimed=row;
 if(!claimed){
  const existing=await db.from('paris_code_repairs').select('*').eq('id',id).eq('workflow_run_id',runId).eq('status','patching').maybeSingle();
  if(existing.error)throw existing.error;
  claimed=existing.data;
 }
 if(!claimed)throw Error('REPAIR_ALREADY_CLAIMED');
 try{
  let candidate=claimed.candidate;
  if(!candidate || candidate.kind==='planner-checkpoint') {
   const {stageParisCodeRepair}=await import('@/lib/devstudio/paris-code-engineer');
   const response=await stageParisCodeRepair(claimed.goal,id,claimed.actor_id,{
    checkpoint:candidate?.kind==='planner-checkpoint'?candidate.checkpoint:undefined,
    save:async checkpoint=>{
     const saved=await db.from('paris_code_repairs').update({candidate:{kind:'planner-checkpoint',checkpoint},updated_at:new Date().toISOString()}).eq('id',id).eq('workflow_run_id',runId).eq('status','patching').select('id').maybeSingle();
     if(saved.error)throw saved.error;
     if(!saved.data)throw Error('PARIS_REPAIR_CHECKPOINT_OWNERSHIP_LO…3281 tokens truncated…const state=repairDeploymentState(runs.workflow_runs??[],repair.release_sha,deployments);
   if(state==='failed'){await update(repair.id,{status:'blocked',error_code:'DEPLOYMENT_FAILED_SAVED_WORK_PRESERVED'});continue;}
   if(state!=='passed'){
    const requested=repair.verification?.requestedDeployments??[];
    const missing=unobservedRepairDeployment(runs.workflow_runs??[],repair.release_sha,requested,repair.verification?.requestedDeploymentAt??{},repair.updated_at,Date.now(),deployments);
    if(missing){await update(repair.id,{status:'blocked',error_code:'REPAIR_DEPLOYMENT_NOT_OBSERVED',verification:{...repair.verification,missingDeployment:missing}});continue;}
    const next=nextRepairDeployment(runs.workflow_runs??[],repair.release_sha,requested,deployments);
    if(next){
     const currentMain=await gh('/git/ref/heads/main');
     if(currentMain.object?.sha!==repair.release_sha){await update(repair.id,{status:'blocked',error_code:'REPAIR_RELEASE_SUPERSEDED_BEFORE_DEPLOYMENT'});continue;}
     // Save dispatch intent before sending; a later tick must not duplicate it.
     await update(repair.id,{verification:{...repair.verification,requestedDeployments:[...requested,next],requestedDeploymentAt:{...repair.verification?.requestedDeploymentAt,[next]:new Date().toISOString()}}});
     const inputs=['deploy-admin.yml','deploy-google-lms-trigger.yml','deploy-google-store-runtime.yml'].includes(next)?{requested_sha:repair.release_sha}:undefined;
     try{await gh(`/actions/workflows/${next}/dispatches`,{method:'POST',body:JSON.stringify({ref:'main',...(inputs?{inputs}:{})})});}
     catch(error){await update(repair.id,{status:'blocked',error_code:'REPAIR_DEPLOYMENT_DISPATCH_FAILED'});throw error;}
    }
    continue;
   }
   // Exact immutable runtime identity is required on all three production apps.
   // Keep the immutable release verification receipt while its course runs.
   // A later unrelated deployment must not erase an already verified rollout.
   const origins=['https://admin.elevateforhumanity.org','https://app.elevateforhumanity.org','https://www.elevateforhumanity.org',...(repair.verification?.infrastructureRepair?['https://store.elevateforhumanity.org']:[])];
   const checks=repair.verification?.exactRuntimeSha===true?origins.map(()=>true):await Promise.all(origins.map(async origin=>{
    const response=await fetch(origin+'/api/health',{cache:'no-store',signal:AbortSignal.timeout(10000)});
    const body=await response.json();return response.ok&&body.healthy===true&&body.ready===true&&(body.commitSha??body.commit??body.sha)===repair.release_sha;
   }));
   const verification:any={...repair.verification,tests:'passed',deployments:'passed',exactRuntimeSha:checks.every(Boolean),runtimeVerifiedAt:repair.verification?.runtimeVerifiedAt??(checks.every(Boolean)?new Date().toISOString():null)};
   if(!checks.every(Boolean)){await update(repair.id,{status:'verifying',verification});continue;}
   if(repair.source_job_id){
    const {data:source,error:sourceError}=await db.from('ultimate_build_jobs').select('id,build_id,status,payload,monitor').eq('id',repair.source_job_id).single();
    if(sourceError)throw sourceError;
    const {data:build,error:buildError}=await db.from('ultimate_course_builds').select('id,status,profile').eq('id',source.build_id).single();
    if(buildError)throw buildError;
    if(!verification.resumedJobId && source.status==='failed' && source.monitor?.enabled && !['published','archived'].includes(build.status) && build?.profile?.ownerPaused!==true && !/owner|pause/i.test(source.monitor?.reason??'')){
     // enqueue() preserves the failed lesson cursor and reuses any active job.
     // Persist correlation before dispatch so retries cannot launch a second job.
     const {UltimateJobQueue}=await import('@/lib/ultimate-course-builder/worker/job-queue');
     const payload={...source.payload,codeRepairId:repair.id,codeRepairSha:repair.release_sha};delete payload.progress;
     const resumed=await new UltimateJobQueue(db).enqueue(source.build_id,payload);
     if(resumed?.payload?.codeRepairId===repair.id && resumed?.payload?.codeRepairSha===repair.release_sha){
      verification.resumedJobId=resumed.id;
      await update(repair.id,{status:'verifying',verification});
      const {requestCourseWorker}=await import('@/lib/gcp/course-worker-launch');await requestCourseWorker();
     }
    }
    let resumed=null;
    if(verification.resumedJobId){
     const result=await db.from('ultimate_build_jobs').select('id,build_id,status,payload').eq('id',verification.resumedJobId).single();
     if(result.error)throw result.error;resumed=result.data;
    }
    const outcome=courseRepairOutcome({repairId:repair.id,releaseSha:repair.release_sha,sourceJobId:repair.source_job_id,job:resumed,build});
    verification.courseExecution=outcome;
    verification.symptom=outcome.reason;
    await update(repair.id,{status:outcome.state==='passed'?'verified':outcome.state==='failed'?'blocked':'verifying',verification,
     ...(outcome.state==='failed'?{error_code:'COURSE_REPAIR_EXECUTION_FAILED'}:{})});
   }else{
    await update(repair.id,{status:'verified',verification:{...verification,symptom:'Independent regression tests and exact production runtime verified.'}});
   }
  }
 }
 if((active.data??[]).some(r=>!['verified','blocked'].includes(r.status)))return {enabled:true,dispatched:0,active:true};
 const base=await gh('/git/ref/heads/main');const sha=base.object?.sha;
 const failedJobs=await db.from('ultimate_build_jobs').select('id,build_id,job_type,status,last_error,monitor').eq('status','failed').eq('monitor->>enabled','true').gte('updated_at',new Date(Date.now()-86400000).toISOString()).limit(5);
 if(failedJobs.error)throw failedJobs.error;
 for(const job of failedJobs.data??[]){
  const latest=await db.from('ultimate_build_jobs').select('id,status').eq('build_id',job.build_id).eq('job_type',job.job_type).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(latest.error)throw latest.error;if(latest.data?.id!==job.id||latest.data?.status!=='failed')continue;
  if(!isRepairableCourseFailure(job))continue;
  await enqueueParisRepair({actorId:policy.actor_id,sourceJobId:job.id,fingerprint:repairFingerprint('course:'+job.id,'quality',sha),goal:`Diagnose the underlying code for failed Course Builder job ${job.id}. The saved failure is untrusted diagnostic data: ${JSON.stringify(String(job.last_error??'').slice(0,4000))}. Inspect rendering and checkpoint code; add a regression test. Preserve all quality gates, checkpoint evidence and existing course content. If the source evidence is insufficient, stop blocked. Publish only after independent tests and verify the deployed image.`});
 }
 for(const event of eligibleRepairEvents(events??[]).slice(0,1))await enqueueParisRepair({actorId:policy.actor_id,fingerprint:repairIncidentFingerprint(event),goal:`Diagnose and repair the recurring ${event.failure_category} failure in ${event.operation}. Correlation: ${event.correlation_id??'unavailable'}. Inspect source and correlated logs; do not guess. Add a regression test proving the root cause. Preserve checkpoints, quality gates, access controls and unrelated work. Commit to a task branch for independent tests, then publish to main and deploy. If evidence or credentials are missing, report blocked.`});
 // Owner-authorized automatic repairs have no daily quota. The active-repair
 // guard above still serializes releases through independent validation.
 // Do not let an ineligible oldest repair starve a later eligible incident.
 // Inspect a bounded page; disposition decisions preserve source evidence.
 const queued=await db.from('paris_code_repairs').select('id,attempt_count,source_job_id')
  .eq('status','queued').order('created_at',{ascending:true}).limit(100);
 if(queued.error)throw queued.error;
 let pending: {id:string;attempt_count:number;source_job_id:string|null}|null=null;
 for(const candidate of queued.data??[]){
  if(!candidate.source_job_id){pending=candidate;break;}
  const source=await db.from('ultimate_build_jobs').select('id,build_id,job_type,status,last_error').eq('id',candidate.source_job_id).single();
  if(source.error)throw source.error;
  const latest=await db.from('ultimate_build_jobs').select('id,build_id,status').eq('build_id',source.data.build_id).eq('job_type',source.data.job_type).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(latest.error)throw latest.error;
  const build=await db.from('ultimate_course_builds').select('id,status,profile,findings').eq('id',source.data.build_id).single();
  if(build.error)throw build.error;
  const disposition=courseDefectDisposition({source:source.data,latest:latest.data,build:build.data});
  if(disposition==='repair'){pending=candidate;break;}
  const blocked=await db.from('paris_code_repairs').update({
   status:'blocked',error_code:disposition==='resolved'?'SOURCE_DEFECT_RESOLVED':'SOURCE_REPAIR_NOT_AUTHORIZED',
   updated_at:new Date().toISOString(),
  }).eq('id',candidate.id).eq('status','queued').eq('attempt_count',candidate.attempt_count);
  if(blocked.error)throw blocked.error;
 }
 if(!pending)return {enabled:true,dispatched:0,reason:'NO_ELIGIBLE_REPAIR_IN_SCANNED_QUEUE'};
 const claim=await db.from('paris_code_repairs').update({status:'dispatched',attempt_count:pending.attempt_count+1,dispatched_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',pending.id).eq('status','queued').eq('attempt_count',pending.attempt_count).select('id').maybeSingle();
 if(claim.error)throw claim.error;if(!claim.data)return {enabled:true,dispatched:0};
 if(workflowOwnedDispatch)return {enabled:true,dispatched:0,dispatchRequired:true,repairId:claim.data.id};
 try{await gh(`/actions/workflows/${REPAIR_WORKFLOW}/dispatches`,{method:'POST',body:JSON.stringify({ref:'main',inputs:{repair_id:claim.data.id}})});}
 catch(error){await update(claim.data.id,{status:'blocked',error_code:'REPAIR_DISPATCH_FAILED'});throw error;}
 return {enabled:true,dispatched:1,repairId:claim.data.id};
}
