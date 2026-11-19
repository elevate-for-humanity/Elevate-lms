/** Real exact-main CI gate for the existing PARIS deployment reconciler.
 * No release is dispatched here. A saved request intent prevents duplicate CI
 * dispatch during upstream API lag; a bounded missing-run wait fails closed.
 */
/** A recorded exact-main CI dispatch owns its observation window; the generic
 * 30-minute in-flight requeue must not erase that durable intent first.
 * The canonical CI reconciler evaluates completion/expiry and blocks on
 * REPAIR_MAIN_CI_NOT_OBSERVED without replaying or resetting attempts. */
export function hasDurableMainCIObservation(repair) {
  if (!['deploying', 'verifying'].includes(repair?.status)) return false;
  const reconciliation = repair.verification?.releaseReconciliation;
  const sha = reconciliation?.state === 'validated-newer-target'
    ? reconciliation.currentMainSha : repair.release_sha;
  if (!/^[a-f0-9]{40}$/.test(sha ?? '')) return false;
  const recorded = repair.verification?.mainCIRequest;
  if (recorded?.sha === sha && Number.isFinite(Date.parse(recorded.requestedAt ?? ''))) return true;
  const merge = repair.verification?.protectedMergeResult;
  return merge?.mergeCommitSha === sha &&
    ['PARIS_MERGE_MAIN_CI_REQUESTED', 'PARIS_MERGE_MAIN_CI_DISPATCH_FAILED'].includes(merge.reason) &&
    Number.isFinite(Date.parse(merge.at ?? ''));
}

/** Only an observed, successful exact-main required-gate receipt may unlock
 * deployment and runtime acceptance for this repair SHA. */
export function isVerifiedMainCIReceipt(result) {
  return result?.state === 'verified' && Number.isSafeInteger(result?.runId) && result.runId > 0;
}

export async function ensureRepairMainCI({ repository, sha, runs, priorRequest, gh, persistIntent,
  now = Date.now(), observationWindowMs }) {
  if (!/^[a-f0-9]{40}$/.test(sha ?? '') || !Number.isSafeInteger(observationWindowMs) || observationWindowMs <= 0)
    return { state: 'blocked', reason: 'REPAIR_MAIN_CI_IDENTITY_REQUIRED' };
  if (!Array.isArray(runs) || runs.length >= 100)
    return { state: 'blocked', reason: 'REPAIR_RUN_INVENTORY_INCOMPLETE' };
  const candidates = runs.filter(run => run.head_sha === sha && run.name === 'CI' &&
    run.path === '.github/workflows/ci.yml' && run.head_branch === 'main' &&
    ['push', 'workflow_dispatch'].includes(run.event) && run.head_repository?.full_name === repository)
    .sort((a, b) => b.id - a.id || (b.run_attempt || 1) - (a.run_attempt || 1));
  const main = await gh('/git/ref/heads/main');
  if (main.object?.sha !== sha) return { state: 'superseded' };
  const latest = candidates[0];
  if (latest) {
    if (latest.status !== 'completed') return { state: 'pending' };
    if (latest.conclusion !== 'success') return { state: 'blocked', reason: 'REPAIR_REQUIRED_MAIN_CI_FAILED' };
    const jobs = await gh(`/actions/runs/${latest.id}/jobs?per_page=100`);
    if (!Array.isArray(jobs.jobs) || jobs.jobs.length >= 100)
      return { state: 'blocked', reason: 'REPAIR_MAIN_CI_JOBS_INCOMPLETE' };
    const gates = jobs.jobs.filter(job => job.name === 'CI Required Gate');
    if (!gates.length) return { state: 'blocked', reason: 'REPAIR_MAIN_CI_GATE_MISSING' };
    if (gates.some(job => job.status !== 'completed')) return { state: 'pending' };
    if (gates.some(job => job.conclusion !== 'success')) return { state: 'blocked', reason: 'REPAIR_MAIN_CI_GATE_FAILED' };
    const finalMain = await gh('/git/ref/heads/main');
    return finalMain.object?.sha === sha ? { state: 'verified', runId: latest.id } : { state: 'superseded' };
  }
  if (priorRequest?.sha === sha) {
    const started = Date.parse(priorRequest.requestedAt ?? '');
    return Number.isFinite(started) && now - started >= 0 && now - started < observationWindowMs
      ? { state: 'pending' } : { state: 'blocked', reason: 'REPAIR_MAIN_CI_NOT_OBSERVED' };
  }
  await persistIntent({ sha, requestedAt: new Date(now).toISOString() });
  try {
    await gh('/actions/workflows/ci.yml/dispatches', { method: 'POST', body: JSON.stringify({ ref: 'main', inputs: { requested_sha: sha } }) });
    return { state: 'pending' };
  } catch {
    return { state: 'blocked', reason: 'REPAIR_MAIN_CI_DISPATCH_FAILED' };
  }
}
