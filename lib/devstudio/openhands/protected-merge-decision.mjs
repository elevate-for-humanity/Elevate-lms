// Pure merge preconditions for a verified PARIS repair PR. No I/O, no mutation.
// The merge itself is performed by the signed protected-merge workflow using the
// independent verifier identity; these predicates decide whether it is safe to
// approve and merge the exact validated head.

const SHA = /^[a-f0-9]{40}$/i;

/** Normalize a required-check descriptor from requiredMainChecks() into
 * {context, appId}. A pinned app id must match; an unpinned context accepts any. */
function requiredDescriptors(requiredChecks = []) {
  return requiredChecks.map(entry =>
    typeof entry === 'string'
      ? { context: entry, appId: null }
      : { context: entry?.context, appId: Number.isSafeInteger(entry?.app_id) && entry.app_id > 0 ? entry.app_id : null },
  ).filter(entry => typeof entry.context === 'string' && entry.context.trim());
}

/** The single required status check on protected main is authoritative. Every
 * required context must have a completed, successful run for its policy App on
 * the exact head. A missing or non-successful required check blocks the merge. */
export function requiredChecksSatisfied({ checks = [], requiredChecks = [] }) {
  const reasons = [];
  const descriptors = requiredDescriptors(requiredChecks);
  if (descriptors.length === 0) {
    reasons.push('Required status check policy is not verifiable');
    return { satisfied: false, reasons };
  }
  const latestByName = new Map();
  for (const check of Array.isArray(checks) ? checks : []) {
    if (typeof check?.name !== 'string') continue;
    const current = latestByName.get(check.name) ?? [];
    current.push(check);
    latestByName.set(check.name, current);
  }
  for (const { context, appId } of descriptors) {
    const runs = (latestByName.get(context) ?? []).filter(check =>
      appId === null || (check.app?.id ?? check.app_id) === appId);
    const passed = runs.length > 0 &&
      runs.every(check => check.status === 'completed' && check.conclusion === 'success');
    if (!passed) reasons.push(`Required check ${context} is missing or not successful on the exact head`);
  }
  return { satisfied: reasons.length === 0, reasons };
}

/** An authorized reviewer's outstanding CHANGES_REQUESTED blocks a merge.
 * COMMENTED does not revoke an approval; only decision states do.
 * Fail closed: an unresolvable ('unknown') permission is treated as authorized
 * so a change request from an unverifiable reviewer still blocks the merge. */
export function blockingReviewPresent({ reviews = [], reviewerPermissions = {} } = {}) {
  const blocking = login => {
    const permission = reviewerPermissions?.[login] ?? 'unknown';
    // 'read'/'none' cannot block; every other value (including 'unknown') can.
    return !['read', 'none'].includes(permission);
  };
  const latest = new Map();
  for (const review of Array.isArray(reviews) ? reviews : []) {
    const login = review?.user?.login?.toLowerCase();
    if (!login) continue;
    if (!['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) continue;
    const previous = latest.get(login);
    if (!previous || Date.parse(review.submitted_at ?? '') >= Date.parse(previous.submitted_at ?? '')) {
      latest.set(login, review);
    }
  }
  return [...latest.values()].some(review =>
    review.state === 'CHANGES_REQUESTED' && blocking(review.user?.login?.toLowerCase()));
}

/** Independent approvals on the exact head that can satisfy protected review:
 * latest decision per reviewer is APPROVED, on the head, not the author, not a
 * bot, and from a verified write/maintain/admin collaborator. */
export function approvalsSatisfied({
  pr, expectedHeadSha, reviews = [], reviewerPermissions = {}, requiredApprovalCount,
}) {
  const reasons = [];
  if (!Number.isSafeInteger(requiredApprovalCount) || requiredApprovalCount < 1) {
    reasons.push('Required independent review count was not verifiable');
  }
  if (!Array.isArray(reviews) || reviews.length >= 100) {
    reasons.push('Independent reviews are missing or pagination is incomplete');
    return { satisfied: false, approvals: 0, reasons };
  }
  const author = pr?.user?.login?.toLowerCase();
  if (!author) reasons.push('PR author identity not independently verified');
  const latest = new Map();
  for (const review of reviews) {
    const login = review?.user?.login?.toLowerCase();
    if (!login) continue;
    if (!['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) continue;
    const previous = latest.get(login);
    if (!previous || Date.parse(review.submitted_at ?? '') >= Date.parse(previous.submitted_at ?? '')) {
      latest.set(login, review);
    }
  }
  const approvals = [...latest.values()].filter(review => {
    const login = review.user.login.toLowerCase();
    return review.state === 'APPROVED' &&
      Number.isFinite(Date.parse(review.submitted_at ?? '')) &&
      Boolean(author) && login !== author &&
      review.commit_id === expectedHeadSha &&
      !review.user?.type?.toLowerCase().includes('bot') &&
      ['write', 'maintain', 'admin'].includes(reviewerPermissions?.[login] ?? 'unknown');
  }).length;
  if (approvals < requiredApprovalCount) {
    reasons.push(`Insufficient independent authorized approvals on the exact PR head (${approvals} of ${requiredApprovalCount})`);
  }
  return { satisfied: reasons.length === 0, approvals, reasons };
}

/** Full pre-approval precondition set for the protected-merge workflow. The
 * approval count itself is proven by approvalsSatisfied() after the verifier's
 * own review, immediately before merge. */
export function protectedMergeReadiness({
  pr, expectedHeadSha, checks = [], requiredChecks = [], reviews = [], reviewerPermissions = {},
  requiredApprovalCount,
}) {
  const reasons = [];
  if (!pr || pr.state !== 'open' || pr.merged === true) reasons.push('PR is not an open, unmerged pull request');
  if (pr?.draft === true) reasons.push('Draft pull requests cannot be merged');
  if (pr?.base?.ref !== 'main') reasons.push('PR does not target protected main');
  if (!SHA.test(expectedHeadSha ?? '')) reasons.push('Expected head SHA is invalid');
  if (pr?.head?.sha !== expectedHeadSha) reasons.push('PR head moved since independent validation');
  const required = requiredChecksSatisfied({ checks, requiredChecks });
  reasons.push(...required.reasons);
  if (blockingReviewPresent({ reviews, reviewerPermissions })) {
    reasons.push('An authorized reviewer has outstanding changes requested');
  }
  if (!Number.isSafeInteger(requiredApprovalCount) || requiredApprovalCount < 1) {
    reasons.push('Required independent review count was not verifiable');
  }
  if (!Array.isArray(reviews) || reviews.length >= 100) {
    reasons.push('Independent reviews are missing or pagination is incomplete');
  }
  return { ready: reasons.length === 0, reasons };
}
