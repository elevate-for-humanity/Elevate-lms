const endpoint = 'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/branches/main/protection';

/** Fixed repository, GET only, and an explicit App identity supplied server-side. */
export async function readGitHubBranchPolicy(token, request = fetch) {
  if (!token) return { ok: false, reason: 'github_app_not_configured' };
  const response = await request(endpoint, {
    method: 'GET', redirect: 'error', cache: 'no-store',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return { ok: false, status: response.status,
    reason: response.status === 403 ? 'github_app_administration_read_required' : 'github_branch_policy_unavailable' };
  const policy = await response.json();
  const reviews = policy.required_pull_request_reviews;
  return { ok: true, status: response.status, credentialSource: 'github-app-installation', repository: 'elevate-for-humanity/Elevate-lms', branch: 'main',
    policy: {
      requiredChecks: (policy.required_status_checks?.checks ?? []).map(check => ({ context: check.context, appId: check.app_id })),
      upToDateRequired: policy.required_status_checks?.strict === true,
      pullRequestRequired: Boolean(reviews), requiredApprovals: reviews?.required_approving_review_count ?? 0,
      dismissStaleApprovals: reviews?.dismiss_stale_reviews === true,
      codeOwnerReviewRequired: reviews?.require_code_owner_reviews === true,
      latestPushApprovalRequired: reviews?.require_last_push_approval === true,
      conversationResolutionRequired: policy.required_conversation_resolution?.enabled === true,
      enforceAdmins: policy.enforce_admins?.enabled === true,
      forcePushesAllowed: policy.allow_force_pushes?.enabled === true,
      deletionsAllowed: policy.allow_deletions?.enabled === true,
      branchLocked: policy.lock_branch?.enabled === true,
    } };
}
