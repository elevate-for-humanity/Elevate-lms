// Pure acceptance predicates. They do not dispatch agents, approve work, or mutate repairs.
// GitHub review/merge evidence and production release evidence are separate stages.
const SHA = /^[a-f0-9]{40}$/i;

// Classic branch protections and repository rulesets may coexist; read both.
// An unreadable source cannot be interpreted as proof that protections exist.
export function protectedMainPolicyVerified({ rules = null, classic = null } = {}) {
  const rulesList = Array.isArray(rules) ? rules : [];
  const ruleReviews = rulesList.some(rule => rule.type === 'pull_request' &&
    Number(rule.parameters?.required_approving_review_count ?? 0) >= 1);
  const ruleChecks = rulesList.some(rule => rule.type === 'required_status_checks' &&
    (rule.parameters?.required_status_checks?.length ?? 0) > 0);
  const classicReviews = Number(classic?.required_pull_request_reviews?.required_approving_review_count ?? 0) >= 1;
  const classicChecks = (classic?.required_status_checks?.checks?.length ?? 0) > 0 ||
    (classic?.required_status_checks?.contexts?.length ?? 0) > 0;
  return (ruleReviews || classicReviews) && (ruleChecks || classicChecks);
}

export function requiredMainChecks({ rules = null, classic = null } = {}) {
  const names = new Set();
  for (const rule of Array.isArray(rules) ? rules : []) {
    if (rule?.type !== 'required_status_checks') continue;
    for (const check of rule.parameters?.required_status_checks ?? []) {
      const name = typeof check === 'string' ? check : check?.context;
      if (typeof name === 'string' && name.trim()) names.add(name.trim());
    }
  }
  for (const check of classic?.required_status_checks?.checks ?? []) {
    if (typeof check?.context === 'string' && check.context.trim()) names.add(check.context.trim());
  }
  for (const check of classic?.required_status_checks?.contexts ?? []) {
    if (typeof check === 'string' && check.trim()) names.add(check.trim());
  }
  return [...names];
}

export function evaluateProtectedPullRequest({
  pr, reviews = [], checks = [], statuses = [], requiredChecks = [],
  ancestryVerified = false, protectionVerified = false,
}) {
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
  if (!Array.isArray(checks) || checks.length >= 100 ||
      !Array.isArray(statuses) || statuses.length >= 100 ||
      (checks.length === 0 && statuses.length === 0) ||
      !Array.isArray(requiredChecks) || requiredChecks.length === 0) {
    reasons.push('Required latest-head CI evidence is missing or truncated');
  } else {
    // Optional operational checks may deliberately SKIP PR events. Never
    // accept a skipped required validation check, or any known failing check.
    const checksByName = new Map(checks.filter(check => typeof check.name === 'string')
      .map(check => [check.name, check]));
    // GitHub's commit statuses endpoint returns newest first. A context may
    // have older failed attempts: only the latest state is authoritative.
    const statusesByName = new Map();
    for (const entry of statuses) {
      if (typeof entry.context === 'string' && !statusesByName.has(entry.context)) {
        statusesByName.set(entry.context, entry);
      }
    }
    if (checks.some(check => ['failure', 'cancelled', 'timed_out', 'action_required', 'startup_failure'].includes(check.conclusion) ||
        (check.conclusion !== 'skipped' && check.status !== 'completed'))) {
      reasons.push('Latest-head CI includes failed or incomplete checks');
    }
    for (const required of requiredChecks) {
      const check = checksByName.get(required);
      const status = statusesByName.get(required);
      const checkPassed = check?.status === 'completed' && check?.conclusion === 'success';
      const statusPassed = status?.state === 'success';
      if (!checkPassed && !statusPassed) {
        reasons.push(`Required check/status ${required} is missing or not successful`);
      }
    }
  }
  if (!Array.isArray(reviews) || reviews.length >= 100) {
    reasons.push('Independent reviews are missing or pagination is incomplete');
  } else {
    const latest = new Map();
    for (const review of reviews) {
      const reviewer = review.user?.login?.toLowerCase();
      if (!reviewer) continue;
      // COMMENTED does not revoke an existing approval. Only decision states do.
      if (!['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) continue;
      const previous = latest.get(reviewer);
      if (!previous || Date.parse(review.submitted_at ?? '') >= Date.parse(previous.submitted_at ?? '')) {
        latest.set(reviewer, review);
      }
    }
    const author = pr?.user?.login?.toLowerCase();
    if (!author) reasons.push('PR author identity not independently verified');
    const approved = [...latest.values()].some(review =>
      review.state === 'APPROVED' &&
      Number.isFinite(Date.parse(review.submitted_at ?? '')) &&
      Boolean(author) &&
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
  originalRepairId, repair, correlatedTask, originalTaskId, providerStartTaskId,
  providerConversationId, mergeSha, deployedSha = mergeSha, releaseAncestryVerified = false,
  services = [], originalDefectRegressionPassed,
}) {
  const reasons = [];
  if (!originalRepairId || repair?.id !== originalRepairId) reasons.push('Original repair ID mismatch');
  if (!correlatedTask || correlatedTask.tool_name !== 'openhands.execute' ||
      !originalRepairId || !correlatedTask.correlation_id?.startsWith(`paris-repair:${originalRepairId}:attempt:`)) {
    reasons.push('OpenHands correlation does not identify the original repair');
  }
  if (!originalTaskId || correlatedTask?.id !== originalTaskId ||
      !providerStartTaskId || correlatedTask?.tool_output?.start_task_id !== providerStartTaskId ||
      !providerConversationId || correlatedTask?.tool_output?.conversation_id !== providerConversationId) {
    reasons.push('Original task and provider conversation/start receipts do not match');
  }
  if (repair?.status !== 'verified' || !SHA.test(repair?.release_sha ?? '')) {
    reasons.push('Original repair has no durable accepted release SHA');
  }
  if (!SHA.test(mergeSha ?? '') || repair?.release_sha !== mergeSha) {
    reasons.push('Accepted repair SHA does not match protected merge SHA');
  }
  if (!SHA.test(deployedSha ?? '') ||
      (deployedSha !== mergeSha && !releaseAncestryVerified)) {
    reasons.push('Exact deployed SHA lacks independently verified merge ancestry');
  }
  if (!Array.isArray(services) || services.length === 0 ||
      services.some(s => !s.ready || !SHA.test(s.servingSha ?? '') || s.servingSha !== deployedSha)) {
    reasons.push('Independent serving version/readiness evidence does not match exact deployed SHA');
  }
  if (originalDefectRegressionPassed !== true) reasons.push('Original production defect regression is not verified');
  return { accepted: reasons.length === 0, reasons, originalRepairId: originalRepairId ?? null };
}
