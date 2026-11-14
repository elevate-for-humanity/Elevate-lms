import { evaluateProtectedPullRequest, protectedMainPolicyVerified, requiredMainChecks, requiredMainReviewCount } from './acceptance-contract.mjs';

// Read-only GitHub verification. Does not approve, merge, dispatch or change repair status.
// Called by the existing signed PARIS reconciler before entering deployment.
async function readOptionalPolicy(reader, path) {
  try {
    return await reader(path);
  } catch (error) {
    // GitHub returns 404 for absent classic protection. Only a verifiable
    // absence may be ignored. 401/403/5xx/network/pagination failures block.
    const status = error?.status ?? error?.response?.status;
    if (status === 404 || (!status && /(?:^|\s)(?:API|HTTP)\s+404(?:\b|:)/.test(String(error?.message ?? '')))) {
      return null;
    }
    throw error;
  }
}
export async function verifyProtectedParisMerge({ pr, expectedHeadSha, gh, policyGh = gh }) {
  if (!pr || !/^[a-f0-9]{40}$/i.test(expectedHeadSha ?? '') || pr.head?.sha !== expectedHeadSha) {
    return { accepted: false, reasons: ['PARIS_PR_HEAD_CHANGED'] };
  }
  const number = pr.number;
  if (!Number.isInteger(number) || number < 1) {
    return { accepted: false, reasons: ['PARIS_PR_NUMBER_MISSING'] };
  }
  try {
    const reviews = await gh(`/pulls/${number}/reviews?per_page=100`);
    const checks = await gh(`/commits/${expectedHeadSha}/check-runs?per_page=100`);
    const statuses = await gh(`/commits/${expectedHeadSha}/statuses?per_page=100`);
    const main = await gh('/git/ref/heads/main');
    const mainSha = main.object?.sha;
    if (!/^[a-f0-9]{40}$/i.test(mainSha ?? '')) {
      return { accepted: false, reasons: ['PARIS_MAIN_SHA_NOT_VERIFIED'] };
    }
    let ancestryVerified = false;
    if (pr.merged === true && /^[a-f0-9]{40}$/i.test(pr.merge_commit_sha ?? '')) {
      const ancestry = await gh(`/compare/${pr.merge_commit_sha}...${mainSha}`);
      ancestryVerified = ['ahead', 'identical'].includes(ancestry.status);
    }
    const [rules, classic] = await Promise.all([
      readOptionalPolicy(policyGh, '/rules/branches/main'),
      readOptionalPolicy(policyGh, '/branches/main/protection'),
    ]);
    const protectionVerified = protectedMainPolicyVerified({ rules, classic });
    const requiredChecks = requiredMainChecks({ rules, classic });
    const requiredApprovalCount = requiredMainReviewCount({ rules, classic });
    const reviewerPermissions = {};
    // An APPROVED label alone does not prove the reviewer has write access.
    // Reuse the policy credential to read actual repository collaborator rights.
    const decisionLogins = new Set(reviews.filter(review =>
      ['APPROVED', 'CHANGES_REQUESTED'].includes(review.state))
      .map(review => review.user?.login?.toLowerCase()).filter(Boolean));
    for (const login of decisionLogins) {
      if (!/^[a-z0-9](?:[a-z0-9-]{0,38})$/.test(login)) continue;
      try {
        const collaborator = await policyGh('/collaborators/' + encodeURIComponent(login) + '/permission');
        reviewerPermissions[login] = collaborator?.permission ?? 'unknown';
      } catch {
        reviewerPermissions[login] = 'unknown'; // Fail closed; never infer reviewer rights.
      }
    }
    return evaluateProtectedPullRequest({
      pr, reviews, checks: checks.check_runs, statuses, requiredChecks,
      ancestryVerified, protectionVerified, reviewerPermissions, requiredApprovalCount,
    });
  } catch {
    return { accepted: false, reasons: ['PARIS_PROTECTED_PR_VERIFICATION_UNAVAILABLE'] };
  }
}
