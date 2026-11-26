/**
 * GitHub branch authority — pure helpers for PR1 (#2070).
 *
 * A 403 from POST /git/refs used to surface as a generic GitHub API failure,
 * indistinguishable from a search or contents 403. Branch creation needs
 * `push` permission on the repository; this module classifies that failure
 * distinctly (GITHUB_APP_403_BRANCH) so a repair receipt can say "the App
 * cannot create branches" instead of "GitHub failed".
 *
 * Dependency-free on purpose: unit-tested without any credential or network.
 */

export const GITHUB_APP_403_BRANCH = 'GITHUB_APP_403_BRANCH';
export const GITHUB_BRANCH_AUTHORITY_UNKNOWN = 'GITHUB_BRANCH_AUTHORITY_UNKNOWN';

export function githubBranchAuthorityError(detail?: string): Error {
  return new Error(
    `${GITHUB_APP_403_BRANCH}: The configured GitHub App or token cannot create ` +
      `branches in elevate-for-humanity/Elevate-lms (POST /git/refs was forbidden). ` +
      `Grant the App installation Contents: write permission on the repository and ` +
      `re-run the repair; no branch was created.${detail ? ` ${detail}` : ''}`,
  );
}

export function isGitHubBranchAuthorityError(error: unknown): boolean {
  return error instanceof Error && error.message.includes(GITHUB_APP_403_BRANCH);
}

/**
 * Classify the `permissions` object GitHub returns for the authenticated
 * token/App on GET /repos/{owner}/{repo}.
 * 'push' — branch creation is authorised. 'no-push' — it is not.
 * 'unknown' — GitHub did not report permissions; fail closed, do not guess.
 */
export function classifyRepoBranchPermission(
  permissions: unknown,
): 'push' | 'no-push' | 'unknown' {
  if (!permissions || typeof permissions !== 'object') return 'unknown';
  const push = (permissions as { push?: unknown }).push;
  if (push === true) return 'push';
  if (push === false) return 'no-push';
  return 'unknown';
}
