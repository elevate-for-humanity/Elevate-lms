import 'server-only';

import { getSecret } from '@/lib/secrets';
import { getGitHubToken } from '@/lib/devstudio/github-token';
import { evaluateProtectedPullRequest } from './acceptance-contract.mjs';

const GH_API = 'https://api.github.com';
const DEFAULT_REPOSITORY = 'elevate-for-humanity/Elevate-lms';

export type OpenHandsGitHubEvidence = {
  verified: boolean;
  repository: string;
  branch?: {
    name: string;
    sha: string;
  } | null;
  pullRequests: Array<{
    number: number;
    state: string;
    draft: boolean;
    merged: boolean;
    headSha: string;
    headRef: string;
    baseRef: string;
    changedFiles: string[];
    combinedStatus: string | null;
    checkRuns: Array<{ name: string; status: string; conclusion: string | null }>;
  }>;
  reasons: string[];
};

function configuredRepository(): string {
  return (
    process.env.OPENHANDS_REPOSITORY?.trim() ||
    process.env.GITHUB_REPO?.trim() ||
    DEFAULT_REPOSITORY
  );
}

function normalizeRepo(repository?: string | null): string {
  const configured = configuredRepository();
  const requested = repository?.trim() || configured;
  if (requested.toLowerCase() !== configured.toLowerCase()) {
    throw new Error('GitHub verification refused a repository outside the configured OpenHands allowlist');
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(requested)) {
    throw new Error('Configured GitHub repository is invalid');
  }
  return requested;
}

async function githubToken(repository: string): Promise<string | undefined> {
  if (repository.toLowerCase() === DEFAULT_REPOSITORY.toLowerCase()) return (await getGitHubToken()) ?? undefined;
  return (
    (await getSecret('GITHUB_TOKEN')) ||
    (await getSecret('GH_TOKEN')) ||
    (await getSecret('GITHUB_PAT'))
  )?.trim();
}

async function gh<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`${GH_API}${path}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 300);
    throw new Error(`GitHub verification API ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  return response.json() as Promise<T>;
}

export async function verifyOpenHandsGitHubOutcome(input: {
  repository?: string | null;
  branch?: string | null;
  prNumbers?: number[] | null;
  startedAt?: string | null;
}): Promise<OpenHandsGitHubEvidence> {
  const repository = normalizeRepo(input.repository);
  const token = await githubToken(repository);
  const reasons: string[] = [];
  let branchEvidence: OpenHandsGitHubEvidence['branch'] = null;

  if (input.branch) {
    try {
      const branch = await gh<{ name?: string; commit?: { sha?: string } }>(
        `/repos/${repository}/branches/${encodeURIComponent(input.branch)}`,
        token,
      );
      if (branch.commit?.sha) {
        branchEvidence = { name: branch.name || input.branch, sha: branch.commit.sha };
        reasons.push(`Verified branch ${branchEvidence.name} at ${branchEvidence.sha.slice(0, 12)}.`);
      }
    } catch (error) {
      reasons.push(error instanceof Error ? error.message : String(error));
    }
  }

  const pullRequests: OpenHandsGitHubEvidence['pullRequests'] = [];
  for (const number of Array.from(new Set(input.prNumbers ?? [])).filter(Number.isInteger)) {
    try {
      const pr = await gh<{
        number: number;
        state: string;
        draft?: boolean;
        merged?: boolean;
        merged_at?: string | null;
        merge_commit_sha?: string | null;
        user?: { login?: string | null };
        created_at?: string;
        head?: { sha?: string; ref?: string };
        base?: { ref?: string };
      }>(`/repos/${repository}/pulls/${number}`, token);
      const headSha = pr.head?.sha || '';
      if (!headSha) {
        reasons.push(`PR #${number} did not expose a head commit SHA.`);
        continue;
      }
      const files = await gh<Array<{ filename?: string }>>(
        `/repos/${repository}/pulls/${number}/files?per_page=100`,
        token,
      );
      const status = await gh<{ state?: string }>(
        `/repos/${repository}/commits/${encodeURIComponent(headSha)}/status`,
        token,
      );
      const checks = await gh<{ check_runs?: Array<{ name?: string; status?: string; conclusion?: string | null }> }>(
        `/repos/${repository}/commits/${encodeURIComponent(headSha)}/check-runs?per_page=100`,
        token,
      );

      // A branch name or unrelated PR is not evidence that this task changed code.
      // When OpenHands supplied a branch, the PR must actually use it.
      if (input.branch && pr.head?.ref !== input.branch) {
        reasons.push(`PR #${number} head does not match the OpenHands branch.`);
        continue;
      }
      // Only evidence created after the canonical task started may establish completion.
      const startedAt = input.startedAt ? Date.parse(input.startedAt) : NaN;
      const prCreatedAt = pr.created_at ? Date.parse(pr.created_at) : NaN;
      if (!Number.isFinite(startedAt) || !Number.isFinite(prCreatedAt) || prCreatedAt < startedAt) {
        reasons.push(`PR #${number} predates the task or has no trustworthy creation timestamp.`);
        continue;
      }
      const changedFiles = files.map((file) => file.filename).filter((name): name is string => Boolean(name));
      const checkRuns = checks.check_runs ?? [];
      const successfulChecks = checkRuns.length > 0 && checkRuns.every(
        (check) => check.status === 'completed' && check.conclusion === 'success',
      );
      if (changedFiles.length === 0 || !successfulChecks ||
          !['success', 'pending'].includes(status.state ?? '') || status.state === 'failure') {
        reasons.push(`PR #${number} has no changed files, successful completed checks, or valid commit status.`);
        continue;
      }
      // GitHub CI success is not enough. Review the exact head, prove the
      // protected merge is reachable from main, and fail closed on uncertainty.
      const reviews = await gh<Array<{
        user?: { login?: string; type?: string };
        state?: string; commit_id?: string; submitted_at?: string;
      }>>(`/repos/${repository}/pulls/${number}/reviews?per_page=100`, token);
      let ancestryVerified = false;
      if (pr.merged && /^[a-f0-9]{40}$/i.test(pr.merge_commit_sha ?? '')) {
        const ancestry = await gh<{ status?: string }>(
          `/repos/${repository}/compare/${encodeURIComponent(pr.merge_commit_sha!)}...main`, token,
        );
        ancestryVerified = ['ahead', 'identical'].includes(ancestry.status ?? '');
      }
      // Verify the *effective* protected-main rules. A PR being merged does
      // not itself prove a required independent review was enforced.
      let protectionVerified = false;
      try {
        const rules = await gh<Array<{
          type?: string;
          parameters?: {
            required_approving_review_count?: number;
            required_status_checks?: Array<unknown>;
          };
        }>>(`/repos/${repository}/rules/branches/main`, token);
        const enforcedReviews = rules.some(rule => rule.type === 'pull_request' &&
          Number(rule.parameters?.required_approving_review_count ?? 0) >= 1);
        const enforcedChecks = rules.some(rule => rule.type === 'required_status_checks' &&
          (rule.parameters?.required_status_checks?.length ?? 0) > 0);
        protectionVerified = enforcedReviews && enforcedChecks;
      } catch {
        // Missing permissions to inspect branch protections are not PASS.
        reasons.push(`PR #${number} main branch protection readback unavailable.`);
      }
      const protectedAcceptance = evaluateProtectedPullRequest({
        pr, reviews, checks: checkRuns, ancestryVerified, protectionVerified,
      });
      if (!protectedAcceptance.accepted) {
        reasons.push(`PR #${number} lacks protected acceptance: ${protectedAcceptance.reasons.join('; ')}.`);
        continue;
      }
      pullRequests.push({
        number: pr.number,
        state: pr.state,
        draft: Boolean(pr.draft),
        merged: Boolean(pr.merged),
        headSha,
        headRef: pr.head?.ref || '',
        baseRef: pr.base?.ref || '',
        changedFiles,
        combinedStatus: status.state ?? null,
        checkRuns: (checks.check_runs ?? []).map((check) => ({
          name: check.name || 'unnamed',
          status: check.status || 'unknown',
          conclusion: check.conclusion ?? null,
        })),
      });
      reasons.push(`Verified GitHub PR #${pr.number} at ${headSha.slice(0, 12)}.`);
    } catch (error) {
      reasons.push(error instanceof Error ? error.message : String(error));
    }
  }

  // 'verified' means protected GitHub PR acceptance, NOT production recovery.
  // The original repair must independently match a durable release SHA and serving endpoints.
  // Branch existence alone is never an engineering completion gate.
  const verified = pullRequests.length > 0;
  if (!verified) {
    reasons.push('OpenHands did not provide a task-matching pull request with changed files and successful CI checks.');
  }

  return {
    verified,
    repository,
    branch: branchEvidence,
    pullRequests,
    reasons,
  };
}
