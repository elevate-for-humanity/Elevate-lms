import { evaluateProtectedPullRequest, protectedMainPolicyVerified } from './acceptance-contract.mjs';

// Read-only GitHub verification. Does not approve, merge, dispatch or change repair status.
// Called by the existing signed PARIS reconciler before entering deployment.
export async function verifyProtectedParisMerge({ pr, expectedHeadSha, gh }) {
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
      gh('/rules/branches/main').catch(() => null),
      gh('/branches/main/protection').catch(() => null),
    ]);
    const protectionVerified = protectedMainPolicyVerified({ rules, classic });
    return evaluateProtectedPullRequest({
      pr, reviews, checks: checks.check_runs,
      ancestryVerified, protectionVerified,
    });
  } catch {
    return { accepted: false, reasons: ['PARIS_PROTECTED_PR_VERIFICATION_UNAVAILABLE'] };
  }
}
