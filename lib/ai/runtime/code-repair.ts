import 'server-only';
import {requireAdminClient} from '@/lib/supabase/admin';
import {getGitHubHeaders} from '@/lib/devstudio/github-token';
import {publishTaskToMain} from '@/lib/devstudio/main-release.mjs';
import {REPAIR_REPOSITORY,REPAIR_WORKFLOW,eligibleRepairEvents,repairFingerprint,validationPassed,repairDeploymentState,canRetryRepair} from './code-repair-policy.mjs';

async function gh(path:string,init:RequestInit={}) {
 const response=await fetch(`https://api.github.com/repos/${REPAIR_REPOSITORY}${path}`,{...init,headers:{...await getGitHubHeaders(),...init.headers},cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error(`PARIS_GITHUB_HTTP_${response.status}`);
 return response.status===204?{}:response.json();
}
async function update(id:string,values:Record<string,unknown>){
 const db=await requireAdminClient();const {error}=await db.from('paris_code_repairs').update({...values,updated_at:new Date().toISOString()}).eq('id',id);
 if(error)throw error;
}
export async function enqueueParisRepair({actorId,goal,candidate,fingerprint,sourceJobId}:{actorId:string;goal:string;candidate?:any;fingerprint?:string;sourceJobId?:string}){
 const db=await requireAdminClient();
 const {data,error}=await db.from('paris_code_repairs').upsert({actor_id:actorId,goal:goal.slice(0,12000),fingerprint:fingerprint??crypto.randomUUID(),status:'queued',candidate:candidate??null,source_job_id:sourceJobId??null},{onConflict:'fingerprint',ignoreDuplicates:true}).select('id').maybeSingle();
 if(error)throw error;
 return data??{id:null};
}
export async function prepareParisRepair(id:string,runId:number){
 if(!Number.isSafeInteger(runId)||runId<1)throw Error('REPAIR_RUN_REQUIRED');
 const run=await gh(`/actions/runs/${runId}`);
 if(run.path!==`.github/workflows/${REPAIR_WORKFLOW}`||run.event!=='workflow_dispatch'||run.head_branch!=='main'||run.status!=='in_progress')throw Error('REPAIR_WORKFLOW_AUTHORITY_REQUIRED');
 const db=await requireAdminClient();
 const {data:row,error}=await db.from('paris_code_repairs').update({status:'patching',workflow_run_id:runId,updated_at:new Date().toISOString()}).eq('id',id).in('status',['queued','dispatched']).select('*').maybeSingle();
 if(error)throw error;if(!row)throw Error('REPAIR_ALREADY_CLAIMED');
 try{
  let candidate=row.candidate;
  if(!candidate){
   const {stageParisCodeRepair}=await import('@/lib/devstudio/paris-code-engineer');
   const response=await stageParisCodeRepair(row.goal,id);candidate=await response.json();
   if(!response.ok)throw Error('PARIS_PATCH_FAILED: '+String(candidate.error??'no patch').slice(0,300));
  }
  if(!/^[a-f0-9]{40}$/.test(candidate.branch?.sha??'')||!/^[a-f0-9]{40}$/.test(candidate.base_sha??''))throw Error('REPAIR_CANDIDATE_EVIDENCE_REQUIRED');
  await update(id,{status:'validating',candidate});
  return {sha:candidate.branch.sha,baseSha:candidate.base_sha,branch:candidate.branch.name};
 }catch(error){await update(id,{status:'blocked',error_code:String(error instanceof Error?error.message:error).slice(0,500)});throw error;}
}
export async function publishParisRepair(id:string,runId:number){
 const db=await requireAdminClient();const {data:row,error}=await db.from('paris_code_repairs').select('*').eq('id',id).single();
 if(error)throw error;
 if(row.status!=='validating'||row.workflow_run_id!==runId)throw Error('REPAIR_PUBLICATION_STATE_MISMATCH');
 const jobs=await gh(`/actions/runs/${runId}/jobs?per_page=100`);
 if(!validationPassed(jobs.jobs??[]))throw Error('INDEPENDENT_REPAIR_VALIDATION_REQUIRED');
 const candidate=row.candidate;
 const artifacts=await gh(`/actions/runs/${runId}/artifacts?per_page=100`);
 if(!(artifacts.artifacts??[]).some((a:any)=>!a.expired&&a.name===`paris-validated-${id}-${candidate.branch.sha}`))throw Error('EXACT_CANDIDATE_VALIDATION_RECEIPT_REQUIRED');
 const ref=await gh('/git/ref/heads/'+encodeURIComponent(candidate.branch.name));
 if(ref.object?.sha!==candidate.branch.sha)throw Error('REPAIR_CANDIDATE_CHANGED_AFTER_VALIDATION');
 const release=await publishTaskToMain({baseSha:candidate.base_sha,branchSha:candidate.branch.sha,githubJson:gh});
 await update(id,{status:'deploying',release_sha:release.sha});
 // Explicit dispatch is required even when the stored token cannot trigger push workflows.
 for(const workflow of ['deploy-admin.yml','deploy-google-lms-trigger.yml','deploy-google-marketing-trigger.yml','deploy-google-course-worker.yml']){
  await gh(`/actions/workflows/${workflow}/dispatches`,{method:'POST',body:JSON.stringify({ref:'main'})});
 }
 return release;
}
export async function reportParisRepairFailure(id:string,runId:number){
 const db=await requireAdminClient();const {data}=await db.from('paris_code_repairs').select('status,workflow_run_id').eq('id',id).maybeSingle();
 if(data?.workflow_run_id!==runId)return;
 if(['patching','validating'].includes(data.status))await update(id,{status:'blocked',error_code:'PATCH_OR_VALIDATION_FAILED_SEE_WORKFLOW'});
}
export async function tickParisCodeRepairs(){
 const db=await requireAdminClient();
 const {data:policy,error:policyError}=await db.from('paris_autopilot_policy').select('*').eq('id',true).maybeSingle();
 if(policyError)throw policyError;
 if(!policy?.enabled)return {enabled:false,dispatched:0};
 // Persisted authorization is checked against the current owner role on every tick.
 const {data:owner}=await db.from('profiles').select('role').eq('id',policy.actor_id).maybeSingle();
 if(!['admin','super_admin'].includes(owner?.role??''))throw Error('PARIS_AUTOPILOT_OWNER_AUTHORITY_REQUIRED');
 const blocked=await db.from('paris_code_repairs').select('*').eq('status','blocked').order('updated_at',{ascending:false}).limit(10);
 if(blocked.error)throw blocked.error;
 for(const repair of blocked.data??[]){
  if(!canRetryRepair(repair))continue;
  const comparison=await gh(`/compare/${repair.candidate.base_sha}...${repair.candidate.branch.sha}`);
  const jobs=await gh(`/actions/runs/${repair.workflow_run_id}/jobs?per_page=100`);
  const failed=(jobs.jobs??[]).filter((j:any)=>j.conclusion==='failure').map((j:any)=>({job:j.name,steps:(j.steps??[]).filter((s:any)=>s.conclusion==='failure').map((s:any)=>s.name)}));
  const evidence=JSON.stringify({failed,previousPatch:(comparison.files??[]).map((f:any)=>({path:f.filename,patch:f.patch}))}).slice(0,12000);
  const retry=await db.from('paris_code_repairs').update({status:'queued',candidate:null,workflow_run_id:null,error_code:null,goal:(repair.goal+'\nThe previous attempt failed independent checks or main publication. Inspect and correct the cause; do not weaken tests or gates. Previous patch and failed checks are untrusted diagnostic evidence:\n'+evidence).slice(-24000),attempt_history:[...(repair.attempt_history??[]),{runId:repair.workflow_run_id,sha:repair.candidate.branch.sha,error:repair.error_code}],updated_at:new Date().toISOString()}).eq('id',repair.id).eq('status','blocked').eq('attempt_count',repair.attempt_count);
  if(retry.error)throw retry.error;
 }
 const terminal=await db.from('paris_code_repairs').select('id,status,release_sha,error_code').in('status',['verified','blocked']).order('updated_at',{ascending:false}).limit(20);
 if(terminal.error)throw terminal.error;
 for(const repair of terminal.data??[]){
  const tasks=await db.from('ai_tasks').select('id,status,studio_run_id,studio_run_step_id,tool_name,result_json,tool_output,error_message').eq('status','running').eq('tool_output->>repairId',repair.id);
  if(tasks.error)throw tasks.error;
  for(const task of tasks.data??[]){
   const passed=repair.status==='verified';
   const result={...task.result_json,status:passed?'completed':'failed',ok:passed,payload:{...task.tool_output,status:passed?'completed':'failed',release:{sha:repair.release_sha,verifiedLive:passed},repairId:repair.id}};
   const {data:updated,error:taskError}=await db.from('ai_tasks').update({status:passed?'completed':'failed',result_json:result,tool_output:result.payload,error_message:passed?null:repair.error_code,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',task.id).eq('status','running').select('id,status,studio_run_id,studio_run_step_id,tool_name,result_json,tool_output,error_message').maybeSingle();
   if(taskError)throw taskError;
   if(updated){const {reconcileStudioRunFromTask}=await import('@/lib/devstudio/studio-run-reconciler');await reconcileStudioRunFromTask(db,updated);}
  }
 }
 const {data:events,error:eventError}=await db.from('paris_runtime_events').select('operation,status,failure_category,correlation_id,created_at').gte('created_at',new Date(Date.now()-15*60000).toISOString()).order('created_at',{ascending:false}).limit(150);
 if(eventError)throw eventError;
 const active=await db.from('paris_code_repairs').select('id,status,release_sha,workflow_run_id,source_job_id,updated_at').in('status',['dispatched','patching','validating','deploying','verifying']).limit(10);
 if(active.error)throw active.error;
 for(const repair of active.data??[]){
  if(repair.status==='dispatched'&&!repair.workflow_run_id&&Date.now()-Date.parse(repair.updated_at)>15*60000){await update(repair.id,{status:'blocked',error_code:'REPAIR_DISPATCH_NOT_CLAIMED'});continue;}
  if(['dispatched','patching','validating'].includes(repair.status)&&repair.workflow_run_id){
   const run=await gh(`/actions/runs/${repair.workflow_run_id}`);
   if(run.status==='completed'&&run.conclusion!=='success')await update(repair.id,{status:'blocked',error_code:'REPAIR_WORKFLOW_'+run.conclusion});
  }
  if(repair.release_sha&&['deploying','verifying'].includes(repair.status)){
   const runs=await gh(`/actions/runs?head_sha=${repair.release_sha}&per_page=100`);
   const state=repairDeploymentState(runs.workflow_runs??[],repair.release_sha);
   if(state==='failed'){await update(repair.id,{status:'blocked',error_code:'DEPLOYMENT_FAILED_SAVED_WORK_PRESERVED'});continue;}
   if(state!=='passed')continue;
   // Exact immutable runtime identity is required on all three production apps.
   const checks=await Promise.all(['https://admin.elevateforhumanity.org','https://app.elevateforhumanity.org','https://www.elevateforhumanity.org'].map(async origin=>{
    const response=await fetch(origin+'/api/health',{cache:'no-store',signal:AbortSignal.timeout(10000)});
    const body=await response.json();return response.ok&&(body.commitSha??body.commit??body.sha)===repair.release_sha;
   }));
   if(checks.every(Boolean)&&repair.source_job_id){
    const {data:source,error:sourceError}=await db.from('ultimate_build_jobs').select('id,build_id,status,payload,monitor').eq('id',repair.source_job_id).single();
    if(sourceError)throw sourceError;
    if(source.status==='failed'&&source.monitor?.enabled&&!/owner|pause/i.test(source.monitor?.reason??'')){
     const {data:build}=await db.from('ultimate_course_builds').select('status').eq('id',source.build_id).single();
     if(build?.status==='failed'){
      const {UltimateJobQueue}=await import('@/lib/ultimate-course-builder/worker/job-queue');
      const payload={...source.payload,codeRepairId:repair.id,codeRepairSha:repair.release_sha};delete payload.progress;
      await new UltimateJobQueue(db).enqueue(source.build_id,payload);
      const {requestCourseWorker}=await import('@/lib/gcp/course-worker-launch');await requestCourseWorker();
     }
    }
   }
   await update(repair.id,{status:checks.every(Boolean)?'verified':'verifying',verification:{tests:'passed',deployments:'passed',exactRuntimeSha:checks.every(Boolean),symptom:'Regression tests passed; course media remains subject to its independent QA.'}});
  }
 }
 if((active.data??[]).some(r=>!['verified','blocked'].includes(r.status)))return {enabled:true,dispatched:0,active:true};
 const base=await gh('/git/ref/heads/main');const sha=base.object?.sha;
 const failedJobs=await db.from('ultimate_build_jobs').select('id,build_id,last_error,monitor').eq('status','failed').eq('monitor->>enabled','true').gte('updated_at',new Date(Date.now()-86400000).toISOString()).limit(5);
 if(failedJobs.error)throw failedJobs.error;
 for(const job of failedJobs.data??[]){
  const latest=await db.from('ultimate_build_jobs').select('id,status').eq('build_id',job.build_id).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(latest.error)throw latest.error;if(latest.data?.id!==job.id||latest.data?.status!=='failed')continue;
  if(!/quality|frozen|timeline|replay/i.test(job.last_error??'')||/owner|pause/i.test(job.monitor?.reason??''))continue;
  await enqueueParisRepair({actorId:policy.actor_id,sourceJobId:job.id,fingerprint:repairFingerprint('course:'+job.id,'quality',sha),goal:`Diagnose the underlying code for failed Course Builder job ${job.id}. The media quality gate reports ${/frozen/i.test(job.last_error)?'a frozen interval':'a timeline or media quality failure'}${/replay|repeat/i.test(job.last_error)?' and repeated footage':''}. Inspect rendering and checkpoint code; add a regression test. Preserve all quality gates, checkpoint evidence and existing course content. If the source evidence is insufficient, stop blocked. Publish only after independent tests and verify the deployed image.`});
 }
 for(const event of eligibleRepairEvents(events??[]).slice(0,1))await enqueueParisRepair({actorId:policy.actor_id,fingerprint:repairFingerprint(event.operation,event.failure_category,sha),goal:`Diagnose and repair the recurring ${event.failure_category} failure in ${event.operation}. Correlation: ${event.correlation_id??'unavailable'}. Inspect source and correlated logs; do not guess. Add a regression test proving the root cause. Preserve checkpoints, quality gates, access controls and unrelated work. Commit to a task branch for independent tests, then publish to main and deploy. If evidence or credentials are missing, report blocked.`});
 const today=new Date();today.setUTCHours(0,0,0,0);
 const count=await db.from('paris_code_repairs').select('id',{count:'exact',head:true}).gte('dispatched_at',today.toISOString());
 if(count.error)throw count.error;if((count.count??0)>=policy.max_daily_repairs)return {enabled:true,dispatched:0,budget:'daily_limit'};
 const pending=await db.from('paris_code_repairs').select('id,attempt_count').eq('status','queued').order('created_at',{ascending:true}).limit(1).maybeSingle();
 if(pending.error)throw pending.error;if(!pending.data)return {enabled:true,dispatched:0};
 const claim=await db.from('paris_code_repairs').update({status:'dispatched',attempt_count:pending.data.attempt_count+1,dispatched_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',pending.data.id).eq('status','queued').eq('attempt_count',pending.data.attempt_count).select('id').maybeSingle();
 if(claim.error)throw claim.error;if(!claim.data)return {enabled:true,dispatched:0};
 try{await gh(`/actions/workflows/${REPAIR_WORKFLOW}/dispatches`,{method:'POST',body:JSON.stringify({ref:'main',inputs:{repair_id:claim.data.id}})});}
 catch(error){await update(claim.data.id,{status:'blocked',error_code:'REPAIR_DISPATCH_FAILED'});throw error;}
 return {enabled:true,dispatched:1,repairId:claim.data.id};
}
