import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { verifyExactPrBrowserEvidence } from './require-exact-pr-browser-evidence.mjs';

const SHA = /^[a-f0-9]{40}$/;
const REQUIRED = ['CI Preflight', 'TypeScript — marketing', 'TypeScript — admin', 'TypeScript — lms',
  'Lint', 'Canonical Enrollment Database', 'Website edit transactions', 'Functional Tests & Repo Hygiene'];
const PATHS = ['.github/workflows/ci.yml', '.github/workflows/e2e-desktop-chrome.yml'];
const successful = job => job.status === 'completed' && job.conclusion === 'success';

export async function resumeBrowserGate({ repository, token, event, request = fetch }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || '') || !token || !Number.isSafeInteger(event?.workflow_run?.id))
    throw Error('CI_RESUME_IDENTITY_REQUIRED');
  const api = async (path, method = 'GET') => {
    const response = await request(`https://api.github.com/repos/${repository}${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28' }, redirect: 'error', signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw Error(`CI_RESUME_HTTP_${response.status}`);
    return method === 'GET' ? response.json() : null;
  };
  // Read the authenticated API record; never trust PR artifacts or execute PR code.
  const source = await api(`/actions/runs/${event.workflow_run.id}`);
  if (!PATHS.includes(source.path) || source.repository?.full_name !== repository ||
      source.event !== 'pull_request' || source.status !== 'completed' || !SHA.test(source.head_sha || '') ||
      !source.head_branch || !source.head_repository?.full_name) return { state: 'ignored' };
  const pulls = await api(`/commits/${source.head_sha}/pulls?per_page=100`);
  if (!Array.isArray(pulls) || pulls.length >= 100) throw Error('CI_RESUME_PR_INVENTORY_INCOMPLETE');
  const candidates = pulls.filter(pr => pr.state === 'open' && pr.head?.sha === source.head_sha &&
    pr.head?.ref === source.head_branch && pr.head?.repo?.full_name === source.head_repository.full_name &&
    pr.base?.ref === 'main' && pr.base?.repo?.full_name === repository);
  if (candidates.length !== 1) return { state: 'ignored', reason: 'NO_UNIQUE_CURRENT_PR' };
  const pr = candidates[0];
  if (!Number.isSafeInteger(pr.number)) throw Error('CI_RESUME_PR_IDENTITY_REQUIRED');
  const inventory = await api(`/actions/workflows/ci.yml/runs?event=pull_request&head_sha=${source.head_sha}&per_page=100`);
  if (!Array.isArray(inventory.workflow_runs) || inventory.workflow_runs.length >= 100)
    throw Error('CI_RESUME_RUN_INVENTORY_INCOMPLETE');
  const ci = inventory.workflow_runs.filter(run => run.path === PATHS[0] && run.event === 'pull_request' &&
    run.head_sha === source.head_sha && run.head_branch === source.head_branch &&
    run.head_repository?.full_name === source.head_repository.full_name).sort((a, b) => b.id - a.id)[0];
  // One automatic receipt retry only. A real failure or later attempt is left
  // visible for repair instead of producing an unbounded workflow_run loop.
  if (!ci || ci.status !== 'completed' || ci.conclusion !== 'failure' || ci.run_attempt !== 1)
    return { state: 'ignored', reason: 'CI_NOT_READY_OR_ALREADY_RETRIED' };
  if (source.path === PATHS[0] && ci.id !== source.id) return { state: 'ignored', reason: 'SUPERSEDED_CI_EVENT' };
  if (!Number.isSafeInteger(ci.id)) throw Error('CI_RESUME_RUN_IDENTITY_REQUIRED');
  const data = await api(`/actions/runs/${ci.id}/jobs?per_page=100`);
  if (!Array.isArray(data.jobs) || !Number.isSafeInteger(data.total_count) ||
      data.total_count !== data.jobs.length || data.jobs.length >= 100) throw Error('CI_RESUME_JOBS_INCOMPLETE');
  for (const name of REQUIRED) {
    const matches = data.jobs.filter(job => job.name === name);
    if (matches.length !== 1 || !successful(matches[0])) return { state: 'ignored', reason: 'DIAGNOSTICS_NOT_GREEN' };
  }
  const gates = data.jobs.filter(job => job.name === 'CI Required Gate');
  const gate = gates[0];
  if (gates.length !== 1 || !Number.isSafeInteger(gate.id) || gate.status !== 'completed' || gate.conclusion !== 'failure' ||
      !gate.steps?.some(step => step.name === 'Require every CI diagnostic to pass' && step.conclusion === 'success') ||
      !gate.steps?.some(step => step.name === 'Require completed exact-head browser acceptance for pull requests' && step.conclusion === 'failure'))
    return { state: 'ignored', reason: 'NO_BROWSER_GATE_TO_RESUME' };
  // This uses trusted-main verification, including the live PR read race check,
  // all required browser jobs, latest run, exact SHA/branch/repository and base.
  try {
    await verifyExactPrBrowserEvidence({ repository, token, event: { pull_request: pr }, request, timeoutMs: 0 });
  } catch (error) {
    if (/^E2E_EXACT_HEAD_(PENDING|FAILED)/.test(error.message)) return { state: 'ignored', reason: 'BROWSERS_NOT_GREEN' };
    throw error;
  }
  const fresh = await api(`/actions/runs/${ci.id}`);
  if (fresh.run_attempt !== 1 || fresh.status !== 'completed' || fresh.conclusion !== 'failure' ||
      fresh.head_sha !== source.head_sha || fresh.head_branch !== source.head_branch ||
      fresh.head_repository?.full_name !== source.head_repository.full_name || fresh.path !== PATHS[0] || fresh.event !== 'pull_request')
    throw Error('CI_RESUME_RUN_CHANGED');
  await api(`/actions/jobs/${gate.id}/rerun`, 'POST');
  return { state: 'resumed', runId: ci.id, jobId: gate.id, sha: source.head_sha };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.env.GITHUB_EVENT_NAME !== 'workflow_run') throw Error('CI_RESUME_EVENT_REQUIRED');
    console.info(await resumeBrowserGate({ repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN,
      event: JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) }));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
