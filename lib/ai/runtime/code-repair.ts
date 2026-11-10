import {loadCourseRepairEvidence} from '@/lib/devstudio/paris-course-repair-evidence.mjs';
import {parisRepairEngine} from '@/lib/devstudio/paris-openhands-repair.mjs';
import {applyOwnedParisRepairTransition} from './paris-owned-transition.mjs';
import {REPAIR_MODEL_PROBE_TIMEOUT_MS,repairRetryGoal} from '@/lib/devstudio/repair-inference-budget.mjs';
import {untouchedPlannerNeedsFreshGeneration} from '@/lib/devstudio/repair-checkpoint-recovery.mjs';
import {verifyParisRuntimeOrigins} from './paris-runtime-evidence.mjs';
import {failedCurrentReleases} from './deployment-repair-events.mjs';
import {recordFailedRepairWorkflow,repairDispatchValues} from './repair-workflow-reconciliation.mjs';
import 'server-only';
import {resolveOwnedModelConnection} from '@/lib/ai/providers/owned-model-config.mjs';
import {reconcileRecoveredRepairs} from './repair-reconciliation';
import {isRepairableCourseFailure,isCourseDependencyFailure,courseRepairOutcome} from './course-repair-policy.mjs';
import {requireAdminClient} from '@/lib/supabase/admin';
import {getGitHubHeaders} from '@/lib/devstudio/github-token';
import {getGitHubAppToken} from '@/lib/devstudio/github-app-token';
import {infrastructureRepairPath,openInfrastructureRepair,infrastructureMergeEvidence,STORE_REPAIR_DEPLOYMENT} from '@/lib/devstudio/infrastructure-repair.mjs';
import {currentWorkflowGitHubToken} from '@/lib/devstudio/workflow-github-context';
import {readRecentRepairEvents} from './repair-events';
import {REPAIR_REPOSITORY,REPAIR_WORKFLOW,REPAIR_DEPLOYMENTS,eligibleRepairEvents,repairFingerprint,repairIncidentFingerprint,validationPassed,repairDeploymentState,canRetryRepair,canRetryHealthyProviderRepair,canRetryVerifiedGithubAppRepair,canResumeLegacyCpuEdit,canResumeContextBudgetRepair,canResumePlannerInspectionRepair,canResumeZeroWritePlannerRepair,nextRepairDeployment,unobservedRepairDeployment,courseDefectDisposition,canDispatchParisRepairAttempt,isParisAttemptConstraintMismatch} from './code-repair-policy.mjs';

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
/** Transitions originating in a signed repair run must retain that run's
 * ownership and expected state. A stale worker can never overwrite a newer
 * validation, release, or verified recovery receipt. */
async function updateOwnedRepair(id:string,runId:number,expectedStatus:string,values:Record<string,unknown>,allowMissing=false){
 const db=await requireAdminClient();
 return applyOwnedParisRepairTransition(db,{id,runId,expectedStatus,values,allowMissing});
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
 const {data:row,error}=await db.from('paris_code_repairs').update({status:'patching',workflow_run_id:runId,updated_at:new Date().toISOString()}).eq('id',id).eq('status','dispatched').select('*').maybeSingle();
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
  if(untouchedPlannerNeedsFreshGeneration(claimed)) {
   const priorCheckpoint=candidate.checkpoint;
   if(typeof priorCheckpoint.branch!=='string'||!/^studio\/[a-z0-9-]+$/.test(priorCheckpoint.branch))
    throw Error('PARIS_REPAIR_CHECKPOINT_INVALID');
   const priorRef=await gh('/git/ref/heads/'+encodeURIComponent(priorCheckpoint.branch));
   if(priorRef.object?.sha!==priorCheckpoint.headSha)throw Error('PARIS_REPAIR_CHECKPOINT_BRANCH_CHANGED');
   // Only a newly admitted attempt may replan. Keep the complete previous
   // checkpoint in history; never reset attempts or discard committed work.
   const history=[...(claimed.attempt_history??[]),{event:'unmodified-planner-generation-rebased',
    at:new Date().toISOString(),attempt:claimed.attempt_count,checkpoint:candidate.checkpoint}];
   const archived=await db.from('paris_code_repairs').update({candidate:null,attempt_history:history,
    updated_at:new Date().toISOString()}).eq('id',id).eq('workflow_run_id',runId).eq('status','patching')
    .eq('attempt_count',claimed.attempt_count).select('id').maybeSingle();
   if(archived.error)throw archived.error;
   if(!archived.data)throw Error('PARIS_REPAIR_CHECKPOINT_OWNERSHIP_LOST');
   candidate=null;
  }
  if(!candidate || candidate.kind==='openhands-checkpoint') {
   const {stageParisOpenHandsRepair}=await import('@/lib/devstudio/paris-openhands-adapter');
   candidate=await stageParisOpenHandsRepair({repairId:id,actorId:claimed.actor_id,
    attempt:claimed.attempt_count,runId,goal:claimed.goal,
    checkpoint:candidate?.kind==='openhands-checkpoint'?candidate.checkpoint:undefined,
    save:async (checkpoint,expectedSequence)=>{
     const save=db.from('paris_code_repairs').update({candidate:{kind:'openhands-checkpoint',checkpoint},updated_at:new Date().toISOString()})
      .eq('id',id).eq('workflow_run_id',runId).eq('status','patching');
     // Signed requests may overlap after transport ambiguity. Only one may
     // advance this checkpoint or record intent to start the external task.
     const saved=await (expectedSequence===null?save.is('candidate',null):
      save.eq('candidate->checkpoint->>sequence',String(expectedSequence))).select('id').maybeSingle();
     if(saved.error)throw saved.error;
     if(!saved.data)throw Error('PARIS_REPAIR_CHECKPOINT_OWNERSHIP_LOST');
    },
   });
   if(candidate.pending===true)return candidate;
  }
  // Preserve in-flight internal checkpoints and their committed source. New
  // repairs above use the existing tracked OpenHands engineering dispatcher.
  if(candidate?.kind==='planner-checkpoint') {
   let sourceEvidence;
   if(claimed.source_job_id){
    const source=await db.from('ultimate_build_jobs').select('id,build_id,job_type,last_error,payload,monitor').eq('id',claimed.source_job_id).single();
    if(source.error)throw source.error;
    sourceEvidence=await loadCourseRepairEvidence(db,claimed.source_job_id,source.data);
   }
   const {stageParisCodeRepair}=await import('@/lib/devstudio/paris-code-engineer');
   const response=await stageParisCodeRepair(claimed.goal,id,claimed.actor_id,{
    checkpoint:candidate?.kind==='planner-checkpoint'?candidate.checkpoint:undefined,
    sourceEvidence,
    save:async checkpoint=>{
     const saved=await db.from('paris_code_repairs').update({candidate:{kind:'planner-checkpoint',checkpoint},updated_at:new Date().toISOString()}).eq('id',id).eq('workflow_run_id',runId).eq('status','patching').select('id').maybeSingle();
     if(saved.error)throw saved.error;
     if(!saved.data)throw Error('PARIS_REPAIR_CHECKPOINT_OWNERSHIP_LOST');
    },
   });candidate=await response.json();
   if(response.status===202 && candidate.pending===true)return {pending:true,turn:candidate.turn};
   if(!response.ok)throw Error('PARIS_PATCH_FAILED: '+String(candidate.error??'no patch').slice(0,300));
  }
  if(!/^[a-f0-9]{40}$/.test(candidate.branch?.sha??'')||!/^[a-f0-9]{40}$/.test(candidate.base_sha??''))throw Error('REPAIR_CANDIDATE_EVIDENCE_REQUIRED');
  await updateOwnedRepair(id,runId,'patching',{status:'validating',candidate});
  return {sha:candidate.branch.sha,baseSha:candidate.base_sha,branch:candidate.branch.name};
 }catch(error){
  // Failure reporting is conditional: an expired prepare must not clobber an
  // independent validation, protected release, or another owner's attempt.
  await updateOwnedRepair(id,runId,'patching',{
   status:'blocked',error_code:String(error instanceof Error?error.message:error).slice(0,500)
  },true);
  throw error;
 }
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
 const comparison=await gh(`/compare/${candidate.base_sha}...${candidate.branch.sha}`);
 if(!Array.isArray(comparison.files)||comparison.files.length>=300)throw Error('COMPLETE_REPAIR_FILE_INVENTORY_REQUIRED');
 const infrastructureRepair=comparison.files.some((file:any)=>infrastructureRepairPath(file.filename));
 const pullRequest=await openInfrastructureRepair({candidate,repairId:id,github:infrastructureGitHub,graphql:(body:any)=>infrastructureGitHub('/graphql',{method:'POST',body:JSON.stringify(body)})});
 await updateOwnedRepair(id,runId,'validating',{verification:{...row.verification,protectedMerge:true,infrastructureRepair,pullRequest}});
 return {status:'awaiting-protected-merge',pullRequest,verifiedLive:false};
}
/**
 * A signed monitor reports a rejected GitHub dispatch through a guarded
 * compare-and-swap. An ambiguous upstream result remains blocked: never
 * silently retry a request that GitHub might have accepted.
 */
export async function reportParisDispatchFailure(id:string) {
 const db=await requireAdminClient();
 const {data,error}=await db.from('paris_code_repairs')
  .update({status:'blocked',error_code:'REPAIR_DISPATCH_FAILED_UNCONFIRMED',updated_at:new Date().toISOString()})
  .eq('id',id).eq('status','dispatched').is('workflow_run_id',null)
  .select('id').maybeSingle();
 if(error)throw error;
 return {recorded:Boolean(data),retryAuthorized:false};
}

export async function reportParisRepairFailure(id:string,runId:number){
 const db=await requireAdminClient();const {data}=await db.from('paris_code_repairs').select('status,workflow_run_id').eq('id',id).maybeSingle();
 if(data?.workflow_run_id!==runId)return;
 if(['patching','validating'].includes(data.status))await updateOwnedRepair(id,runId,data.status,{status:'blocked',error_code:'PATCH_OR_VALIDATION_FAILED_SEE_WORKFLOW'},true);
}
export async function tickParisCodeRepairs({workflowOwnedDispatch=false}:{workflowOwnedDispatch?:boolean}={}){
 const db=await requireAdminClient();
 const {data:policy,error:policyError}=await db.from('paris_autopilot_policy').select('*').eq('id',true).maybeSingle();
 if(policyError)throw policyError;
 if(!policy?.enabled)return {enabled:false,dispatched:0};
 // Persisted authorization is checked against the current owner role on every tick.
 const {data:owner}=await db.from('profiles').select('role').eq('id',policy.actor_id).maybeSingle();
 if(!['admin','super_admin'].includes(owner?.role??''))throw Error('PARIS_AUTOPILOT_OWNER_AUTHORITY_REQUIRED');
 // Background runtime polls retain the queue; only the verified Actions request
 // may advance repairs and dispatch deployments with its scoped job credential.
 if(!workflowOwnedDispatch||!currentWorkflowGitHubToken())return {enabled:true,dispatched:0,awaitingWorkflow:true};
 const events=await readRecentRepairEvents(db);
 await reconcileRecoveredRepairs(db,events);
 const blocked=await db.from('paris_code_repairs').select('*').eq('status','blocked').order('updated_at',{ascending:false}).limit(2000);
 if(blocked.error)throw blocked.error;
 if(blocked.data?.length===2000)throw Error('PARIS_BLOCKED_REPAIR_SCAN_LIMIT');
 let recoveredProviderThisTick=false;
 let providerRecoveryHealth: boolean | undefined;
 let ownedProviderReadiness: {verified:boolean;status?:string} | undefined;
 let recoveredAppThisTick=false;
 let githubAppRecoveryHealth: boolean | undefined;
 const ownedTier=resolveOwnedModelConnection().tier;
 for(const repair of blocked.data??[]){
  // One post-fix replay for a source-free planner with an immutable zero-write
  // checkpoint. Do not reset attempts or override an existing source approval.
  if(!recoveredProviderThisTick && parisRepairEngine(repair.candidate)==='internal' && canResumeZeroWritePlannerRepair(repair)){
   const checkpoint=repair.candidate.checkpoint;
   const {probeOwnedModel}=await import('@/lib/ai/providers/owned-model-health.mjs');
   if(providerRecoveryHealth===undefined){
    const health=await probeOwnedModel({timeoutMs:REPAIR_MODEL_PROBE_TIMEOUT_MS}).catch(()=>({verified:false}));
    ownedProviderReadiness=health;
    const identity=health.verified?await diagnoseParisGitHubCredential().catch(()=>null):null;
    providerRecoveryHealth=Boolean(health.verified && identity?.repository?.ok &&
     identity?.contents?.ok && identity?.workflow?.ok);
   }
   if(!providerRecoveryHealth)continue;
   const ref=await gh('/git/ref/heads/'+encodeURIComponent(checkpoint.branch)).catch(()=>null);
   if(ref?.object?.sha!==checkpoint.headSha)continue;
   const updated=await db.from('paris_code_repairs').update({
    status:'queued',error_code:null,
    attempt_history:[...(repair.attempt_history??[]),{
     error:repair.error_code,at:repair.updated_at,retryReason:'zero-write-planner-v2',
     checkpointHeadSha:checkpoint.headSha
    }],
    verification:{...repair.verification,zeroWriteRecoveryPreflight:{
     ownedModelVerified:true,githubRepositoryRead:true,workflowEnabled:true,
     checkpointHeadSha:checkpoint.headSha,checkedAt:new Date().toISOString()
    }},
    updated_at:new Date().toISOString(),
   }).eq('id',repair.id).eq('status','blocked')
    .eq('attempt_count',2).eq('updated_at',repair.updated_at).select('id').maybeSingle();
   if(updated.error)throw updated.error;
   if(updated.data)recoveredProviderThisTick=true;
   continue;
  }
  if(canResumePlannerInspectionRepair(repair)){
   // A source-linked planner failure may receive exactly one additional
   // bounded planning attempt, but only while the exact source defect remains
   // failed on the current active, explicitly unpaused build. Never revive
   // published work, a currently leased worker or a superseded incident.
   if(repair.source_job_id){
    const source=await db.from('ultimate_build_jobs')
     .select('id,build_id,job_type,status,lease_owner,lease_expires_at')
     .eq('id',repair.source_job_id).maybeSingle();
    if(source.error)throw source.error;
    if(source.data?.status!=='failed' || source.data.lease_owner &&
       Date.parse(source.data.lease_expires_at??'')>Date.now())continue;
    const [build,latest]=await Promise.all([
     db.from('ultimate_course_builds').select('id,status,profile').eq('id',source.data.build_id).maybeSingle(),
     db.from('ultimate_build_jobs').select('id').eq('build_id',source.data.build_id)
      .eq('job_type',source.data.job_type).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    ]);
    if(build.error||latest.error)throw build.error??latest.error;
    if(build.data?.status!=='running' ||
       build.data?.profile?.ownerPaused!==false || latest.data?.id!==source.data.id)continue;
   }
   const now=new Date().toISOString();
   const restored=await db.from('paris_code_repairs').update({
    status:'queued',error_code:null,
    attempt_history:[...(repair.attempt_history??[]),{
     error:repair.error_code,at:repair.updated_at,retryReason:'planner-inspection-fix'
    }],
    updated_at:now,
   }).eq('id',repair.id).eq('status','blocked')
     .eq('attempt_count',repair.attempt_count).eq('updated_at',repair.updated_at)
     .select('id').maybeSingle();
   if(restored.error)throw restored.error;
   continue;
  }
  // Only a fresh, verified GitHub App identity may revive one historical
  // source-free auth failure. Do not retry a source-linked job, exhausted
  // attempt, or a repair that already has a release candidate.
  if(!recoveredAppThisTick && canRetryVerifiedGithubAppRepair(repair)){
   if(githubAppRecoveryHealth===undefined){
    const token=await getGitHubAppToken().catch(()=>null);
    const diagnostic=token?await diagnoseParisGitHubCredential({
     Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json'
    }).catch(()=>null):null;
    githubAppRecoveryHealth=Boolean(token && diagnostic?.repository?.ok &&
     diagnostic?.contents?.ok && diagnostic?.workflow?.ok);
   }
   if(githubAppRecoveryHealth){
    const updated=await db.from('paris_code_repairs').update({
     status:'queued',error_code:null,
     attempt_history:[...(repair.attempt_history??[]),{
      error:repair.error_code,at:repair.updated_at,
      retryReason:'verified-github-app-recovery'
     }],
     verification:{...repair.verification,credentialRecoveryPreflight:{
      githubAppVerified:true,repositoryRead:true,workflowEnabled:true,
      checkedAt:new Date().toISOString()
     }},
     updated_at:new Date().toISOString(),
    }).eq('id',repair.id).eq('status','blocked')
      .eq('attempt_count',repair.attempt_count).eq('updated_at',repair.updated_at)
      .select('id').maybeSingle();
    if(updated.error)throw updated.error;
    if(updated.data)recoveredAppThisTick=true;
   }
   continue;
  }
  // Provider outages are infrastructure failures, not proof that a source
  // patch passed. A signed repair workflow may retry one historical, unlinked
  // timeout only when the owned model and scoped GitHub read identity recover.
  // Preserve the earlier attempt and do not reset any course job state.
  const legacyCpuEdit=canResumeLegacyCpuEdit(repair,events,ownedTier);
  const contextBudgetRecovery=canResumeContextBudgetRepair(repair);
  if(!recoveredProviderThisTick && parisRepairEngine(repair.candidate)==='internal' && (legacyCpuEdit || contextBudgetRecovery || canRetryHealthyProviderRepair(repair))){
   if(providerRecoveryHealth===undefined){
    const {probeOwnedModel}=await import('@/lib/ai/providers/owned-model-health.mjs');
    const health=await probeOwnedModel({timeoutMs:REPAIR_MODEL_PROBE_TIMEOUT_MS}).catch(()=>({verified:false}));
    ownedProviderReadiness=health;
    const identity=health.verified?await diagnoseParisGitHubCredential().catch(()=>null):null;
    providerRecoveryHealth=Boolean(health.verified&&identity?.repository?.ok&&identity?.contents?.ok&&identity?.workflow?.ok);
   }
   if(providerRecoveryHealth){
     if(repair.source_job_id){
      // A provider outage is not authorization to revive a paused, published,
      // superseded or already recovered lesson. Confirm the exact stage.
      const source=await db.from('ultimate_build_jobs')
       .select('id,build_id,job_type,status,last_error,monitor')
       .eq('id',repair.source_job_id).maybeSingle();
      if(source.error)throw source.error;
      if(!source.data || source.data.status!=='failed' || source.data.monitor?.enabled!==true)continue;
      const build=await db.from('ultimate_course_builds')
       .select('id,status,profile,findings').eq('id',source.data.build_id).maybeSingle();
      if(build.error)throw build.error;
      if(!build.data || !['running','queued','building'].includes(build.data.status)
       || build.data.profile?.ownerPaused===true)continue;
      const latest=await db.from('ultimate_build_jobs').select('id,build_id,status')
       .eq('build_id',source.data.build_id).eq('job_type',source.data.job_type)
       .order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(latest.error)throw latest.error;
      if(courseDefectDisposition({source:source.data,latest:latest.data,build:build.data})!=='repair')continue;
     }
     const updated=await db.from('paris_code_repairs').update({
      status:'queued',error_code:null,
      ...(contextBudgetRecovery?{goal:repairRetryGoal(repair.goal,'The CPU immutable-task context budget has been corrected. Inspect the original defect and retain all authority and independent checks.')} : {}),
      attempt_history:[...(repair.attempt_history??[]),{
       error:repair.error_code,at:repair.updated_at,retryReason:contextBudgetRecovery?'bounded-context-budget-recovery':legacyCpuEdit?'bounded-cpu-edit-recovery':'verified-owned-provider-recovery'
      }],
      verification:{...repair.verification,providerRecoveryPreflight:{
       ownedModelVerified:true,githubRepositoryRead:true,workflowEnabled:true,
       checkedAt:new Date().toISOString(),writeAuthorityVerified:false
      }},
      updated_at:new Date().toISOString(),
     }).eq('id',repair.id).eq('status','blocked').eq('attempt_count',repair.attempt_count)
       .eq('updated_at',repair.updated_at).select('id').maybeSingle();
     if(updated.error)throw updated.error;
     if(updated.data)recoveredProviderThisTick=true;
   }
   continue;
  }
  if(!canRetryRepair(repair))continue;
  if (!repair.candidate?.branch?.sha) {
   // A dispatch failure has no patch or workflow run. Retry only the bounded
   // dispatch, without inventing evidence or treating it as code validation.
   const retry=await db.from('paris_code_repairs').update({status:'queued',error_code:null,attempt_history:[...(repair.attempt_history??[]),{error:repair.error_code,at:repair.updated_at}],updated_at:new Date().toISOString()}).eq('id',repair.id).eq('status','blocked').eq('attempt_count',repair.attempt_count);
   if(retry.error)throw retry.error;
   continue;
  }
  const comparison=await gh(`/compare/${repair.candidate.base_sha}...${repair.candidate.branch.sha}`);
  const jobs=await gh(`/actions/runs/${repair.workflow_run_id}/jobs?per_page=100`);
  const failed=(jobs.jobs??[]).filter((j:any)=>j.conclusion==='failure').map((j:any)=>({job:j.name,steps:(j.steps??[]).filter((s:any)=>s.conclusion==='failure').map((s:any)=>s.name)}));
  const evidence=JSON.stringify({failed,previousPatch:(comparison.files??[]).map((f:any)=>({path:f.filename,patch:f.patch}))}).slice(0,12000);
  const retry=await db.from('paris_code_repairs').update({status:'queued',candidate:null,workflow_run_id:null,error_code:null,goal:repairRetryGoal(repair.goal,evidence),attempt_history:[...(repair.attempt_history??[]),{runId:repair.workflow_run_id,sha:repair.candidate.branch.sha,error:repair.error_code}],updated_at:new Date().toISOString()}).eq('id',repair.id).eq('status','blocked').eq('attempt_count',repair.attempt_count);
  if(retry.error)throw retry.error;
 }
 const terminal=await db.from('paris_code_repairs').select('id,status,release_sha,error_code').in('status',['verified','blocked']).order('updated_at',{ascending:false}).limit(2000);
 if(terminal.error)throw terminal.error;
 if(terminal.data?.length===2000)throw Error('PARIS_TERMINAL_REPAIR_SCAN_LIMIT');
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
  const {reconcileWorkflowRepairActions}=await import('@/lib/control-plane/workflow-repairs');
  await reconcileWorkflowRepairActions(db,repair);
 }
 const active=await db.from('paris_code_repairs').select('id,status,release_sha,workflow_run_id,source_job_id,verification,updated_at').in('status',['dispatched','patching','validating','deploying','verifying']).limit(10);
 if(active.error)throw active.error;
 for(const repair of active.data??[]){
  if(repair.status==='validating'&&repair.verification?.pullRequest){
   try{
    const pr=await gh('/pulls/'+repair.verification.pullRequest.number);
    const sha=infrastructureMergeEvidence(pr,repair.verification.pullRequest.headSha);
    if(!sha)continue;
    await update(repair.id,{status:'deploying',release_sha:sha,verification:{...repair.verification,requestedDeployments:[]}});
   }catch(error){await update(repair.id,{status:'blocked',error_code:String(error instanceof Error?error.message:error).slice(0,500)});}
   continue;
  }
  if(repair.status==='dispatched'&&!repair.workflow_run_id&&Date.now()-Date.parse(repair.updated_at)>15*60000){await update(repair.id,{status:'blocked',error_code:'REPAIR_DISPATCH_NOT_CLAIMED'});continue;}
  if(['dispatched','patching','validating'].includes(repair.status)&&repair.workflow_run_id){
   const run=await gh(`/actions/runs/${repair.workflow_run_id}`);
   await recordFailedRepairWorkflow(db,repair,run);
  }
  if(repair.release_sha&&['deploying','verifying'].includes(repair.status)){
   const targetSha=repair.verification?.releaseReconciliation?.state==='validated-newer-target' ? repair.verification.releaseReconciliation.currentMainSha : repair.release_sha;
   const deployments=repair.verification?.protectedMerge?[...REPAIR_DEPLOYMENTS,STORE_REPAIR_DEPLOYMENT]:REPAIR_DEPLOYMENTS;
   const runs=await gh(`/actions/runs?head_sha=${targetSha}&per_page=100`);
   const state=repairDeploymentState(runs.workflow_runs??[],targetSha,deployments);
   if(state==='failed'){await update(repair.id,{status:'blocked',error_code:'DEPLOYMENT_FAILED_SAVED_WORK_PRESERVED'});continue;}
   if(state!=='passed'){
    const deploymentIntent=repair.verification?.deploymentIntentBySha?.[targetSha];
    const requested=deploymentIntent?.requestedDeployments??(targetSha===repair.release_sha?repair.verification?.requestedDeployments??[]:[]);
    const requestedAt=deploymentIntent?.requestedDeploymentAt??(targetSha===repair.release_sha?repair.verification?.requestedDeploymentAt??{}:{});
    const missing=unobservedRepairDeployment(runs.workflow_runs??[],targetSha,requested,requestedAt,repair.updated_at,Date.now(),deployments);
    if(missing){await update(repair.id,{status:'blocked',error_code:'REPAIR_DEPLOYMENT_NOT_OBSERVED',verification:{...repair.verification,missingDeployment:missing}});continue;}
    const next=nextRepairDeployment(runs.workflow_runs??[],targetSha,requested,deployments);
    if(next){
     const currentMain=await gh('/git/ref/heads/main');
     if(currentMain.object?.sha!==targetSha){
      // A later main commit is not evidence that the repair disappeared.
      // Preserve the immutable release receipt and defer deployment until
      // ancestry and independent validation establish a safe new target.
      const currentSha=String(currentMain.object?.sha??'');
      const comparison=/^[a-f0-9]{40}$/.test(currentSha)
       ?await gh('/compare/'+repair.release_sha+'...'+currentSha).catch(()=>null):null;
      const ancestry=comparison?.status==='ahead'||comparison?.status==='identical';
       const candidateRuns=ancestry?await gh(`/actions/runs?head_sha=${currentSha}&per_page=100`):null;
       const candidateChecks=candidateRuns?.workflow_runs??[];
       const independentlyValidated=candidateChecks.some((run:any)=>run.head_sha===currentSha&&run.name==='CI'&&run.status==='completed'&&run.conclusion==='success')&&candidateChecks.some((run:any)=>run.head_sha===currentSha&&run.name==='Integrity Gate'&&run.status==='completed'&&run.conclusion==='success');
       const candidatePassed=ancestry&&independentlyValidated&&repairDeploymentState(candidateChecks,currentSha,deployments)==='passed';
      await update(repair.id,{status:'verifying',verification:{
       ...repair.verification,releaseReconciliation:{
        state:candidatePassed?'validated-newer-target':ancestry?'newer-main-needs-independent-validation':'release-not-ancestor-of-main',
        independentlyValidated,
        immutableReleaseSha:repair.release_sha,currentMainSha:currentSha,
        checkedAt:new Date().toISOString()
       }
      }});
      continue;
     }
     // Save dispatch intent before sending; a later tick must not duplicate it.
     await update(repair.id,{verification:{...repair.verification,deploymentIntentBySha:{...repair.verification?.deploymentIntentBySha,[targetSha]:{requestedDeployments:[...requested,next],requestedDeploymentAt:{...requestedAt,[next]:new Date().toISOString()}}}}});
     const inputs=['deploy-admin.yml','deploy-google-lms-trigger.yml','deploy-google-store-runtime.yml'].includes(next)?{requested_sha:targetSha}:undefined;
     try{await gh(`/actions/workflows/${next}/dispatches`,{method:'POST',body:JSON.stringify({ref:'main',...(inputs?{inputs}:{})})});}
     catch(error){await update(repair.id,{status:'blocked',error_code:'REPAIR_DEPLOYMENT_DISPATCH_FAILED'});throw error;}
    }
    continue;
   }
   // Exact immutable runtime identity is required on all three production apps.
   // Keep the immutable release verification receipt while its course runs.
   // A later unrelated deployment must not erase an already verified rollout.
   const origins=['https://admin.elevateforhumanity.org','https://app.elevateforhumanity.org','https://www.elevateforhumanity.org',...(repair.verification?.protectedMerge?['https://store.elevateforhumanity.org']:[])];
   // Never reuse a prior receipt to certify the current serving revision.
   // Failed/unreachable health probes are negative evidence, not success.
   const runtimeEvidence=await verifyParisRuntimeOrigins({origins,releaseSha:targetSha,protectedMerge:Boolean(repair.verification?.protectedMerge)});
   const verification:any={...repair.verification,tests:'passed',deployments:'passed',
    exactRuntimeSha:runtimeEvidence.passed,runtimeLastCheckedAt:runtimeEvidence.checkedAt,
    runtimeOrigins:runtimeEvidence.origins,
    runtimeVerifiedAt:runtimeEvidence.passed?runtimeEvidence.checkedAt:null};
   if(!runtimeEvidence.passed){await update(repair.id,{status:'verifying',verification});continue;}
   if(repair.source_job_id){
    const {data:source,error:sourceError}=await db.from('ultimate_build_jobs').select('*').eq('id',repair.source_job_id).single();
    if(sourceError)throw sourceError;
    const {data:build,error:buildError}=await db.from('ultimate_course_builds').select('id,course_id,status,profile').eq('id',source.build_id).single();
    if(buildError)throw buildError;
    const alreadyResumed=source.payload?.codeRepairId===repair.id && source.payload?.codeRepairSha===targetSha;
    if(!verification.resumedJobId && (source.status==='failed'||alreadyResumed) && source.monitor?.enabled && !['published','archived'].includes(build.status) && build?.profile?.ownerPaused!==true && !/owner|pause/i.test(source.monitor?.reason??'')){
     // enqueue() preserves the failed lesson cursor and reuses any active job.
     // Persist correlation before dispatch so retries cannot launch a second job.
     const {resumeRepairedJob}=await import('@/lib/ultimate-course-builder/worker/resume-repaired-job.mjs');
     const resumed=await resumeRepairedJob({db,source,repair:{...repair,verification},deploymentTargetSha:targetSha});
     if(resumed?.payload?.codeRepairId===repair.id && resumed?.payload?.codeRepairSha===targetSha){
      verification.resumedJobId=resumed.id;
      await update(repair.id,{status:'verifying',verification});
      const {requestCourseWorker}=await import('@/lib/gcp/course-worker-launch');await requestCourseWorker();
     }
    }
    let resumed=null;
    if(verification.resumedJobId){
     const result=await db.from('ultimate_build_jobs').select('id,build_id,status,payload,execution_generation').eq('id',verification.resumedJobId).single();
     if(result.error)throw result.error;resumed=result.data;
    }
    let lessonAcceptance;
    const competencyId=resumed?.payload?.autopilot?.competencyId;
    const canonicalId=build.profile?.canonicalLessonIds?.[competencyId];
    if(resumed?.status==='completed' && competencyId && canonicalId){
     const lesson=await db.from('course_lessons').select('status,is_published,video_status,video_url')
      .eq('id',canonicalId).eq('course_id',build.course_id).maybeSingle();
     if(lesson.error)throw lesson.error;
     const saved=await db.from('ultimate_lesson_builds').select('id').eq('build_id',build.id).eq('competency_id',competencyId).maybeSingle();
     if(saved.error)throw saved.error;
     const learner=saved.data?await db.from('ultimate_lesson_steps').select('state').eq('lesson_build_id',saved.data.id).eq('step','learner_runthrough').maybeSingle():{data:null,error:null};
     if(learner.error)throw learner.error;
     lessonAcceptance={published:lesson.data?.status==='published'&&lesson.data.is_published===true&&lesson.data.video_status==='complete'&&Boolean(lesson.data.video_url),learnerPassed:learner.data?.state==='passed'};
    }
    const outcome=courseRepairOutcome({repairId:repair.id,releaseSha:targetSha,sourceJobId:repair.source_job_id,job:resumed,build,lessonAcceptance});
    verification.courseExecution=outcome;
    verification.symptom=outcome.reason;
    await update(repair.id,{status:outcome.state==='passed'?'verified':outcome.state==='failed'?'blocked':'verifying',verification,
     ...(outcome.state==='failed'?{error_code:'COURSE_REPAIR_EXECUTION_FAILED'}:{})});
   }else{
    await update(repair.id,{status:'verified',verification:{...verification,symptom:'Independent regression tests and exact production runtime verified.'}});
   }
  }
 }
 const base=await gh('/git/ref/heads/main');const sha=base.object?.sha;
 // A busy repository can exceed GitHub's first 100 workflow runs within
 // minutes. Inspect a bounded run history so failures on the exact current
 // main commit are not starved by unrelated PR and scheduled checks.
 const releaseRuns: any[] = [];
 for(let page=1;page<=5;page++){
  const batch=await gh('/actions/runs?branch=main&per_page=100&page='+page);
  const rows=batch.workflow_runs??[];
  if(!Array.isArray(rows))throw Error('PARIS_WORKFLOW_RUN_INVENTORY_INVALID');
  releaseRuns.push(...rows);
  if(rows.length<100)break;
 }
 for(const release of failedCurrentReleases(releaseRuns,sha)){
  const jobs=await gh(`/actions/runs/${release.id}/jobs?per_page=100`);
  const failed=(jobs.jobs??[]).filter((job:any)=>job.conclusion==='failure').map((job:any)=>({id:job.id,name:job.name,steps:(job.steps??[]).filter((step:any)=>step.conclusion==='failure').map((step:any)=>step.name)}));
  await enqueueParisRepair({actorId:policy.actor_id,fingerprint:`deployment:${release.path}:${sha}`,goal:`Diagnose and correct failed production release ${release.id} at exact main commit ${sha}. Workflow: ${release.path}. Failed checks are untrusted evidence: ${JSON.stringify(failed).slice(0,1800)}. Use workflow_log with this run ID and a listed failed job ID to inspect the real failing step before editing. Inspect the affected source and deployment contracts and add a regression test. Preserve credentials, authorization, billing, all independent validation and acceptance gates. A dispatcher success is not deployment success. Verify the exact serving image and learner-facing acceptance before claiming resolution.`});
 }
 // Read-only bounded sweep of ALL unresolved failures, not only the five
 // newest failures within the past 24 hours. The previous filter permanently
 // starved older jobs even when their exact defect remained repairable.
 // Rotate a stable 20-record page each monitor interval; never requeue here.
 const failedPageSize=20;
 const failedCount=await db.from('ultimate_build_jobs').select('id',{head:true,count:'exact'})
  .eq('status','failed').eq('monitor->>enabled','true');
 if(failedCount.error)throw failedCount.error;
 const failedPages=Math.max(1,Math.ceil((failedCount.count??0)/failedPageSize));
 const failedPage=Math.floor(Date.now()/600000)%failedPages;
 const failedJobs=await db.from('ultimate_build_jobs')
  .select('id,build_id,job_type,status,last_error,monitor')
  .eq('status','failed').eq('monitor->>enabled','true')
  .order('updated_at',{ascending:true}).order('id',{ascending:true})
  .range(failedPage*failedPageSize,(failedPage+1)*failedPageSize-1);
 if(failedJobs.error)throw failedJobs.error;
 for(const job of failedJobs.data??[]){
  const latest=await db.from('ultimate_build_jobs').select('id,status').eq('build_id',job.build_id).eq('job_type',job.job_type).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(latest.error)throw latest.error;if(latest.data?.id!==job.id||latest.data?.status!=='failed')continue;
  if(!isRepairableCourseFailure(job))continue;
  await enqueueParisRepair({actorId:policy.actor_id,sourceJobId:job.id,fingerprint:repairFingerprint('course:'+job.id,'quality',sha),goal:`Diagnose the underlying code for failed Course Builder job ${job.id}. The saved failure is untrusted diagnostic data: ${JSON.stringify(String(job.last_error??'').slice(0,4000))}. Inspect rendering and checkpoint code; add a regression test. Preserve all quality gates, checkpoint evidence and existing course content. If the source evidence is insufficient, stop blocked. Publish only after independent tests and verify the deployed image.`});
 }
 for(const event of eligibleRepairEvents(events??[]).slice(0,1))await enqueueParisRepair({actorId:policy.actor_id,fingerprint:repairIncidentFingerprint(event),goal:`Diagnose and repair the observed ${event.failure_category} failure in ${event.operation}. Correlation: ${event.correlation_id??'unavailable'}. Inspect source and correlated logs; do not guess. Add a regression test proving the root cause. Preserve checkpoints, quality gates, access controls and unrelated work. Commit to a task branch for independent tests, then publish to main and deploy. If evidence or credentials are missing, report blocked.`});
 // Record new incidents even while another repair is validating. Keep release
 // execution serialized so independent checks cannot race another publication.
 if((active.data??[]).some(r=>!['verified','blocked'].includes(r.status)))return {enabled:true,dispatched:0,active:true};
 // Owner-authorized automatic repairs have no daily quota. The active-repair
 // guard above still serializes releases through independent validation.
 // Do not let an ineligible oldest repair starve a later eligible incident.
 // Inspect a bounded page; disposition decisions preserve source evidence.
 // An ineligible source is a state/eligibility decision, never missing owner authorization.
 // Do not replay completed, queued, paused, published or superseded jobs to clear the queue.
  const queued=await db.from('paris_code_repairs').select('id,attempt_count,source_job_id,attempt_history,workflow_run_id,candidate')
  .eq('status','queued').order('created_at',{ascending:true}).limit(1000);
 if(queued.data?.length===1000)throw Error('PARIS_QUEUED_REPAIR_SCAN_LIMIT');
 if(queued.error)throw queued.error;
 let pending: {id:string;attempt_count:number;source_job_id:string|null;attempt_history:unknown;workflow_run_id:number|null;candidate:unknown}|null=null;
 for(const candidate of queued.data??[]){
  // The production CHECK constraint was reconciled by the reviewed
  // paris_bounded_context_retry_contract migration. The policy below is the
  // sole application preflight; Postgres enforces the identical bound.
  // A missing deployment environment toggle must not starve an authorized
  // source-free bounded recovery while the underlying DB is already ready.
  // Never reset or increment attempts outside the atomic claim below.
  if(!canDispatchParisRepairAttempt(candidate)){
   // Preserve the original repair and report a bounded budget block. No claim,
   // attempt reset, worker restart, or data mutation beyond its repair receipt.
   const limited=await db.from('paris_code_repairs').update({
    status:'blocked',error_code:'PARIS_REPAIR_ATTEMPT_BUDGET_EXHAUSTED',updated_at:new Date().toISOString()
   }).eq('id',candidate.id).eq('status','queued').eq('attempt_count',candidate.attempt_count);
   if(limited.error)throw limited.error;
   continue;
  }
  if(!candidate.source_job_id){pending=candidate;break;}
  const source=await db.from('ultimate_build_jobs').select('id,build_id,job_type,status,last_error').eq('id',candidate.source_job_id).single();
  if(source.error)throw source.error;
  const latest=await db.from('ultimate_build_jobs').select('id,build_id,status').eq('build_id',source.data.build_id).eq('job_type',source.data.job_type).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(latest.error)throw latest.error;
  const build=await db.from('ultimate_course_builds').select('id,status,profile,findings').eq('id',source.data.build_id).single();
  if(build.error)throw build.error;
  const disposition=isCourseDependencyFailure(source.data.last_error)?'dependency':courseDefectDisposition({source:source.data,latest:latest.data,build:build.data});
  if(disposition==='repair'){pending=candidate;break;}
  const blocked=await db.from('paris_code_repairs').update({
   status:'blocked',error_code:disposition==='dependency'?'SOURCE_DEPENDENCY_EVIDENCE_REQUIRED':
    disposition==='acceptance_pending'?'SOURCE_WORKER_COMPLETED_ACCEPTANCE_PENDING':
    disposition==='evidence_required'?'SOURCE_DEFECT_EVIDENCE_REQUIRED':
    'SOURCE_REPAIR_INELIGIBLE_CURRENT_STATE',
   updated_at:new Date().toISOString(),
  }).eq('id',candidate.id).eq('status','queued').eq('attempt_count',candidate.attempt_count);
  if(blocked.error)throw blocked.error;
 }
 if(!pending)return {enabled:true,dispatched:0,reason:'NO_ELIGIBLE_REPAIR_IN_SCANNED_QUEUE'};
 // New repairs use OpenHands; the local inference service is not an admission
 // dependency for that engine. Configuration permits an attempt, never proves
 // provider acceptance or a completed repair. Old planner checkpoints retain
 // their original engine and its readiness check.
 if(parisRepairEngine(pending.candidate)==='openhands'){
  const {getHydratedOpenHandsConfig}=await import('@/lib/devstudio/openhands/client');
  const config=await getHydratedOpenHandsConfig();
  if(!config.configured || config.configuredRepository!==REPAIR_REPOSITORY)return {
   enabled:true,dispatched:0,awaitingProvider:true,reason:'OPENHANDS_CONFIGURATION_REQUIRED',providerStatus:'not_configured'};
 }else if((process.env.AI_PROVIDER??'elevate').trim().toLowerCase()==='elevate'){
  const {probeOwnedModel}=await import('@/lib/ai/providers/owned-model-health.mjs');
  const health=ownedProviderReadiness??await probeOwnedModel({timeoutMs:REPAIR_MODEL_PROBE_TIMEOUT_MS}).catch(()=>({verified:false,status:'request_failed'}));
  if(!health.verified)return {enabled:true,dispatched:0,awaitingProvider:true,
   reason:'OWNED_MODEL_READINESS_UNVERIFIED',providerStatus:health.status??'request_failed'};
 }
 const claim=await db.from('paris_code_repairs').update(repairDispatchValues(pending)).eq('id',pending.id).eq('status','queued').eq('attempt_count',pending.attempt_count).select('id').maybeSingle();
 if(claim.error){
  if(isParisAttemptConstraintMismatch(claim.error)){
    return {enabled:true,dispatched:0,reason:'PARIS_SCHEMA_MIGRATION_REQUIRED',retryAuthorized:false};
  }
  throw claim.error;
 }
 if(!claim.data)return {enabled:true,dispatched:0};
 if(workflowOwnedDispatch)return {enabled:true,dispatched:0,dispatchRequired:true,repairId:claim.data.id};
 try{await gh(`/actions/workflows/${REPAIR_WORKFLOW}/dispatches`,{method:'POST',body:JSON.stringify({ref:'main',inputs:{repair_id:claim.data.id}})});}
 catch(error){await update(claim.data.id,{status:'blocked',error_code:'REPAIR_DISPATCH_FAILED'});throw error;}
 return {enabled:true,dispatched:1,repairId:claim.data.id};
}
