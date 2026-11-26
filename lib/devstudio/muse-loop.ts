/**
 * lib/devstudio/muse-loop.ts
 *
 * The Muse-style change loop, runnable from Dev Studio.
 *
 * What Muse does in this repo (via the Meta Muse AI GitHub App, installed
 * 2026-11-23 on the elevate-for-humanity org, Elevate-lms only):
 *   read repo -> make a real change on a branch -> open a PR -> check CI -> report back.
 *
 * Dev Studio's existing code-fix path (OpenHands) cannot do that loop today:
 * it dispatches through OpenHands (29 tasks, 22 failed, 0 completed; key
 * untested since 2026-09-15) and fails closed on a missing PARIS start
 * receipt / pending approval. This module drives the same loop directly
 * through the GitHub API using the existing PARIS GitHub App token resolver
 * (lib/devstudio/github-token.ts), with no OpenHands dependency.
 *
 * Rules:
 * - Server-only. No secrets in code; the token comes from getGitHubHeaders().
 * - Fail closed: a missing GitHub credential, a missing base SHA, a rejected
 *   branch, or a failed check all throw with a MUSE_LOOP_* code. Nothing is
 *   silently skipped and nothing is merged here — this module only opens
 *   draft-ready PRs; merging is a separate, human decision.
 * - Never writes to main. Branches only.
 * - Blocked paths (secrets, keys, env files) are refused before any call.
 * - `fetchImpl` exists so unit tests can inject a mocked GitHub API.
 */

import 'server-only';

import { getGitHubHeaders } from '@/lib/devstudio/github-token';

export const MUSE_LOOP_REPOSITORY = 'elevate-for-humanity/Elevate-lms';
const GITHUB_API = 'https://api.github.com';

export type MuseLoopFileChange = {
  path: string;
  content: string;
};

export type MuseLoopInput = {
  /** Branch to create, e.g. `studio/fix-login-bounce`. Must not be `main`. */
  branch: string;
  title: string;
  body: string;
  /** Commit message for the change. */
  message: string;
  files: MuseLoopFileChange[];
  /** Base branch. Defaults to `main`. */
  base?: string;
  /** Open the PR as a draft. Defaults to true. */
  draft?: boolean;
};

export type MuseLoopCheckSummary = {
  state: 'success' | 'failure' | 'pending' | 'unknown';
  conclusions: string[];
};

export type MuseLoopResult = {
  repository: string;
  branch: string;
  baseSha: string;
  headSha: string;
  prNumber: number;
  prUrl: string;
  checks: MuseLoopCheckSummary;
};

export type MuseLoopPlanStep = {
  order: number;
  step: string;
  detail: string;
};

const BLOCKED_PATH_SEGMENTS = [
  '.env',
  'credentials',
  'secrets',
  '.pem',
  '.key',
  'id_rsa',
];

function isBlockedPath(path: string): boolean {
  const lower = path.toLowerCase();
  if (lower.startsWith('/') || lower.includes('..')) return true;
  return BLOCKED_PATH_SEGMENTS.some((segment) => lower.includes(segment));
}

export function validateMuseLoopInput(input: MuseLoopInput): string[] {
  const errors: string[] = [];
  if (!input.branch || !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,120}$/.test(input.branch)) {
    errors.push('MUSE_LOOP_INVALID_BRANCH');
  }
  if (input.branch === 'main' || input.branch === (input.base ?? 'main')) {
    errors.push('MUSE_LOOP_BRANCH_MUST_NOT_BE_BASE');
  }
  if (!input.title?.trim()) errors.push('MUSE_LOOP_TITLE_REQUIRED');
  if (!input.body?.trim()) errors.push('MUSE_LOOP_BODY_REQUIRED');
  if (!input.message?.trim()) errors.push('MUSE_LOOP_MESSAGE_REQUIRED');
  if (!Array.isArray(input.files) || input.files.length === 0) {
    errors.push('MUSE_LOOP_FILES_REQUIRED');
  }
  if (Array.isArray(input.files) && input.files.length > 20) {
    errors.push('MUSE_LOOP_TOO_MANY_FILES');
  }
  for (const file of input.files ?? []) {
    if (!file.path || isBlockedPath(file.path)) {
      errors.push(`MUSE_LOOP_BLOCKED_PATH:${file.path}`);
    }
    if (typeof file.content !== 'string' || file.content.length > 200_000) {
      errors.push(`MUSE_LOOP_FILE_TOO_LARGE:${file.path}`);
    }
  }
  return errors;
}

/** The loop as a plan — no GitHub calls, safe to show before executing. */
export function planMuseLoop(input: MuseLoopInput): MuseLoopPlanStep[] {
  const errors = validateMuseLoopInput(input);
  if (errors.length > 0) throw new Error(errors[0]);
  const base = input.base ?? 'main';
  return [
    { order: 1, step: 'read-base', detail: `Read ${base} HEAD of ${MUSE_LOOP_REPOSITORY}.` },
    { order: 2, step: 'create-branch', detail: `Create branch ${input.branch} from ${base}.` },
    {
      order: 3,
      step: 'commit-files',
      detail: `Commit ${input.files.length} file(s) on ${input.branch}: ${input.files.map((f) => f.path).join(', ')}.`,
    },
    {
      order: 4,
      step: 'open-pr',
      detail: `Open ${input.draft === false ? '' : 'draft '}PR "${input.title}" from ${input.branch} to ${base}.`,
    },
    { order: 5, step: 'check-ci', detail: 'Read the PR combined status and check runs.' },
  ];
}

type FetchImpl = typeof fetch;

async function githubApi<T>(
  path: string,
  init: RequestInit,
  fetchImpl: FetchImpl,
): Promise<T> {
  const headers = await getGitHubHeaders();
  const response = await fetchImpl(`${GITHUB_API}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers ?? {}) },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`MUSE_LOOP_GITHUB_HTTP_${response.status}`);
  }
  return (await response.json()) as T;
}

async function getMainSha(base: string, fetchImpl: FetchImpl): Promise<string> {
  const ref = await githubApi<{ object?: { sha?: string } }>(
    `/repos/${MUSE_LOOP_REPOSITORY}/git/ref/heads/${encodeURIComponent(base)}`,
    {},
    fetchImpl,
  );
  const sha = ref.object?.sha;
  if (!sha || !/^[a-f0-9]{40}$/.test(sha)) throw new Error('MUSE_LOOP_BASE_SHA_MISSING');
  return sha;
}

async function createBranch(branch: string, baseSha: string, fetchImpl: FetchImpl): Promise<void> {
  try {
    await githubApi(`/repos/${MUSE_LOOP_REPOSITORY}/git/ref/heads/${encodeURIComponent(branch)}`, {}, fetchImpl);
    throw new Error('MUSE_LOOP_BRANCH_ALREADY_EXISTS');
  } catch (error) {
    if (error instanceof Error && error.message === 'MUSE_LOOP_BRANCH_ALREADY_EXISTS') throw error;
    // 404 = branch does not exist yet, which is what we want.
    if (!(error instanceof Error) || error.message !== 'MUSE_LOOP_GITHUB_HTTP_404') throw error;
  }
  await githubApi(
    `/repos/${MUSE_LOOP_REPOSITORY}/git/refs`,
    {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
    },
    fetchImpl,
  );
}

async function commitFiles(
  branch: string,
  baseSha: string,
  files: MuseLoopFileChange[],
  message: string,
  fetchImpl: FetchImpl,
): Promise<string> {
  const blobs = await Promise.all(
    files.map(async (file) => {
      const blob = await githubApi<{ sha: string }>(
        `/repos/${MUSE_LOOP_REPOSITORY}/git/blobs`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: Buffer.from(file.content, 'utf8').toString('base64'),
            encoding: 'base64',
          }),
        },
        fetchImpl,
      );
      return { path: file.path, mode: '100644' as const, type: 'blob' as const, sha: blob.sha };
    }),
  );
  const tree = await githubApi<{ sha: string }>(
    `/repos/${MUSE_LOOP_REPOSITORY}/git/trees`,
    { method: 'POST', body: JSON.stringify({ base_tree: baseSha, tree: blobs }) },
    fetchImpl,
  );
  const commit = await githubApi<{ sha: string }>(
    `/repos/${MUSE_LOOP_REPOSITORY}/git/commits`,
    { method: 'POST', body: JSON.stringify({ message, tree: tree.sha, parents: [baseSha] }) },
    fetchImpl,
  );
  await githubApi(
    `/repos/${MUSE_LOOP_REPOSITORY}/git/refs/heads/${encodeURIComponent(branch)}`,
    { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) },
    fetchImpl,
  );
  return commit.sha;
}

async function openPullRequest(
  input: MuseLoopInput,
  fetchImpl: FetchImpl,
): Promise<{ number: number; html_url: string }> {
  return githubApi<{ number: number; html_url: string }>(
    `/repos/${MUSE_LOOP_REPOSITORY}/pulls`,
    {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        head: input.branch,
        base: input.base ?? 'main',
        draft: input.draft !== false,
      }),
    },
    fetchImpl,
  );
}

async function getPullRequestChecks(
  prNumber: number,
  headSha: string,
  fetchImpl: FetchImpl,
): Promise<MuseLoopCheckSummary> {
  const [combined, runs] = await Promise.all([
    githubApi<{ state?: string }>(
      `/repos/${MUSE_LOOP_REPOSITORY}/commits/${headSha}/status`,
      {},
      fetchImpl,
    ).catch(() => ({ state: undefined })),
    githubApi<{ check_runs?: { conclusion?: string | null }[] }>(
      `/repos/${MUSE_LOOP_REPOSITORY}/commits/${headSha}/check-runs?per_page=100`,
      {},
      fetchImpl,
    ).catch(() => ({ check_runs: [] })),
  ]);
  const conclusions = (runs.check_runs ?? [])
    .map((run) => run.conclusion ?? 'pending')
    .filter((value, index, all) => all.indexOf(value) === index);
  const state =
    combined.state === 'success' || combined.state === 'failure' || combined.state === 'pending'
      ? combined.state
      : conclusions.includes('failure')
        ? 'failure'
        : conclusions.length > 0 && conclusions.every((c) => c === 'success')
          ? 'success'
          : 'unknown';
  return { state, conclusions };
}

/**
 * Run the full Muse-style loop: branch -> commit -> PR -> CI check.
 * Never merges. Throws fail-closed (MUSE_LOOP_*) on any failed step.
 */
export async function runMuseLoop(
  input: MuseLoopInput,
  fetchImpl: FetchImpl = fetch,
): Promise<MuseLoopResult> {
  const errors = validateMuseLoopInput(input);
  if (errors.length > 0) throw new Error(errors[0]);
  const base = input.base ?? 'main';
  const baseSha = await getMainSha(base, fetchImpl);
  await createBranch(input.branch, baseSha, fetchImpl);
  const headSha = await commitFiles(input.branch, baseSha, input.files, input.message, fetchImpl);
  const pr = await openPullRequest(input, fetchImpl);
  const checks = await getPullRequestChecks(pr.number, headSha, fetchImpl);
  return {
    repository: MUSE_LOOP_REPOSITORY,
    branch: input.branch,
    baseSha,
    headSha,
    prNumber: pr.number,
    prUrl: pr.html_url,
    checks,
  };
}
