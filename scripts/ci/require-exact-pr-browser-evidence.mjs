import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SHA = /^[0-9a-f]{40}$/;
const WORKFLOW = '.github/workflows/e2e-desktop-chrome.yml';
const DESKTOP_SHARDS = 4;
const REQUIRED_JOBS = [
  'E2E desktop-chrome',
  ...Array.from({ length: DESKTOP_SHARDS }, (_, i) => `E2E desktop-chrome shard ${i + 1}/${DESKTOP_SHARDS}`),
  'Public Host Shop navigation and application (five devices)',
  'Email device browsers',
];

/** A required CI receipt must bind a completed browser run to this PR's head,
 * repository, branch and workflow. Missing/skipped jobs never count as green. */
export function inspectExactPrBrowserEvidence({ runs, jobs, sourceRepository, headSha, headBranch }) {
  if (!SHA.test(headSha || '') || !sourceRepository || !headBranch) throw Error('E2E_PR_IDENTITY_REQUIRED');
  if (!Array.isArray(runs) || runs.length >= 100) throw Error('E2E_RUN_INVENTORY_INCOMPLETE');
  const candidates = runs.filter(run =>
    run.head_sha === headSha && run.head_branch === headBranch &&
    run.head_repository?.full_name === sourceRepository &&
    run.path === WORKFLOW && run.event === 'pull_request')
    .sort((a, b) => b.id - a.id || (b.run_attempt || 1) - (a.run_attempt || 1));
  if (!candidates.length) return { state: 'pending', reason: 'E2E_EXACT_HEAD_NOT_OBSERVED' };
  const latest = candidates[0];
  if (latest.status !== 'completed') return { state: 'pending', runId: latest.id };
  if (latest.conclusion !== 'success') throw Error('E2E_EXACT_HEAD_FAILED:' + latest.id);
  if (!Array.isArray(jobs) || jobs.length >= 100) throw Error('E2E_JOB_INVENTORY_INCOMPLETE');
  for (const name of REQUIRED_JOBS) {
    const matches = jobs.filter(job => job.name === name);
    if (matches.length !== 1 || matches[0].status !== 'completed' || matches[0].conclusion !== 'success')
      throw Error('E2E_REQUIRED_JOB_NOT_SUCCESSFUL:' + name);
  }
  return { state: 'verified', runId: latest.id };
}

export async function verifyExactPrBrowserEvidence({
  repository, event, token, request = fetch, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  timeoutMs = 0, pollMs = 20_000,
}) {
  if (!event?.pull_request || !SHA.test(event.pull_request.head?.sha || '') ||
      !event.pull_request.head?.ref || !event.pull_request.head?.repo?.full_name ||
      !event.pull_request.base?.ref || event.pull_request.base?.repo?.full_name !== repository ||
      !Number.isSafeInteger(event.pull_request.number) || !token || !repository)
    throw Error('E2E_PR_IDENTITY_REQUIRED');
  const sha = event.pull_request.head.sha;
  const branch = event.pull_request.head.ref;
  const sourceRepository = event.pull_request.head.repo.full_name;
  const expectedBase = event.pull_request.base.ref;
  const api = async path => {
    const response = await request('https://api.github.com/repos/' + repository + path, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28' },
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw Error('E2E_GITHUB_HTTP_' + response.status);
    return response.json();
  };
  const deadline = Date.now() + timeoutMs;
  do {
    const current = await api('/pulls/' + event.pull_request.number);
    if (current.head?.sha !== sha || current.head?.ref !== branch ||
        current.head?.repo?.full_name !== sourceRepository ||
        current.base?.ref !== expectedBase || current.base?.repo?.full_name !== repository ||
        current.state !== 'open')
      throw Error('E2E_PR_HEAD_OR_BASE_CHANGED');
    // Browser acceptance is a protected-main merge requirement. CI still runs
    // its normal diagnostics on other PR bases, which have no browser trigger.
    // The live PR read above must match the original event so retargeting a PR
    // to main cannot reuse a non-main result as an acceptance receipt.
    if (expectedBase !== 'main') return { state: 'not-applicable', reason: 'E2E_NON_MAIN_BASE' };
    const data = await api('/actions/workflows/e2e-desktop-chrome.yml/runs?event=pull_request&head_sha=' + sha + '&per_page=100');
    if (!Array.isArray(data.workflow_runs)) throw Error('E2E_RUN_INVENTORY_UNAVAILABLE');
    const candidates = data.workflow_runs.filter(run =>
      run.head_sha === sha && run.head_branch === branch &&
      run.head_repository?.full_name === sourceRepository &&
      run.path === WORKFLOW && run.event === 'pull_request')
      .sort((a, b) => b.id - a.id || (b.run_attempt || 1) - (a.run_attempt || 1));
    let jobs = null;
    if (candidates[0]?.status === 'completed' && candidates[0]?.conclusion === 'success') {
      const response = await api('/actions/runs/' + candidates[0].id + '/jobs?per_page=100');
      if (!Array.isArray(response.jobs) || !Number.isSafeInteger(response.total_count) ||
          response.total_count < 0 || response.total_count > response.jobs.length ||
          response.jobs.length >= 100) throw Error('E2E_JOB_INVENTORY_INCOMPLETE');
      jobs = response.jobs;
    }
    const result = inspectExactPrBrowserEvidence({
      runs: data.workflow_runs, jobs, sourceRepository, headSha: sha, headBranch: branch,
    });
    if (result.state === 'verified') {
      // Close the GitHub API read race: a passing run must still belong to the
      // live PR head and base immediately before the required check succeeds.
      const finalPr = await api('/pulls/' + event.pull_request.number);
      if (finalPr.state !== 'open' || finalPr.head?.sha !== sha ||
          finalPr.head?.ref !== branch || finalPr.head?.repo?.full_name !== sourceRepository ||
          finalPr.base?.ref !== expectedBase || finalPr.base?.repo?.full_name !== repository)
        throw Error('E2E_PR_HEAD_OR_BASE_CHANGED');
      return result;
    }
    if (Date.now() + pollMs >= deadline) break;
    await sleep(pollMs);
  } while (Date.now() < deadline);
  throw Error(timeoutMs === 0 ? 'E2E_EXACT_HEAD_PENDING' : 'E2E_EXACT_HEAD_TIMEOUT');
}

/** The gate job must judge the browser run's completed state, not a snapshot
 * taken before that run finishes: the verifier's polling loop is given a
 * bounded budget here, at the CLI entrypoint. The library default stays
 * single-shot (timeoutMs 0) so other callers — notably the completion
 * finalizer, which may only act on already-completed evidence — never wait.
 * The budget is capped so it expires before the gate job's workflow timeout. */
export const DEFAULT_EVIDENCE_TIMEOUT_MS = 3_300_000;
export const MAX_EVIDENCE_TIMEOUT_MS = 3_600_000;
export function evidenceTimeoutFromEnv(env = process.env) {
  const raw = env.E2E_EVIDENCE_TIMEOUT_MS;
  if (raw === undefined || raw === '') return DEFAULT_EVIDENCE_TIMEOUT_MS;
  if (!/^\d+$/.test(raw)) throw Error('E2E_EVIDENCE_TIMEOUT_INVALID');
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) throw Error('E2E_EVIDENCE_TIMEOUT_INVALID');
  return Math.min(value, MAX_EVIDENCE_TIMEOUT_MS);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.env.GITHUB_EVENT_NAME !== 'pull_request') throw Error('E2E_PR_EVENT_REQUIRED');
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const evidence = await verifyExactPrBrowserEvidence({
      repository: process.env.GITHUB_REPOSITORY,
      event,
      timeoutMs: evidenceTimeoutFromEnv(),
      token: process.env.GITHUB_TOKEN,
    });
    console.info('Required exact-head browser acceptance verified:', JSON.stringify(evidence));
  } catch (error) {
    console.error(error?.message || 'E2E_REQUIRED_EVIDENCE_FAILED');
    process.exitCode = 1;
  }
}
