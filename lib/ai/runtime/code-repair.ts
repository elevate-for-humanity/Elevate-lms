import {ensureRepairMainCI,hasDurableMainCIObservation,isVerifiedMainCIReceipt} from './exact-main-ci-request.mjs';
import {loadCourseRepairEvidence} from '@/lib/devstudio/paris-course-repair-evidence.mjs';
import {parisRepairEngine} from '@/lib/devstudio/paris-openhands-repair.mjs';
import {nextAcceptedOpenHandsObservation,superviseAcceptedOpenHandsRepair,shouldReconcileTerminalRepair} from '@/lib/devstudio/paris-openhands-supervision.mjs';
import {applyOwnedParisRepairTransition} from './paris-owned-transition.mjs';
import {REPAIR_MODEL_PROBE_TIMEOUT_MS,repairRetryGoal} from '@/lib/devstudio/repair-inference-budget.mjs';
import {untouchedPlannerNeedsFreshGeneration} from '@/lib/devstudio/repair-checkpoint-recovery.mjs';
import {verifyParisRuntimeOrigins} from './paris-runtime-evidence.mjs';
import {failedCurrentReleases,queuedWorkflowRepairTarget,queuedWorkflowRepairDisposition} from './deployment-repair-events.mjs';
import {recordFailedRepairWorkflow,repairDispatchValues,expireUnclaimedRepairDispatch} from './repair-workflow-reconciliation.mjs';
import 'server-only';
import {resolveOwnedModelConnection} from '@/lib/ai/providers/owned-model-config.mjs';
import {reconcileRecoveredRepairs} from './repair-reconciliation';
import {isRepairableCourseFailure,isCourseDependencyFailure,courseRepairOutcome} from './course-repair-policy.mjs';
import {requireAdminClient} from '@/lib/supabase/admin';
import {getGitHubHeaders} from '@/lib/devstudio/github-token';
import {getGitHubAppToken} from '@/lib/devstudio/github-app-token';
import {infrastructureRepairPath,openInfrastructureRepair,infrastructureMergeEvidence,STORE_REPAIR_DEPLOYMENT} from '@/lib/devstudio/infrastructure-repair.mjs';
import {verifyProtectedParisMerge} from '@/lib/devstudio/openhands/paris-protected-merge.mjs';
import {currentWorkflowGitHubToken} from '@/lib/devstudio/workflow-github-context';
import {readRecentRepairEvents} from './repair-events';
import {REPAIR_REPOSITORY,REPAIR_WORKFLOW,REPAIR_DEPLOYMENTS,eligibleRepairEvents,repairFingerprint,repairIncidentFingerprint,validationPassed,repairDeploymentState,canRetryRepair,canRetryHealthyProviderRepair,canRetryVerifiedGithubAppRepair,isGithubAppBranchFailure,canResumeLegacyCpuEdit,canResumeContextBudgetRepair,canResumePlannerInspectionRepair,canResumeZeroWritePlannerRepair,nextRepairDeployment,unobservedRepairDeployment,courseDefectDisposition,canDispatchParisRepairAttempt,isParisAttemptConstraintMismatch,inFlightRepairTimedOut,repairRunsSettled,IN_FLIGHT_REPAIR_TIMEOUT_MINUTES} from './code-repair-policy.mjs';
// OpenHands has been removed: the owned internal engine is the only repair
// engine. A historical OpenHands checkpoint is restaged on the owned engine
// instead of waiting for the removed provider; no environment variable can
// select OpenHands.

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
   // Installation tokens receive all-false repository flags (even pull on a
   // repository they just read); those flags are not reported, not denied.
   const reported=data.permissions&&!(data.permissions.pull===false&&data.permissions.push===false)?data.permissions:null;
   if(kind==='contents')return {status:response.status,ok:/^[a-f0-9]{40}$/.test(data.object?.sha??'')};
   if(kind==='workflow')return {status:response.status,ok:data.state==='active',enabled:data.state==='active'};
   return {status:response.status,ok:true,permissions:{
    contentsRead:reported?reported.pull===true||reported.push===true||reported.admin===true:null,
    contentsWrite:reported?reported.push===true||reported.admin===true:null,
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
 if(!response.ok){
  let policyAbsent=false;
  if(response.status===404&&path==='/branches/main/protection'){
   const body=await response.json().catch(()=>null);
   policyAbsent=body?.message==='Branch not protected';
  }
  throw Object.assign(Error('PARIS_INFRASTRUCTURE_GITHUB_HTTP_'+response.status),{status:response.status,policyAbsent});
 }
 const result=await response.json();
 if(result.errors?.length)throw Error('PARIS_INFRASTRUCTURE_PULL_REQUEST_AUTOMERGE_REJECTED');
 return result;
}
/** Branch-policy reads need Administration: read, which the workflow job token
 * and some App installations lack. Resolve the configured policy credential
 * (a repository collaborator PAT) so protected-policy verification is not
 * silently downgraded to "unverified" for a permission reason. Falls back to
 * the verifier credential, then the App installation. */
async function parisPolicyGitHub(path:string,init:RequestInit={}) {
 const {getSecret}=await import('@/lib/secrets');
 const token=(process.env.PARIS_POLICY_TOKEN?.trim()
  ||await getSecret('PARIS_POLICY_TOKEN')
  ||process.env.PARIS_VERIFIER_TOKEN?.trim()
  ||await getSecret('PARIS_VERIFIER_TOKEN')
  ||'').trim();
 if(!token)return infrastructureGitHub(path,init);
 const endpoint=`https://api.github.com/repos/${REPAIR_REPOSITORY}${path}`;
 const response=await fetch(endpoint,{...init,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok){
  let policyAbsent=false;
  if(response.status===404&&path==='/branches/main/protection'){
   const body=await response.json().catch(()=>null);
   policyAbsent=body?.message==='Branch not protected';
  }
  throw Object.assign(Error('PARIS_POLICY_GITHUB_HTTP_'+response.status),{status:response.status,policyAbsent});
 }
 return response.json();
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
  // Queue admission is historical evidence, not continuing write authority.
  // Check before the engine runs, including continuations.
  const owner=await db.from('profiles').select('role').eq('id',claimed.actor_id).maybeSingle();
  if(owner.error||!claimed.actor_id||!['admin','super_admin'].includes(owner.data?.role??''))
   throw Error('PARIS_AUTOPILOT_OWNER_AUTHORITY_REQUIRED');
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
  // OpenHands has been removed: there is no provider staging branch. A
  // historical OpenHands checkpoint is restaged on the owned internal
  // engine below rather than waiting for the removed provider.
  // Preserve historical provider checkpoints and their committed source
  // evidence in attempt history. New repairs and planner checkpoints use
  // the owned internal engine, and a historical OpenHands checkpoint is
  // restaged on the owned engine rather than waiting.
  if(!candidate || candidate.kind==='planner-checkpoint' ||
   candidate.kind==='openhands-checkpoint') {
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
/** Independently authorize a protected merge against the durable repair record.
 * The signed merge workflow must not trust its own inputs: it proves the PR it
 * was asked to merge is the exact pull request this repair recorded, at the
 * exact head that was validated, while the repair is still awaiting merge. */
export async function authorizeParisProtectedMerge(id:string,prNumber:number,expectedHeadSha:string){
 const db=await requireAdminClient();
 const {data:row,error}=await db.from('paris_code_repairs').select('id,status,verification').eq('id',id).single();
 if(error)throw error;
 const recorded=row?.verification?.pullRequest;
 const reasons:string[]=[];
 if(!Number.isInteger(prNumber)||prNumber<1)reasons.push('Requested pull request number is invalid');
 if(!/^[a-f0-9]{40}$/.test(expectedHeadSha??''))reasons.push('Requested head SHA is invalid');
 if(!recorded||typeof recorded!=='object')reasons.push('Repair has no recorded pull request');
 else{
  if(Number(recorded.number)!==prNumber)reasons.push('Requested pull request is not the one this repair recorded');
  if(String(recorded.headSha)!==expectedHeadSha)reasons.push('Requested head SHA is not the one this repair validated');
 }
 if(row?.status!=='validating')reasons.push('Repair is not awaiting a protected merge');
 return {authorized:reasons.length===0,reasons,recordedPrNumber:Number(recorded?.number)||null,recordedHeadSha:String(recorded?.headSha??'')||null};
}
/** Persist the signed protected-merge workflow outcome. A successful merge is
 * not completion: the reconciler independently re-reads the merged PR and
 * requires protected acceptance before deployment. A failed merge is recorded
 * so the reconciler can retry the request after its stale window. */
export async function recordParisMergeResult(id:string,result:{merged:boolean;mergeCommitSha?:string|null;reason?:string|null;reasons?:string[];runId?:number}){
 const db=await requireAdminClient();
 const {data:row,error}=await db.from('paris_code_repairs').select('id,verification').eq('id',id).single();
 if(error)throw error;
 const prior=row?.verification??{};
 const protectedMergeResult={
  merged:result.merged===true,
  mergeCommitSha:/^[a-f0-9]{40}$/.test(result.mergeCommitSha??'')?result.mergeCommitSha:null,
  reason:result.reason??null,
  reasons:Array.isArray(result.reasons)?result.reasons.slice(0,8):undefined,
  runId:Number.isSafeInteger(result.runId)?result.runId:null,
  at:new Date().toISOString(),
 };
 const {error:writeError}=await db.from('paris_code_repairs').update({verification:{...prior,protectedMergeResult},updated_at:new Date().toISOString()}).eq('id',id);
 if(writeError)throw writeError;
 return {recorded:true};
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
 const pullRequest=await openInfrastructureRepair({candidate,repairId:id,github:infrastructureGitHub});
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
 const db=await requireAdminClient();const {data,error}=await db.from('paris_code_repairs').select('status,workflow_run_id').eq('id',id).maybeSingle();
 if(error)throw error;
 if(data?.workflow_run_id!==runId)return {recorded:false,reason:'RUN_NOT_ASSOCIATED'};
 if(!['patching','validating'].includes(data.status))return {recorded:false,reason:'STATE_ALREADY_SETTLED'};
 const recorded=await updateOwnedRepair(id,runId,data.status,{status:'blocked',error_code:'PATCH_OR_VALIDATION_FAILED_SEE_WORKFLOW'},true);
 return {recorded,reason:recorded?'FAILURE_RECORDED':'STATE_CHANGED'};
}
export async function tickParisCodeRepairs(options:{workflowOwnedDispatch?:boolean}={}){
 const result=await runParisCodeRepairTick(options);
 // Only a signed workflow tick that reached the repair queue proves the monitor is alive.
 if(result.enabled&&!('awaitingWorkflow' in result&&result.awaitingWorkflow)){
  const db=await requireAdminClient();
  const {error}=await db.from('paris_autopilot_policy').update({last_tick_at:new Date().toISOString()}).eq('id',true);
  if(error&&!['42703','PGRST204'].includes(String(error.code)))throw error;
 }
 return result;
}
/** Bounded requeue of an in-flight repair that stopped progressing and no
 * longer has a live workflow run. Attempt count is intentionally preserved. */
async function requeueTimedOutRepair(db:any,repair:any){
 // Exact-main CI has its own bounded, persisted observation contract. Never
 // erase dispatch intent via generic timeout before it records success/failure.
 if(hasDurableMainCIObservation(repair))return false;
 if(!inFlightRepairTimedOut(repair))return false;
 const runOrNull=async(path:string)=>{
  try{return await gh(path);}
  catch(error){if(error instanceof Error&&error.message==='PARIS_GITHUB_HTTP_404')return null;throw error;}
 };
 const runs:any[]=repair.workflow_run_id?[await runOrNull(`/actions/runs/${repair.workflow_run_id}`)]:[];
 if(repair.release_sha&&['deploying','verifying'].includes(repair.status)){
  const deployments=await runOrNull(`/actions/runs?head_sha=${repair.release_sha}&per_page=100`);
  runs.push(...(deployments?.workflow_runs??[]));
 }
 if(!repairRunsSettled(runs))return false;
 const at=new Date().toISOString();
 const requeued=await db.from('paris_code_repairs').update({
  status:'queued',workflow_run_id:null,error_code:null,
  attempt_history:[...(repair.attempt_history??[]),{error:'REPAIR_STATE_TIMEOUT:'+repair.status,at,runId:repair.workflow_run_id??null,stateSince:repair.updated_at}],
  updated_at:at,
 }).eq('id',repair.id).eq('status',repair.status).eq('attempt_count',repair.attempt_count)
  .eq('updated_at',repair.updated_at).select('id').maybeSingle();
 if(requeued.error)throw requeued.error;
 return Boolean(requeued.data);
}
// Reconcile an immutable repair SHA to a newer main only through observed
// ancestry, independent CI/integrity evidence and required deployments.
// This never signs off the previous SHA or dispatches any deployment.
async function reconcileParisNewerMain({repair,gh,deployments,currentMain}:{
 repair:any;gh:(path:string)=>Promise<any>;deployments:any[];currentMain?:any
}){
 const main=currentMain??await gh('/git/ref/heads/main');
 const currentSha=String(main?.object?.sha??'');
 // An unavailable comparison is not evidence that the immutable release
 // lacks ancestry. Let transient API failures retry without changing repair state.
 if(!/^[a-f0-9]{40}$/.test(currentSha))throw Error('PARIS_CURRENT_MAIN_SHA_UNVERIFIED');
 const comparison=await gh('/compare/'+repair.release_sha+'...'+currentSha);
 const ancestry=comparison?.status==='ahead'||comparison?.status==='identical';
 const candidateRuns=ancestry?await gh(`/actions/runs?head_sha=${currentSha}&per_page=100`):null;
 const candidateChecks=candidateRuns?.workflow_runs??[];
 // The latest exact-SHA attempt owns the decision. An older successful run
 // cannot mask a later failed CI or a failed required production deployment.
 const latest=(name:string)=>candidateChecks.filter((run:any)=>run.head_sha===currentSha&&run.name===name)
  .sort((a:any,b:any)=>(Date.parse(b.run_started_at??b.created_at??'')||0)-
   (Date.parse(a.run_started_at??a.created_at??'')||0)||(Number(b.id)||0)-(Number(a.id)||0))[0];
 const ci=latest('CI');
 const integrity=latest('Integrity Gate');
 const independentlyValidated=ci?.status==='completed'&&ci.conclusion==='success'&&
  integrity?.status==='completed'&&integrity.conclusion==='success';
 const deploymentState=ancestry?repairDeploymentState(candidateChecks,currentSha,deployments):'pending';
 const failedGate=[ci,integrity].find((run:any)=>run?.status==='completed'&&run.conclusion!=='success');
 const candidateFailed=Boolean(failedGate)||deploymentState==='failed';
 const prior=repair.verification?.releaseReconciliation;
 const now=new Date().toISOString();
 // Do not refresh the start of a successor observation on every monitor tick.
 // A failed or never-observed successor must not hold the global repair queue.
 const priorSince=prior?.currentMainSha===currentSha?Date.parse(prior.observationStartedAt??prior.checkedAt??''):NaN;
 const observationStartedAt=Number.isFinite(priorSince)?new Date(priorSince).toISOString():now;
 const observationWindowMs=(IN_FLIGHT_REPAIR_TIMEOUT_MINUTES.deploying+IN_FLIGHT_REPAIR_TIMEOUT_MINUTES.verifying)*60000;
 const observationExpired=Date.now()-Date.parse(observationStartedAt)>=observationWindowMs;
 const candidatePassed=ancestry&&independentlyValidated&&deploymentState==='passed';
 const state=!ancestry?'release-not-ancestor-of-main':
  candidateFailed?'newer-main-validation-failed':
  candidatePassed?'validated-newer-target':
  observationExpired?'newer-main-validation-not-observed':'newer-main-needs-independent-validation';
 return {
  state,independentlyValidated,immutableReleaseSha:repair.release_sha,currentMainSha:currentSha,
  observationStartedAt,checkedAt:now,
  failedCheck:failedGate?{name:failedGate.name,runId:failedGate.id??null,conclusion:failedGate.conclusion}:null,
  deploymentState
 };
}
async function runParisCodeRepairTick({workflowOwnedDispatch=false}:{workflowOwnedDispatch?:boolean}={}){
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
 // A timed-out prepare is not a provider-terminal result. Observe only one
 // accepted task, under the same owner policy, without spending an attempt.
 const accepted=nextAcceptedOpenHandsObservation(blocked.data??[],policy.actor_id);
 let observedOpenHandsRepairId: string | undefined;
 if(accepted){
  const busy=await db.from('paris_code_repairs').select('id').in('status',['dispatched','patching','validating','deploying','verifying']).limit(1);
  if(busy.error)throw busy.error;
  if(!busy.data?.length){
   const {observeParisOpenHandsRepair}=await import('@/lib/devstudio/paris-openhands-adapter');
   const owned=(values:any)=>db.from('paris_code_repairs').update(values)
    .eq('id',accepted.id).eq('status','blocked').eq('actor_id',policy.actor_id)
    .eq('workflow_run_id',accepted.workflow_run_id).eq('attempt_count',accepted.attempt_count)
    .eq('updated_at',accepted.updated_at);
   const result=await superviseAcceptedOpenHandsRepair(accepted,{
    now:Date.now,workflow:(runId:number)=>gh(`/actions/runs/${runId}`),
    jobs:(runId:number)=>gh(`/actions/runs/${runId}/jobs?per_page=100`),
    observe:()=>observeParisOpenHandsRepair(accepted),
    sourceEligible:async()=>{
     if(!accepted.source_job_id)return true;
     const source=await db.from('ultimate_build_jobs').select('*').eq('id',accepted.source_job_id).single();
     if(source.error)throw source.error;
     if(!isRepairableCourseFailure(source.data)||source.data.lease_owner&&Date.parse(source.data.lease_expires_at??'')>Date.now())return false;
     const [latest,build]=await Promise.all([
      db.from('ultimate_build_jobs').select('id,build_id,status').eq('build_id',source.data.build_id).eq('job_type',source.data.job_type).order('created_at',{ascending:false}).limit(1).maybeSingle(),
      db.from('ultimate_course_builds').select('id,status,profile,findings').eq('id',source.data.build_id).single(),
     ]);
     if(latest.error||build.error)throw latest.error??build.error;
     return latest.data?.id===source.data.id && build.data.status==='running' &&
      build.data.profile?.ownerPaused===false &&
      courseDefectDisposition({source:source.data,latest:latest.data,build:build.data})==='repair';
    },
    record:async(verification:any)=>{
     // A stale compare-and-swap may update zero rows without a database error.
     // Read back the affected row before reporting a recorded observation.
     const saved=await owned({verification,updated_at:new Date().toISOString()}).select('id').maybeSingle();
     if(saved.error)throw saved.error;
     if(!saved.data?.id)throw Error('PARIS_OPENHANDS_OBSERVATION_LOST_CAS');
    },
    claim:async(values:any)=>{
     const saved=await owned(values).select('id').maybeSingle();
     if(saved.error?.code==='23505')return false;
     if(saved.error)throw saved.error;
     return Boolean(saved.data);
    },
   });
   if(result.dispatchRequired)return {enabled:true,dispatched:0,dispatchRequired:true,repairId:result.repairId};
   if(result.handled){
    observedOpenHandsRepairId=accepted.id;
    console.info('[PARIS] OpenHands observation did not claim a repair; continuing queue scan.',
      {repairId:accepted.id,awaitingProvider:result.awaitingProvider===true});
   }
  }
 }
 let recoveredProviderThisTick=false;
 let providerRecoveryHealth: boolean | undefined;
 let ownedProviderReadiness: {verified:boolean;status?:string} | undefined;
 let recoveredAppThisTick=false;
 let githubAppRecoveryHealth: boolean | undefined;
 let githubAppWriteHealth: boolean | undefined;
 const ownedTier=resolveOwnedModelConnection().tier;
 for(const repair of blocked.data??[]){
  // The observation may have updated this row since the blocked snapshot.
  if(repair.id===observedOpenHandsRepairId)continue;
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
  // credential failure. Do not retry an exhausted attempt or a repair that
  // already has a release candidate. The branch-creation class may be
  // source-linked — the queue scan revalidates its source before a claim —
  // but it revives only on proven Contents write authority, below.
  if(!recoveredAppThisTick && canRetryVerifiedGithubAppRepair(repair)){
   if(githubAppRecoveryHealth===undefined){
    const token=await getGitHubAppToken().catch(()=>null);
    const diagnostic=token?await diagnoseParisGitHubCredential({
     Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json'
    }).catch(()=>null):null;
    githubAppRecoveryHealth=Boolean(token && diagnostic?.repository?.ok &&
     diagnostic?.contents?.ok && diagnostic?.workflow?.ok);
    // A branch-creation refusal is cured only by proven write authority:
    // the read preflight above would requeue that class into the same 403.
    // The diagnostic reports the freshly minted App token's own contents
    // permission, so require it explicitly for that failure class. An App
    // installation token reports none (null); getGitHubAppToken already
    // refused issuance unless the installation grants contents:write.
    githubAppWriteHealth=githubAppRecoveryHealth &&
     (diagnostic?.repository?.permissions?.contentsWrite===true ||
      diagnostic?.repository?.permissions?.contentsWrite===null);
   }
   const branchFailure=isGithubAppBranchFailure(repair);
   if(branchFailure?githubAppWriteHealth:githubAppRecoveryHealth){
    const updated=await db.from('paris_code_repairs').update({
     status:'queued',error_code:null,
     attempt_history:[...(repair.attempt_history??[]),{
      error:repair.error_code,at:repair.updated_at,
      retryReason:'verified-github-app-recovery'
     }],
     verification:{...repair.verification,credentialRecoveryPreflight:{
      githubAppVerified:true,repositoryRead:true,workflowEnabled:true,
      ...(branchFailure?{contentsWrite:true}:{}),
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
      if(!build.data || !['running','queued','building','blocked'].includes(build.data.status)
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
 const terminal=await db.from('paris_code_repairs').select('id,actor_id,status,release_sha,error_code,candidate,verification').in('status',['verified','blocked']).order('updated_at',{ascending:false}).limit(2000);
 if(terminal.error)throw terminal.error;
 if(terminal.data?.length===2000)throw Error('PARIS_TERMINAL_REPAIR_SCAN_LIMIT');
 for(const repair of terminal.data??[]){
  // Observe only one receipt per tick, but protect ALL accepted provider
  // checkpoints from terminal reconciliation, including other approval waits.
  if(!shouldReconcileTerminalRepair(repair,policy.actor_id))continue;
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
 const active=await db.from('paris_code_repairs').select('id,status,release_sha,workflow_run_id,source_job_id,verification,updated_at,attempt_count,attempt_history').in('status',['dispatched','patching','validating','deploying','verifying']).limit(10);
 if(active.error)throw active.error;
 for(const repair of active.data??[]){
  if(await requeueTimedOutRepair(db,repair)){repair.status='queued';continue;}
  if(repair.status==='validating'&&repair.verification?.pullRequest){
   try{
    const pr=await gh('/pulls/'+repair.verification.pullRequest.number);
    const sha=infrastructureMergeEvidence(pr,repair.verification.pullRequest.headSha);
    if(!sha){
     // The PR is open and not yet merged. Nothing else in the system approves
     // or merges it, so dispatch the signed protected-merge workflow once. It
     // honors the independently read protected policy: no review is fabricated
     // when the owner configures zero approvals; positive review counts remain.
     const requestedAt=repair.verification?.protectedMergeRequestedAt;
     const requestNumber=repair.verification?.protectedMergeRequest?.prNumber;
     const alreadyRequested=requestNumber===pr.number && repair.verification?.protectedMergeRequest?.headSha===repair.verification.pullRequest.headSha;
     const staleRequest=requestedAt && Date.now()-Date.parse(requestedAt)>20*60000;
     if(!alreadyRequested || staleRequest){
      try{
       await gh(`/actions/workflows/paris-protected-merge.yml/dispatches`,{method:'POST',body:JSON.stringify({ref:'main',inputs:{repair_id:repair.id,pr_number:String(pr.number),expected_head_sha:repair.verification.pullRequest.headSha}})});
      }catch(error){
       // A rejected dispatch is durable: record it and let the next tick retry
       // only after the stale window, never silently drop the repair.
       await update(repair.id,{verification:{...repair.verification,protectedMergeRequest:{prNumber:pr.number,headSha:repair.verification.pullRequest.headSha},protectedMergeRequestedAt:new Date().toISOString(),protectedMergeDispatchError:String(error instanceof Error?error.message:error).slice(0,300)}});
       continue;
      }
      await update(repair.id,{verification:{...repair.verification,protectedMergeRequest:{prNumber:pr.number,headSha:repair.verification.pullRequest.headSha},protectedMergeRequestedAt:new Date().toISOString(),protectedMergeDispatchError:null}});
     }
     continue;
    }
    const protectedEvidence=await verifyProtectedParisMerge({
     pr,expectedHeadSha:repair.verification.pullRequest.headSha,gh,
     policyGh:parisPolicyGitHub, // policy credential with Administration: read
    });
    if(!protectedEvidence.accepted){
     await update(repair.id,{
      status:'blocked',
      error_code:'PROTECTED_PR_ACCEPTANCE_EVIDENCE_REQUIRED',
      verification:{...repair.verification,protectedReviewAcceptance:protectedEvidence},
     });
     continue;
    }
    await update(repair.id,{status:'deploying',release_sha:sha,verification:{...repair.verification,protectedReviewAcceptance:protectedEvidence,requestedDeployments:[]}});
   }catch(error){await update(repair.id,{status:'blocked',error_code:String(error instanceof Error?error.message:error).slice(0,500)});}
   continue;
  }
  if(repair.status==='dispatched'&&!repair.workflow_run_id){
   if(await expireUnclaimedRepairDispatch(db,repair))repair.status='blocked';
   continue;
  }
  if(['dispatched','patching','validating'].includes(repair.status)&&repair.workflow_run_id){
   const run=await gh(`/actions/runs/${repair.workflow_run_id}`);
   await recordFailedRepairWorkflow(db,repair,run);
  }
  if(repair.release_sha&&['deploying','verifying'].includes(repair.status)){
   const targetSha=repair.verification?.releaseReconciliation?.state==='validated-newer-target' ? repair.verification.releaseReconciliation.currentMainSha : repair.release_sha;
   const deployments=repair.verification?.protectedMerge?[...REPAIR_DEPLOYMENTS,STORE_REPAIR_DEPLOYMENT]:REPAIR_DEPLOYMENTS;
   const runs=await gh(`/actions/runs?head_sha=${targetSha}&per_page=100`);
   // Workflow-token merges suppress push events. Only the full exact-main CI
   // and its successful required gate can release the recorded squash SHA.
   const mergeReceipt=repair.verification?.protectedMergeResult;
   const priorCIRequest=repair.verification?.mainCIRequest??(
    ['PARIS_MERGE_MAIN_CI_REQUESTED','PARIS_MERGE_MAIN_CI_DISPATCH_FAILED'].includes(mergeReceipt?.reason)&&mergeReceipt?.mergeCommitSha===targetSha
     ?{sha:targetSha,requestedAt:mergeReceipt.at}:undefined);
   const mainCI=await ensureRepairMainCI({repository:REPAIR_REPOSITORY,sha:targetSha,runs:runs.workflow_runs,priorRequest:priorCIRequest,gh,
    observationWindowMs:IN_FLIGHT_REPAIR_TIMEOUT_MINUTES.deploying*60*1000,
    persistIntent:async(intent:any)=>{await update(repair.id,{verification:{...repair.verification,mainCIRequest:intent}});}});
   if(mainCI.state==='pending')continue;
   if(mainCI.state==='superseded'){
    const releaseReconciliation=await reconcileParisNewerMain({repair,gh,deployments});
    const terminalErrors:Record<string,string>={
     'newer-main-validation-failed':'REPAIR_NEWER_MAIN_VALIDATION_FAILED',
     'newer-main-validation-not-observed':'REPAIR_NEWER_MAIN_VALIDATION_NOT_OBSERVED',
     'release-not-ancestor-of-main':'REPAIR_RELEASE_NOT_ANCESTOR_OF_MAIN'
    };
    const errorCode=terminalErrors[releaseReconciliation.state];
    // Terminal evidence releases the queue but preserves the immutable SHA,
    // attempted dispatches, cumulative history and the successor diagnostic.
    await update(repair.id,{
     status:errorCode?'blocked':'verifying',
     ...(errorCode?{error_code:errorCode}:{}),
     verification:{...repair.verification,releaseReconciliation}
    });
    continue;
   }
   // Only exact-main CI with a successful required gate can advance release.
   // Superseded, failed or unknown evidence must never reach deployment or
   // runtime acceptance on the previous immutable target SHA.
   if(!isVerifiedMainCIReceipt(mainCI)){
    await update(repair.id,{status:'blocked',error_code:mainCI.state==='blocked'
     ?mainCI.reason:mainCI.state==='superseded'?'REPAIR_MAIN_CI_SUPERSEDED':'REPAIR_MAIN_CI_UNVERIFIED'});
    continue;
   }
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
      const releaseReconciliation=await reconcileParisNewerMain({repair,gh,deployments,currentMain});
      await update(repair.id,{status:'verifying',verification:{...repair.verification,releaseReconciliation}});
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
  const latest=await db.from('ultimate_build_jobs').select('id,build_id,status').eq('build_id',job.build_id).eq('job_type',job.job_type).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(latest.error)throw latest.error;if(latest.data?.id!==job.id||latest.data?.status!=='failed')continue;
  // A retired/superseded build can retain failed jobs for audit. It is not
  // a current source-repair candidate even if its monitor remains enabled.
  const build=await db.from('ultimate_course_builds').select('id,status,profile').eq('id',job.build_id).maybeSingle();
  if(build.error)throw build.error;
  if(!build.data || !['running','queued','building','blocked'].includes(build.data.status) ||
     build.data.profile?.ownerPaused===true)continue;
  if(courseDefectDisposition({source:job,latest:latest.data,build:build.data})!=='repair')continue;
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
 const queued=await db.from('paris_code_repairs').select('id,attempt_count,source_job_id,attempt_history,workflow_run_id,candidate,goal,verification')
  .eq('status','queued').order('created_at',{ascending:true}).limit(1000);
 if(queued.data?.length===1000)throw Error('PARIS_QUEUED_REPAIR_SCAN_LIMIT');
 if(queued.error)throw queued.error;
 let pending: {id:string;attempt_count:number;source_job_id:string|null;attempt_history:unknown;workflow_run_id:number|null;candidate:unknown}|null=null;
 const queueScan={scanned:0,attemptBudgetExhausted:0,workflowEvidenceRejected:0,courseEvidenceRejected:0};
 let awaitingCurrentWorkflowEvidence=0;
 const sourceRunCache=new Map<number,any>();
 for(const candidate of queued.data??[]){
  queueScan.scanned++;
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
   }).eq('id',candidate.id).eq('status','queued').eq('attempt_count',candidate.attempt_count).select('id').maybeSingle();
   if(limited.error)throw limited.error;
   if(!limited.data?.id)throw Error('PARIS_REPAIR_DISPOSITION_LOST_CAS');
   queueScan.attemptBudgetExhausted++;
   continue;
  }
  if(!candidate.source_job_id){
   const target=queuedWorkflowRepairTarget(candidate.goal);
   if(target){
    if(!sourceRunCache.has(target.runId)){
     try{sourceRunCache.set(target.runId,await gh(`/actions/runs/${target.runId}`));}
     catch(error){if(error instanceof Error&&error.message==='PARIS_GITHUB_HTTP_404')sourceRunCache.set(target.runId,null);else throw error;}
    }
    const disposition=queuedWorkflowRepairDisposition(target,sourceRunCache.get(target.runId),releaseRuns,sha);
    if(disposition.state==='awaiting-current-execution'){awaitingCurrentWorkflowEvidence++;continue;}
    if(disposition.state!=='current-failure'){
     // Historical evidence remains a blocked record, never a successful repair.
     // A current failed execution already has its own canonical incident above.
     const retained=await db.from('paris_code_repairs').update({status:'blocked',
      error_code:disposition.state==='invalid-source'?'SOURCE_WORKFLOW_EVIDENCE_INVALID':'SOURCE_WORKFLOW_SUPERSEDED_NOT_REPAIR_VERIFIED',
      verification:{...((candidate.verification??{}) as Record<string,unknown>),queuedWorkflowEvidence:disposition},updated_at:new Date().toISOString()})
      .eq('id',candidate.id).eq('status','queued').eq('attempt_count',candidate.attempt_count).select('id').maybeSingle();
     if(retained.error)throw retained.error;
     if(!retained.data?.id)throw Error('PARIS_REPAIR_DISPOSITION_LOST_CAS');
     queueScan.workflowEvidenceRejected++;
     continue;
    }
   }
   pending=candidate;break;
  }
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
  }).eq('id',candidate.id).eq('status','queued').eq('attempt_count',candidate.attempt_count).select('id').maybeSingle();
  if(blocked.error)throw blocked.error;
  if(!blocked.data?.id)throw Error('PARIS_REPAIR_DISPOSITION_LOST_CAS');
  queueScan.courseEvidenceRejected++;
 }
 if(!pending)return {enabled:true,dispatched:0,reason:awaitingCurrentWorkflowEvidence?'CURRENT_WORKFLOW_EVIDENCE_PENDING':'NO_ELIGIBLE_REPAIR_IN_SCANNED_QUEUE',awaitingCurrentWorkflowEvidence,queueScan};
 // OpenHands has been removed: every repair — new, planner checkpoint or
 // historical OpenHands checkpoint — is admitted on the owned internal
 // engine. No OpenHands readiness probe gates admission; the only
 // provider gate left is the owned model's own readiness, checked below.
 if((process.env.AI_PROVIDER??'elevate').trim().toLowerCase()==='elevate'){
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
