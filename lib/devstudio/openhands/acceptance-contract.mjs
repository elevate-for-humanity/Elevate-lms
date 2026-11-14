// Pure acceptance predicates. They do not dispatch agents, approve work, or mutate repairs.
// GitHub review/merge evidence and production release evidence are separate stages.
const SHA = /^[a-f0-9]{40}$/i;

export function evaluateProtectedPullRequest({ pr, reviews = [], checks = [], ancestryVerified = false, protectionVerified = false }) {
  const reasons = [];
  const head = pr?.head?.sha;
  const mergeSha = pr?.merge_commit_sha;
  if (!SHA.test(head ?? '')) reasons.push('Missing exact PR head SHA');
  if (pr?.base?.ref !== 'main') reasons.push('PR does not target protected main');
  if (pr?.merged !== true || !pr?.merged_at || !SHA.test(mergeSha ?? '')) {
    reasons.push('Protected merge commit is not verified');
  }
  if (!ancestryVerified) reasons.push('Merge SHA is not independently verified as an ancestor of main');
  if (!protectionVerified) reasons.push('Required PR approval and CI protections are not verified for main');
  if (!Array.isArray(checks) || checks.length === 0 || checks.length >= 100 ||
      checks.some(check => check.status !== 'completed' || check.conclusion !== 'success')) {
    reasons.push('Latest-head CI checks are missing, incomplete, failed, or truncated');
  }
  if (!Array.isArray(reviews) || reviews.length >= 100) {
    reasons.push('Independent reviews are missing or pagination is incomplete');
  } else {
    const latest = new Map();
    for (const review of reviews) {
      const reviewer = review.user?.login?.toLowerCase();
      if (!reviewer) continue;
      const previous = latest.get(reviewer);
      if (!previous || Date.parse(review.submitted_at ?? '') >= Date.parse(previous.submitted_at ?? '')) {
        latest.set(reviewer, review);
      }
    }
    const author = pr?.user?.login?.toLowerCase();
    const approved = [...latest.values()].some(review =>
      review.state === 'APPROVED' &&
      review.commit_id === head &&
      review.user?.login?.toLowerCase() !== author &&
      !review.user?.type?.toLowerCase().includes('bot')
    );
    if (!approved) reasons.push('No independent approving review on the exact PR head');
  }
  return { accepted: reasons.length === 0, reasons, headSha: head ?? null, mergeSha: mergeSha ?? null };
}

// A merged PR, a green deployment job, or /api/ready alone is NOT an accepted PARIS repair.
// An authorized release reconciler must persist the original repair receipt separately.
export function evaluateOriginalRepairAcceptance({
  originalRepairId, repair, correlatedTask, mergeSha, services = [], originalDefectRegressionPassed,
}) {
  const reasons = [];
  if (!originalRepairId || repair?.id !== originalRepairId) reasons.push('Original repair ID mismatch');
  if (!correlatedTask || correlatedTask.tool_name !== 'openhands.execute' ||
      !correlatedTask.correlation_id) reasons.push('Original correlated OpenHands task missing');
  if (repair?.status !== 'verified' || !SHA.test(repair?.release_sha ?? '')) {
    reasons.push('Original repair has no durable accepted release SHA');
  }
  if (!SHA.test(mergeSha ?? '') || repair?.release_sha !== mergeSha) {
    reasons.push('Accepted repair SHA does not match protected merge SHA');
  }
  if (!Array.isArray(services) || services.length === 0 ||
      services.some(s => !s.ready || !SHA.test(s.servingSha ?? '') || s.servingSha !== mergeSha)) {
    reasons.push('Independent serving version/readiness evidence does not match exact merge SHA');
  }
  if (originalDefectRegressionPassed !== true) reasons.push('Original production defect regression is not verified');
  return { accepted: reasons.length === 0, reasons, originalRepairId: originalRepairId ?? null };
}
