import { pathToFileURL } from 'node:url';

const repository = 'elevate-for-humanity/Elevate-lms';
const shaPattern = /^[a-f0-9]{40}$/;
const requiredGate = 'CI Required Gate';
const workflowFile = '.github/workflows/ci.yml';

export function validateLmsReleaseIdentity(env) {
  if (env.GITHUB_REPOSITORY !== repository || env.GITHUB_REF !== 'refs/heads/main' ||
      env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || !shaPattern.test(env.GITHUB_SHA || '') ||
      !env.GH_TOKEN?.trim()) {
    throw new Error('LMS_RELEASE_CI_IDENTITY_REQUIRED');
  }
  return env.GITHUB_SHA;
}

export async function inspectExactMainCI({ sha, token, request = fetch }) {
  if (!shaPattern.test(sha || '') || !token?.trim()) throw new Error('LMS_RELEASE_CI_IDENTITY_REQUIRED');
  async function api(path) {
    const response = await request('https://api.github.com/repos/' + repository + '/' + path, {
      method: 'GET',
      redirect: 'error',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('LMS_RELEASE_GITHUB_HTTP_' + response.status);
    return response.json();
  }
  const head = await api('git/ref/heads/main');
  if (head.object?.sha !== sha) throw new Error('LMS_RELEASE_MAIN_CHANGED');

  // A protected workflow-token merge does not emit push-triggered workflows.
  // The signed PARIS reconciler dispatches the same full CI on exact main.
  const data = await api('actions/workflows/ci.yml/runs?head_sha=' + sha + '&per_page=50');
  if (!Array.isArray(data.workflow_runs)) throw new Error('LMS_RELEASE_CI_INVENTORY_UNAVAILABLE');
  const runs = data.workflow_runs
    .filter(run => run.head_sha === sha && ['push', 'workflow_dispatch'].includes(run.event) && run.name === 'CI' &&
      run.path === workflowFile && run.head_branch === 'main' && run.head_repository?.full_name === repository)
    .sort((a, b) => b.id - a.id || (b.run_attempt || 1) - (a.run_attempt || 1));
  if (!runs.length) return { status: 'pending', reason: 'LMS_RELEASE_EXACT_MAIN_CI_MISSING' };
  const run = runs[0];
  if (run.status !== 'completed') return { status: 'pending', reason: 'LMS_RELEASE_CI_PENDING', runId: run.id };
  if (run.conclusion !== 'success') throw new Error('LMS_RELEASE_REQUIRED_CI_FAILED:' + run.id);

  const jobs = await api('actions/runs/' + run.id + '/jobs?per_page=100');
  if (!Array.isArray(jobs.jobs)) throw new Error('LMS_RELEASE_REQUIRED_JOBS_UNAVAILABLE');
  const gate = jobs.jobs.find(job => job.name === requiredGate);
  if (!gate) throw new Error('LMS_RELEASE_REQUIRED_GATE_MISSING');
  if (gate.status !== 'completed') return { status: 'pending', reason: 'LMS_RELEASE_REQUIRED_GATE_PENDING', runId: run.id };
  if (gate.conclusion !== 'success') throw new Error('LMS_RELEASE_REQUIRED_GATE_FAILED:' + run.id);

  const finalHead = await api('git/ref/heads/main');
  if (finalHead.object?.sha !== sha) throw new Error('LMS_RELEASE_MAIN_CHANGED');
  return { status: 'verified', sha, runId: run.id, gate: requiredGate };
}

export async function requireExactLmsCI(
  env = process.env,
  { request = fetch, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
    attempts = 180, intervalMs = 20000 } = {},
) {
  const sha = validateLmsReleaseIdentity(env);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const state = await inspectExactMainCI({ sha, token: env.GH_TOKEN, request });
    if (state.status === 'verified') return state;
    if (attempt < attempts) await sleep(intervalMs);
  }
  throw new Error('LMS_RELEASE_REQUIRED_CI_TIMEOUT');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await requireExactLmsCI()));
  } catch (error) {
    console.error(error?.message || 'LMS_RELEASE_REQUIRED_CI_UNAVAILABLE');
    process.exitCode = 1;
  }
}
