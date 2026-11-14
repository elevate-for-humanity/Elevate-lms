const MAX_OBSERVATION_AGE_MS = 24 * 60 * 60_000;
const resumableErrors = new Set(['PARIS_OPENHANDS_EXECUTION_FAILED',
  'PARIS_OPENHANDS_WAIT_DEADLINE', 'PATCH_OR_VALIDATION_FAILED_SEE_WORKFLOW',
  'PARIS_OPENHANDS_APPROVAL_REQUIRED', 'REPAIR_WORKFLOW_failure', 'REPAIR_WORKFLOW_timed_out']);

export function acceptedOpenHandsNeedsObservation(repair) {
  const cp = repair?.candidate?.checkpoint;
  const stopped = ['failed', 'rejected', 'attention_required', 'source_ineligible'];
  return repair?.status === 'blocked' && repair.candidate?.kind === 'openhands-checkpoint' &&
    resumableErrors.has(repair.error_code) && repair.verification?.reconciliation?.replay !== false && cp?.taskId && cp.dispatchRequested === true &&
    !repair.release_sha && !stopped.includes(repair.verification?.openhandsObservation?.state);
}

// Recording a pending observation updates updated_at. Selecting the newest
// row again would let one provider wait starve every other accepted execution.
export function nextAcceptedOpenHandsObservation(repairs, actorId) {
  const observedAt = repair => {
    const time = Date.parse(repair.verification?.openhandsObservation?.checkedAt ?? '');
    return Number.isFinite(time) ? time : 0;
  };
  return repairs.filter(repair => repair.actor_id === actorId && acceptedOpenHandsNeedsObservation(repair))
    .sort((a, b) => observedAt(a) - observedAt(b) || String(a.id).localeCompare(String(b.id)))[0];
}

/** One bounded observation per signed monitor tick. A ready result only
 * re-enters independent validation; it cannot approve, merge, or deploy. */
export async function superviseAcceptedOpenHandsRepair(repair, deps) {
  if (!acceptedOpenHandsNeedsObservation(repair)) return {handled: false};
  const cp = repair.candidate.checkpoint;
  const beganAt = deps.now();
  const checkedAt = new Date(beganAt).toISOString();
  const record = async (state, extra = {}) => deps.record({
    ...repair.verification, openhandsObservation: {state, taskId: cp.taskId,
      originalRunId: cp.runId, checkedAt, ...extra},
  });
  if (!Number.isFinite(cp.startedAt) || cp.startedAt > deps.now() ||
      deps.now() - cp.startedAt > MAX_OBSERVATION_AGE_MS) {
    await record('attention_required', {reason: 'OBSERVATION_AGE_LIMIT'});
    return {handled: true, awaitingProvider: false};
  }
  const run = await deps.workflow(cp.runId);
  if (cp.runId !== repair.workflow_run_id || run.id !== cp.runId ||
      run.path !== '.github/workflows/paris-code-repair.yml' ||
      run.event !== 'workflow_dispatch' || run.head_branch !== 'main') {
    await record('rejected', {reason: 'ORIGINAL_WORKFLOW_AUTHORITY_REQUIRED'});
    return {handled: true, awaitingProvider: false};
  }
  // An active run retains ownership. A cancelled run may be an owner stop.
  if (run.status !== 'completed') return {handled: true, awaitingProvider: true};
  if (!['failure', 'timed_out'].includes(run.conclusion)) {
    await record('rejected', {reason: 'ORIGINAL_WORKFLOW_NOT_FAILED'});
    return {handled: true, awaitingProvider: false};
  }
  // A generic workflow failure does not identify its failed phase. Only an
  // interrupted prepare may resume observation; validation/publication failures
  // retain their protected decisions. Never infer this from the error code.
  if (repair.error_code.startsWith('REPAIR_WORKFLOW_')) {
    const jobs = await deps.jobs(cp.runId);
    const prepare = jobs?.jobs?.filter(job => job.name === 'prepare') ?? [];
    const downstream = jobs?.jobs?.filter(job => ['validate', 'publish'].includes(job.name)) ?? [];
    if (jobs?.total_count !== jobs?.jobs?.length || prepare.length !== 1 ||
        prepare[0].status !== 'completed' || !['failure', 'timed_out'].includes(prepare[0].conclusion) ||
        downstream.length !== 2 || new Set(downstream.map(job => job.name)).size !== 2 ||
        downstream.some(job => job.status !== 'completed' || job.conclusion !== 'skipped')) {
      await record('attention_required', {reason: 'FAILED_PREPARE_EVIDENCE_REQUIRED'});
      return {handled: true, awaitingProvider: false};
    }
  }
  if (!await deps.sourceEligible()) {
    await record('source_ineligible');
    return {handled: true, awaitingProvider: false};
  }
  let outcome;
  try { outcome = await deps.observe(); }
  catch (error) {
    const code = String(error?.message ?? '');
    const transient = code === 'PARIS_OPENHANDS_APPROVAL_REQUIRED' || !/^PARIS_OPENHANDS_[A-Z_]+$/.test(code) ||
      /(?:HTTP_(?:429|5\d\d)|NOT_CONFIGURED|CANDIDATE_CHANGED_DURING_READBACK)$/.test(code) ||
      ['TimeoutError', 'AbortError', 'TypeError'].includes(error?.name);
    await record(transient ? 'unverified' : 'rejected', {reason: transient ? 'PROVIDER_OBSERVATION_UNAVAILABLE' :
      (/^PARIS_OPENHANDS_[A-Z_]+$/.test(code) ? code : 'PROVIDER_OBSERVATION_REJECTED')});
    return {handled: true, awaitingProvider: transient};
  }
  if (outcome.state !== 'ready') {
    await record(outcome.state);
    return {handled: true, awaitingProvider: outcome.state === 'pending'};
  }
  if (deps.now() - beganAt > 90_000) {
    await record('unverified', {reason: 'OBSERVATION_REQUEST_WINDOW_EXPIRED'});
    return {handled: true, awaitingProvider: true};
  }
  if (!await deps.sourceEligible()) {
    await record('source_ineligible');
    return {handled: true, awaitingProvider: false};
  }
  // Keep the original checkpoint and failure in history. A lost CAS or active
  // repair uniqueness conflict cannot dispatch another validation workflow.
  const claimed = await deps.claim({status: 'dispatched', candidate: outcome.candidate,
    workflow_run_id: null, error_code: null,
    verification: {...repair.verification, openhandsObservation: {state: 'ready',
      taskId: cp.taskId, originalRunId: cp.runId, checkedAt}},
    attempt_history: [...(repair.attempt_history ?? []), {event: 'accepted-provider-terminal-readback',
      at: checkedAt, error: repair.error_code, workflowRunId: repair.workflow_run_id,
      checkpoint: cp}], updated_at: checkedAt});
  return claimed ? {handled: true, dispatchRequired: true, repairId: repair.id} : {handled: true};
}
