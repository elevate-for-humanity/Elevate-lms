import 'server-only';

import { getSecret } from '@/lib/secrets';

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

async function githubToken(): Promise<string | undefined> {
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
}): Promise<OpenHandsGitHubEvidence> {
  const repository = normalizeRepo(input.repository);
  const token = await githubToken();
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
      ).catch(() => ({ state: undefined }));
      const checks = await gh<{ check_runs?: Array<{ name?: string; status?: string; conclusion?: string | null }> }>(
        `/repos/${repository}/commits/${encodeURIComponent(headSha)}/check-runs?per_page=100`,
        token,
      ).catch(() => ({ check_runs: [] }));

      pullRequests.push({
        number: pr.number,
        state: pr.state,
        draft: Boolean(pr.draft),
        merged: Boolean(pr.merged),
        headSha,
        headRef: pr.head?.ref || '',
        baseRef: pr.base?.ref || '',
        changedFiles: files.map((file) => file.filename).filter((name): name is string => Boolean(name)),
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

  const verified = Boolean(branchEvidence || pullRequests.length);
  if (!verified) {
    reasons.push('OpenHands reported no GitHub branch or pull request that could be independently verified.');
  }

  return {
    verified,
    repository,
    branch: branchEvidence,
    pullRequests,
    reasons,
  };
}
