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

export function canRetryRepair(repair){return repair.status==='blocked'&&repair.verification?.reconciliation?.replay!==false&&repair.attempt_count<2&&!repair.release_sha&&((Boolean(repair.candidate?.branch?.sha)&&/PATCH_OR_VALIDATION_FAILED|REPAIR_WORKFLOW_failure/.test(repair.error_code??''))||(!repair.candidate?.branch?.sha&&/^REPAIR_DISPATCH_FAILED$/.test(repair.error_code??'')));}

/** Retry at most once after verified owned-model recovery. Never replay a
 * source-linked course defect, released candidate, or retired incident. */
/** The repair credential was refused at branch creation (POST /git/refs):
 * the configured GitHub App or token cannot create branches in the repair
 * repository. The stored error carries this exact code prefix. */
export function isGithubAppBranchFailure(repair) {
 return /^GITHUB_APP_403_BRANCH(?::|\s|$)/.test(String(repair?.error_code??''));
}

/** A single historical, SOURCE-FREE credential failure may retry only after
 * a fresh GitHub App write-permission and repository/workflow read preflight.
 * This predicate grants no authority itself and never resets attempt counts. */
export function canRetryVerifiedGithubAppRepair(repair) {
 if (repair?.status==='blocked' && repair.attempt_count===1 &&
  !repair.source_job_id && !repair.release_sha && !repair.candidate?.branch?.sha &&
  repair.verification?.reconciliation?.replay!==false &&
  /^(?:PARIS_PATCH_FAILED: )?(?:GitHub API (?:401|403) for \/(?:git\/ref|contents\/)|GitHub code search failed: 401|GITHUB_BRANCH_AUTHORITY_CHECK_HTTP_403$)/i
   .test(String(repair.error_code??''))) return true;
 // The branch-creation wall is the same credential failure, proven at the
 // first repository write: prepare staged no branch, candidate or release.
 // Admit it on the same first-attempt terms, source-linked or not — the
 // queue scan revalidates any linked source before a claim — but only the
 // monitor's proven Contents write authority (not read alone) may revive
 // this class.
 if (repair?.status==='blocked' && repair.attempt_count===1 &&
  !repair.release_sha && !repair.candidate?.branch?.sha &&
  repair.verification?.reconciliation?.replay!==false &&
  isGithubAppBranchFailure(repair)) return true;
 // Audited third attempt (Elizabeth's blanket fix order, 2026-11-25;
 // migration 20261125221500): a repair whose TWO attempts both died on
 // infrastructure before any write — the second at this same credential
 // wall — may be revived once, on the same proven-write preflight, whether
 // source-free or source-linked. Every recorded failure must be
 // infrastructure-class, no branch was ever produced, nothing was
 // released, and this recovery may be consumed only once.
 return repair?.status==='blocked' && repair.attempt_count===2 &&
  !repair.release_sha && !repair.candidate?.branch?.sha &&
  repair.verification?.reconciliation?.replay!==false &&
  isGithubAppBranchFailure(repair) &&
  hasOnlyInfrastructureAttemptFailures(repair) &&
  !repair.attempt_history?.some(entry=>entry?.retryReason==='verified-github-app-recovery');
}

/** Failures recorded by this repair system that occur BEFORE any repository
 * write: the GitHub App credential wall itself, an owned-model outage (the
 * healthy-provider vocabulary), and the OpenHands provider's protected
 * boundary refusal. Anything else — a produced patch, a validation outcome,
 * a provider code failure — is a real attempt outcome and fails closed. */
export function isInfrastructureRepairFailure(error) {
 const value=String(error??'');
 return /^GITHUB_APP_403_BRANCH(?::|\s|$)/.test(value) ||
  /^PARIS_PATCH_FAILED: OWNED_MODEL_TEMPORARILY_UNAVAILABLE:(?:request_failed|model_unavailable)$/.test(value) ||
  /^PARIS_OPENHANDS_PROTECTED_REPAIR_BOUNDARY$/.test(value);
}

/** Every recorded failure of a repair — each attempt_history entry plus the
 * current error_code — is infrastructure-class, and no history entry
 * evidences a produced branch. A missing or unclassifiable history cannot
 * prove both attempts died before any write, so it fails closed. */
export function hasOnlyInfrastructureAttemptFailures(repair) {
 const history=repair?.attempt_history;
 if (!Array.isArray(history) || history.length===0) return false;
 if (!history.every(entry=>typeof entry?.error==='string' &&
   isInfrastructureRepairFailure(entry.error) && !entry?.sha)) return false;
 return isInfrastructureRepairFailure(repair?.error_code);
}

export function canRetryHealthyProviderRepair(repair){
 return repair.status==='blocked' &&
  repair.attempt_count===1 &&
  !repair.release_sha &&
  !repair.candidate?.branch?.sha &&
  repair.verification?.reconciliation?.replay!==false &&
  (/^PARIS_PATCH_FAILED: Configured AI provider "elevate" failed;.*(?:aborted due to timeout|timed out)$/i.test(repair.error_code??'') ||
   /^PARIS_PATCH_FAILED: OWNED_MODEL_TEMPORARILY_UNAVAILABLE:(?:request_failed|model_unavailable)$/.test(repair.error_code??'') ||
   /^PARIS_PATCH_FAILED: PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE$/.test(repair.error_code??'') ||
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
 // A finished worker is not evidence that its originating code repair was
 // validated, merged, deployed, published or accepted by a learner.
 if (latest.status === 'completed') return 'acceptance_pending';
 // Missing or unrecognized findings cannot prove a defect was resolved.
 // Preserve the incident for evidence review instead of manufacturing success.
 if (!unresolved) return 'evidence_required';
 return ['running','queued','failed'].includes(latest.status) && /quality|render|cue|speech|narration|replay|timeline/i.test(text)
  ? 'repair' : 'blocked';
}

/**
 * Prevent an invalid third dispatch BEFORE Postgres rejects the update.
 * Default budget is two attempts. One source-free third attempt is allowed
 * only for the separately audited recovery categories. Source-linked third
 * attempts remain forbidden EXCEPT Elizabeth's approved narrow exception
 * (2026-11-25): the verified credential recovery of a repair whose every
 * recorded failure was infrastructure-class with zero writes.
 * This never authorizes a new recovery or bypasses owner/source validation.
 */
/** One bounded replay after the planner-loop fix reaches the signed dispatcher.
 * Linked jobs require current-source/build/lease validation in the dispatcher.
 * Never revive retired, released or already retried work.
 */
export function canResumePlannerInspectionRepair(repair) {
 return repair?.status==='blocked' && repair.attempt_count===1 &&
  !repair.release_sha &&
  !repair.candidate?.branch?.sha &&
  repair.verification?.reconciliation?.replay!==false &&
  !repair.attempt_history?.some(entry=>entry?.retryReason==='planner-inspection-fix') &&
  repair.error_code==='PARIS_PATCH_FAILED: PARIS_PLANNER_REPEATED_INSPECTION';
}

/** A single audited post-fix replay for a source-free planner that made no
 * repository changes. The original attempts and archived checkpoint are kept.
 * This never authorizes linked course work or a committed candidate.
 */
export function canResumeZeroWritePlannerRepair(repair) {
 const checkpoint=repair?.candidate?.checkpoint;
 return repair?.status==='blocked' && repair.attempt_count===2 &&
  repair.source_job_id==null && !repair.release_sha &&
  repair.candidate?.kind==='planner-checkpoint' && checkpoint &&
  checkpoint.complete===false && checkpoint.writes===0 &&
  Array.isArray(checkpoint.commits) && checkpoint.commits.length===0 &&
  Array.isArray(checkpoint.changedFiles) && checkpoint.changedFiles.length===0 &&
  checkpoint.headSha===checkpoint.baseSha &&
  repair.verification?.reconciliation?.replay!==false &&
  !repair.attempt_history?.some(entry=>entry?.retryReason==='zero-write-planner-v2') &&
  /^PARIS_PATCH_FAILED: PARIS_(?:PLANNER_REPEATED_INSPECTION|REPAIR_PLANNING_DEADLINE_REACHED)$/.test(repair.error_code??'');
}

export function canDispatchParisRepairAttempt(repair) {
 const count=repair?.attempt_count;
 if (!Number.isSafeInteger(count) || count<0) return false;
 if (count<2) return true;
 if (count!==2) return false;
 const history=repair?.attempt_history;
 if (!Array.isArray(history)) return false;
 if (repair?.source_job_id == null) return history.some(entry=>
   entry?.retryReason==='bounded-cpu-edit-recovery' ||
   entry?.retryReason==='bounded-context-budget-recovery' ||
   entry?.retryReason==='zero-write-planner-v2' ||
   entry?.retryReason==='verified-github-app-recovery');
 // Elizabeth's approved exception (blanket fix order, 2026-11-25): ONE
 // source-linked third attempt, only where the verified credential
 // recovery revived a repair whose every recorded failure was
 // infrastructure-class and no branch was ever produced. The recorded
 // recovery receipt is mandatory; every other source-linked third
 // attempt remains forbidden by design.
 return !repair?.candidate?.branch?.sha &&
  history.some(entry=>entry?.retryReason==='verified-github-app-recovery') &&
  history.every(entry=>typeof entry?.error==='string' &&
   isInfrastructureRepairFailure(entry.error) && !entry?.sha);
}

/**
 * The current production constraint may predate the reviewed context-retry
 * migration. A 23514 rejection is NOT a successful dispatch and must never
 * be retried in a tight loop or acknowledged as a launched repair.
 */
export function isParisAttemptConstraintMismatch(error) {
 return error?.code === '23514' &&
   /paris_code_repairs_attempt_count_check/.test(String(error?.message ?? ''));
}

/** Minutes an in-flight repair may go without progress before it is
 * eligible for a bounded requeue. `dispatched` has a separate unconfirmed-dispatch timeout. */
export const IN_FLIGHT_REPAIR_TIMEOUT_MINUTES = Object.freeze({patching:60,validating:45,deploying:30,verifying:30});

export function inFlightRepairTimedOut(repair, now = Date.now()) {
  // A validated repair awaiting protected merge is owned by merge reconciliation.
  if (repair?.status === 'validating' && repair?.verification?.pullRequest) return false;
 const minutes = IN_FLIGHT_REPAIR_TIMEOUT_MINUTES[repair?.status];
 const updated = Date.parse(repair?.updated_at ?? '');
 return Boolean(minutes) && Number.isFinite(updated) && now - updated > minutes * 60000;
}

/** A run is gone (404/null) or completed; queued/in-progress runs still own the repair. */
export function repairRunsSettled(runs) {
 return runs.every(run => !run || run.status === 'completed');
}
