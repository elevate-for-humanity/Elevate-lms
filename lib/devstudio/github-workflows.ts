import 'server-only';
import { getGitHubToken } from '@/lib/devstudio/github-token';

const API = 'https://api.github.com';
const REPOSITORY = 'elevate-for-humanity/Elevate-lms';
const BRANCH = 'main';
const WORKFLOW_FILE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}\.ya?ml$/;
const INPUT_KEY = /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/;

export class GitHubWorkflowError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export function validateWorkflowFile(value: unknown): string {
  if (typeof value !== 'string' || value.includes('..') || value.includes('/') || value.includes('\\') || !WORKFLOW_FILE.test(value)) {
    throw new GitHubWorkflowError('workflow must be a bare .yml/.yaml filename', 400);
  }
  return value;
}

export function validateWorkflowInputs(value: unknown): Record<string, string> {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new GitHubWorkflowError('inputs must be an object', 400);
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 10) throw new GitHubWorkflowError('at most 10 inputs are allowed', 400);
  const inputs: Record<string, string> = {};
  for (const [key, input] of entries) {
    if (!INPUT_KEY.test(key)) throw new GitHubWorkflowError(`invalid input name: ${key.slice(0, 64)}`, 400);
    if (typeof input !== 'string' || input.length > 1024) throw new GitHubWorkflowError(`input ${key} must be a string up to 1024 characters`, 400);
    inputs[key] = input;
  }
  return inputs;
}

async function github(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getGitHubToken();
  if (!token) throw new GitHubWorkflowError('GitHub App credentials are not configured', 503);
  const response = await fetch(`${API}/repos/${REPOSITORY}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  return response;
}

async function json<T>(path: string): Promise<T> {
  const response = await github(path);
  if (response.status === 404) throw new GitHubWorkflowError('Not found', 404);
  if (!response.ok) throw new GitHubWorkflowError(`GitHub API error (${response.status})`, 502);
  return response.json() as Promise<T>;
}

interface WorkflowRecord { id: number; name: string; path: string; state: string }

export async function listWorkflows() {
  const workflows: WorkflowRecord[] = [];
  for (let page = 1; page <= 5; page++) {
    const data = await json<{ workflows: WorkflowRecord[] }>(`/actions/workflows?per_page=100&page=${page}`);
    workflows.push(...(data.workflows ?? []));
    if ((data.workflows ?? []).length < 100) break;
  }
  return workflows.filter((w) => w.state === 'active').map((w) => ({
    id: w.id, name: w.name, file: w.path.replace('.github/workflows/', ''), path: w.path, state: w.state,
  }));
}

interface RunRecord {
  id: number; name: string; status: string; conclusion: string | null; html_url: string;
  created_at: string; updated_at?: string; path?: string; head_sha?: string; event?: string;
}

const mapRun = (run: RunRecord) => ({
  id: run.id, name: run.name, status: run.status, conclusion: run.conclusion, url: run.html_url,
  createdAt: run.created_at, updatedAt: run.updated_at, headSha: run.head_sha, event: run.event,
  workflow: run.path?.replace('.github/workflows/', '') ?? run.name,
});

export async function listRecentRuns(perPage: number) {
  const size = Math.min(50, Math.max(1, Math.trunc(perPage) || 10));
  const data = await json<{ workflow_runs: RunRecord[] }>(`/actions/runs?per_page=${size}&branch=${BRANCH}`);
  return (data.workflow_runs ?? []).map(mapRun);
}

export async function getRun(runId: string) {
  if (!/^\d{1,20}$/.test(runId)) throw new GitHubWorkflowError('run_id must be numeric', 400);
  const [run, jobs] = await Promise.all([
    json<RunRecord>(`/actions/runs/${runId}`),
    json<{ jobs: Array<{ id: number; name: string; status: string; conclusion: string | null; html_url: string }> }>(`/actions/runs/${runId}/jobs`),
  ]);
  return {
    ...mapRun(run),
    jobs: (jobs.jobs ?? []).map((job) => ({ id: job.id, name: job.name, status: job.status, conclusion: job.conclusion, url: job.html_url })),
  };
}

/** Dispatch workflow_dispatch on an active workflow. No Contents-API fallback. */
export async function dispatchWorkflow(workflowValue: unknown, inputsValue: unknown) {
  const workflow = validateWorkflowFile(workflowValue);
  const inputs = validateWorkflowInputs(inputsValue);
  const active = await listWorkflows();
  if (!active.some((item) => item.file === workflow)) throw new GitHubWorkflowError(`Workflow ${workflow} is not active in ${REPOSITORY}`, 404);
  const response = await github(`/actions/workflows/${encodeURIComponent(workflow)}/dispatches`, {
    method: 'POST', body: JSON.stringify({ ref: BRANCH, inputs }),
  });
  if (response.status !== 204) {
    throw new GitHubWorkflowError(response.status === 422
      ? `Workflow ${workflow} does not accept workflow_dispatch with these inputs`
      : `Workflow dispatch failed (${response.status})`, response.status === 422 ? 422 : 502);
  }
  return { workflow, ref: BRANCH, repository: REPOSITORY, runsUrl: `https://github.com/${REPOSITORY}/actions/workflows/${workflow}` };
}
