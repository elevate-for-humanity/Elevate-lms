export const REPAIR_REPOSITORY='elevate-for-humanity/Elevate-lms';
export const REPAIR_WORKFLOW='paris-code-repair.yml';
export function repairFingerprint(operation,category,sha){return `${operation}:${category}:${sha}`;}
// Incident identity follows the observed recovery boundary, not unrelated source commits.
export function repairIncidentFingerprint(event){
 return `${event.operation}:${event.failure_category}:incident:${event.recoveryAnchor ?? 'unrecovered'}`;
}
export function eligibleRepairEvents(events){
 const grouped=new Map();
 for(const e of events){
  if(!grouped.has(e.operation))grouped.set(e.operation,[]);
  grouped.get(e.operation).push(e);
 }
 return [...grouped.values()].flatMap(rows=>{
  rows.sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
  if(rows[0].status!=='failed'||!['quality','unknown'].includes(rows[0].failure_category))return [];
  // A completed operation closes the preceding incident. Historical failures
  // must not become evidence for a new incident after recovery.
  const recovered=rows.findIndex(e=>e.status==='completed');
  const unresolved=recovered<0?rows:rows.slice(0,recovered);
  const failures=unresolved.filter(e=>e.status==='failed'&&['quality','unknown'].includes(e.failure_category));
  return failures.length>=1?[{...failures[0],recoveryAnchor:recovered<0?'unrecovered':rows[recovered].id??rows[recovered].created_at}]:[];
 });
}
export function validationPassed(jobs){
 return jobs.some(j=>j.name==='validate'&&j.status==='completed'&&j.conclusion==='success');
}
function latestDeploymentRun(runs,sha,deployment){
 const actual=runs.filter(run=>run.head_sha===sha&&(run.path?run.path===`.github/workflows/${deployment.workflow}`:run.name===deployment.name)&&
  (run.event==='workflow_dispatch'||(deployment.workflow==='deploy-google-course-worker.yml'&&run.event==='push')));
 // A rerun keeps its original id/created_at. Use the current attempt's start
 // before identity so a later attempt cannot reuse an older deployment result.
 const attemptTime=run=>Date.parse(run.run_started_at??run.created_at)||0;
 return actual.sort((left,right)=>attemptTime(right)-attemptTime(left)||
  (Number(right.id)||0)-(Number(left.id)||0)||
  (Number(right.run_attempt)||0)-(Number(left.run_attempt)||0))[0];
}
export function repairDeploymentState(runs,sha,deployments=REPAIR_DEPLOYMENTS){
 const latest=deployments.map(deployment=>latestDeploymentRun(runs,sha,deployment));
 if(latest.some(run=>run?.status==='completed'&&run.conclusion!=='success'))return 'failed';
 return latest.every(run=>run?.status==='completed'&&run.conclusion==='success')?'passed':'pending';
}

export function canRetryRepair(repair){return repair.status==='blocked'&&repair.verification?.reconciliation?.replay!==false&&repair.attempt_count<2&&!repair.release_sha&&((Boolean(repair.candidate?.branch?.sha)&&/PATCH_OR_VALIDATION_FAILED|REPAIR_WORKFLOW_failure/.test(repair.error_code??''))||(!repair.candidate?.branch?.sha&&/^(REPAIR_DISPATCH_FAILED|REPAIR_DISPATCH_NOT_CLAIMED)$/.test(repair.error_code??'')));}

/** Retry at most once after verified owned-model recovery. Never replay a
 * source-linked course defect, released candidate, or retired incident. */
export function canRetryHealthyProviderRepair(repair){
 return repair.status==='blocked' &&
  repair.attempt_count===1 &&
  !repair.release_sha &&
  !repair.candidate?.branch?.sha &&
  repair.verification?.reconciliation?.replay!==false &&
  (/^PARIS_PATCH_FAILED: Configured AI provider "elevate" failed;.*(?:aborted due to timeout|timed out)$/i.test(repair.error_code??'') ||
   /^PARIS_PATCH_FAILED: OWNED_MODEL_TEMPORARILY_UNAVAILABLE:(?:request_failed|model_unavailable)$/.test(repair.error_code??'') ||
   repair.error_code === 'PARIS_PATCH_FAILED: Owned model connection is unavailable. Verify the selected private CPU endpoint before retrying.');
}

/** One recovery for the former CPU context cap, only before any repository
 * write. Retain attempt history; a second context failure requires diagnosis. */
export function canResumeContextBudgetRepair(repair) {
 const checkpoint=repair.candidate?.checkpoint;
 return repair.status==='blocked' && [1,2].includes(repair.attempt_count) &&
  (repair.attempt_count<2 || repair.source_job_id == null) &&
  !repair.release_sha && !repair.candidate?.branch &&
  repair.verification?.reconciliation?.replay!==false &&
  !repair.attempt_history?.some(entry=>entry.retryReason==='bounded-context-budget-recovery') &&
  /^PARIS_PATCH_FAILED: PARIS_REPAIR_TASK_EXCEEDS_MODEL_CONTEXT$/.test(repair.error_code??'') &&
  (!repair.candidate || (repair.candidate.kind==='planner-checkpoint' && checkpoint &&
   checkpoint.writes===0 && checkpoint.commits?.length===0 && checkpoint.changedFiles?.length===0 &&
   checkpoint.headSha===checkpoint.baseSha && !checkpoint.complete));
}

// Only a read-only checkpoint created before the CPU editing budget changed
// may resume a second time. Require evidence from that repair's own model call.
export function canResumeLegacyCpuEdit(repair, events, tier) {
 const checkpoint = repair.candidate?.checkpoint;
 if (tier !== 'cpu' || repair.status !== 'blocked' || repair.attempt_count !== 2 ||
     repair.source_job_id || repair.release_sha || repair.candidate?.branch ||
     repair.candidate?.kind !== 'planner-checkpoint' || !checkpoint || checkpoint.boundedCpuEdits ||
     checkpoint.complete || checkpoint.writes !== 0 || checkpoint.commits?.length !== 0 ||
     checkpoint.changedFiles?.length !== 0 || checkpoint.headSha !== checkpoint.baseSha ||
     !Number.isInteger(checkpoint.nextTurn) || checkpoint.nextTurn >= 14 ||
     !checkpoint.observations?.some(value => typeof value === 'string' && value.startsWith('READ ')) ||
     repair.verification?.reconciliation?.replay === false ||
     !/^PARIS_PATCH_FAILED: Configured AI provider "elevate" failed;.*(?:aborted due to timeout|timed out)$/i.test(repair.error_code ?? '')) return false;
 const preflight = repair.verification?.providerRecoveryPreflight;
 if (!preflight?.ownedModelVerified || !preflight.githubRepositoryRead || !preflight.workflowEnabled) return false;
 const since = Date.parse(preflight.checkedAt);
 return events.some(event => event.correlation_id === repair.id && event.operation === 'ai.chat' &&
  event.provider === 'elevate' && event.status === 'failed' && event.failure_category === 'transient' &&
  event.duration_ms >= 200000 && Date.parse(event.created_at) >= since);
}

export const REPAIR_DEPLOYMENTS=[
 {name:'Deploy Admin',workflow:'deploy-admin.yml'},
 {name:'Deploy LMS automatically on Google',workflow:'deploy-google-lms-trigger.yml'},
 {name:'Deploy Google Marketing on trigger',workflow:'deploy-google-marketing-trigger.yml'},
 {name:'Deploy Google Course Builder on source changes',workflow:'deploy-google-course-worker.yml'},
];
/** One release at a time; accepted dispatches remain pending until observed. */
export function nextRepairDeployment(runs,sha,requested=[],deployments=REPAIR_DEPLOYMENTS) {
 for(const deployment of deployments){
  const latest=latestDeploymentRun(runs,sha,deployment);
  if(latest?.status==='completed'&&latest.conclusion==='success')continue;
  if(latest||requested.includes(deployment.workflow))return null;
  return deployment.workflow;
 }
 return null;
}

/** Accepted dispatch intent is not a deployment receipt. Bound that wait while
 * preserving the intent: replay could duplicate a request accepted upstream. */
export function unobservedRepairDeployment(runs,sha,requested=[],requestedAt={},fallbackAt,now=Date.now(),deployments=REPAIR_DEPLOYMENTS) {
 for(const deployment of deployments){
  if(!requested.includes(deployment.workflow)||latestDeploymentRun(runs,sha,deployment))continue;
  const started=Date.parse(requestedAt[deployment.workflow]??fallbackAt);
  if(Number.isFinite(started)&&now-started>=30*60*1000)return deployment.workflow;
 }
 return null;
}

/**
 * Worker generations are transient; the build and unresolved defect are durable.
 * A replacement job must not erase a code repair while the same failure persists.
 * Never repair a published/archived build or a resolved defect.
 */
export function courseDefectDisposition({source,latest,build}) {
 if (!source || !latest || !build || source.build_id !== latest.build_id || build.id !== source.build_id)
  return 'blocked';
 if (['published','archived'].includes(build.status) || build.profile?.ownerPaused === true)
  return 'blocked';
 if (latest.id === source.id && latest.status === 'failed') return 'repair';
 const text = String(source.last_error ?? '');
 const findings = Array.isArray(build.findings) ? build.findings : [];
 const unresolved = findings.some(f => {
  const candidate=String(f?.code ?? '')+' '+String(f?.message ?? '');
  return /RENDER_FAILED|QUALITY|CUE_NOT_ALIGNED|NARRATION_MISMATCH|MEDIA_SCENE|frozen|replay|visual changes/i.test(candidate);
 });
 if (!unresolved) return 'resolved';
 if (latest.status === 'completed') return 'resolved';
 return ['running','queued','failed'].includes(latest.status) && /quality|render|cue|speech|narration|replay|timeline/i.test(text)
  ? 'repair' : 'blocked';
}

/**
 * Prevent an invalid third dispatch BEFORE Postgres rejects the update.
 * Default budget is two attempts. One source-free third attempt is allowed
 * only for the two separately audited bounded CPU/context recovery categories.
 * This never authorizes a new recovery or bypasses owner/source validation.
 */
export function canDispatchParisRepairAttempt(repair) {
 const count=repair?.attempt_count;
 if (!Number.isSafeInteger(count) || count<0) return false;
 if (count<2) return true;
 if (count!==2 || repair?.source_job_id != null) return false;
 const history=repair?.attempt_history;
 return Array.isArray(history) && history.some(entry=>
   entry?.retryReason==='bounded-cpu-edit-recovery' ||
   entry?.retryReason==='bounded-context-budget-recovery');
}
