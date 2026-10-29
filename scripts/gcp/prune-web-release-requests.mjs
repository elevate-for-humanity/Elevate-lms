import { pathToFileURL } from 'node:url';

export const WEB_RELEASE_WORKFLOWS = [
  'deploy-admin.yml',
  'deploy-google-marketing-trigger.yml',
  'deploy-google-lms-trigger.yml',
  'deploy-google-store-runtime.yml',
];
const waiting = new Set(['queued', 'pending', 'requested', 'waiting', 'in_progress']);
const preparationJobs = new Set([
  'dispatch',
  'validate',
  'build',
  'build / image',
  'authoring-access',
]);
const eligible = (run) => run.event === 'workflow_dispatch' && run.head_branch === 'main';

export async function releaseApi(
  path,
  method = 'GET',
  { token = process.env.GH_TOKEN, request = fetch } = {},
) {
  if (!token) throw Error('RELEASE_API_AUTH_REQUIRED');
  if (
    !path.startsWith('repos/elevate-for-humanity/Elevate-lms/actions/') ||
    !['GET', 'POST'].includes(method)
  )
    throw Error('RELEASE_API_PATH_NOT_AUTHORIZED');
  const response = await request('https://api.github.com/' + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw Error('RELEASE_API_HTTP_' + response.status);
  if (response.status === 204 || (method === 'POST' && response.status === 202)) return {};
  return response.json();
}

export async function assertLatestWebReleaseRequest({ api, repository, workflow, runId }) {
  if (
    repository !== 'elevate-for-humanity/Elevate-lms' ||
    !WEB_RELEASE_WORKFLOWS.includes(workflow)
  )
    throw Error('RELEASE_REPOSITORY_NOT_AUTHORIZED');
  const inventory = await api(
    `repos/${repository}/actions/workflows/${workflow}/runs?event=workflow_dispatch&branch=main&per_page=100`,
  );
  if (!Array.isArray(inventory.workflow_runs)) throw Error('RELEASE_INVENTORY_UNAVAILABLE');
  const runs = inventory.workflow_runs.filter(eligible);
  if (runs.some((r) => !Number.isSafeInteger(r.id) || !Number.isSafeInteger(r.run_number)))
    throw Error('RELEASE_INVENTORY_INVALID');
  const current = runs.find((r) => String(r.id) === String(runId));
  if (!current || runs.some((r) => r.run_number > current.run_number))
    throw Error('SUPERSEDED_RELEASE_REQUEST');
  return { workflow, runId: current.id, status: 'latest_requested_release' };
}

/** A web image that completed its trusted build/upload may finish rollout
 * while newer requests are still building. Never roll back a newer rollout.
 * The workflow separately verifies the immutable image digest and exact health.
 */
const testedRollouts = {
  'deploy-admin.yml': 'Admin',
  'deploy-google-store-runtime.yml': 'Store',
  'deploy-google-marketing-trigger.yml': 'Marketing',
};
// GitHub gives an unstarted dependent job a synthetic started_at when its run
// is cancelled. Require the complete no-runner, no-step, zero-duration receipt;
// missing metadata or a cancellation after any execution still blocks rollback.
function cancelledBeforeExecution(job) {
  return job.status === 'completed' && job.conclusion === 'cancelled' &&
    Array.isArray(job.steps) && job.steps.length === 0 &&
    (job.runner_id === null || job.runner_id === 0) &&
    (job.runner_name === null || job.runner_name === '') &&
    typeof job.started_at === 'string' && Number.isFinite(Date.parse(job.started_at)) &&
    job.started_at === job.completed_at;
}
export async function assertTestedWebRollout({ api, repository, workflow, runId, commitSha }) {
  if (repository !== 'elevate-for-humanity/Elevate-lms' || !Object.hasOwn(testedRollouts, workflow))
    throw Error('RELEASE_REPOSITORY_NOT_AUTHORIZED');
  const label = testedRollouts[workflow],
    component = label.toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(commitSha || '')) throw Error('RELEASE_COMMIT_INVALID');
  const inventory = await api(
    `repos/${repository}/actions/workflows/${workflow}/runs?event=workflow_dispatch&branch=main&per_page=100`,
  );
  if (!Array.isArray(inventory.workflow_runs)) throw Error('RELEASE_INVENTORY_UNAVAILABLE');
  const runs = inventory.workflow_runs.filter(eligible);
  if (runs.some((r) => !Number.isSafeInteger(r.id) || !Number.isSafeInteger(r.run_number)))
    throw Error('RELEASE_INVENTORY_INVALID');
  const current = runs.find((r) => String(r.id) === String(runId));
  if (!current || current.head_sha !== commitSha) throw Error('RELEASE_COMMIT_MISMATCH');
  const jobsFor = async (id) => {
    const result = await api(`repos/${repository}/actions/runs/${id}/jobs?filter=all&per_page=100`);
    if (
      !Array.isArray(result.jobs) ||
      !Number.isSafeInteger(result.total_count) ||
      result.total_count > 100
    )
      throw Error('RELEASE_JOB_INVENTORY_UNAVAILABLE');
    return result.jobs;
  };
  const jobs = await jobsFor(current.id);
  if (
    !jobs.some(
      (j) =>
        j.name === `Build and upload ${label} image` &&
        j.status === 'completed' &&
        j.conclusion === 'success',
    )
  )
    throw Error(component.toUpperCase() + '_TESTED_IMAGE_REQUIRED');
  for (const newer of runs.filter((r) => r.run_number > current.run_number)) {
    const newerJobs = await jobsFor(newer.id);
    if (
      newerJobs.some(
        (j) =>
          j.name === `Deploy and verify ${label} on Google` &&
          !cancelledBeforeExecution(j) &&
          (j.status === 'in_progress' ||
            (j.status === 'completed' && j.conclusion !== 'skipped') ||
            j.steps?.some((step) => step.status === 'in_progress' || step.status === 'completed')),
      )
    )
      throw Error('NEWER_' + component.toUpperCase() + '_ROLLOUT_STARTED');
  }
  return {
    workflow,
    runId: current.id,
    commitSha,
    status: 'tested_' + component + '_image_allowed',
  };
}

export async function assertTestedAdminRollout(input) {
  return assertTestedWebRollout({ ...input, workflow: 'deploy-admin.yml' });
}

/** Cancel only unstarted requests superseded by a newer request for the SAME app.
 * Never cancel an active build/deployment, course execution, or another branch. */
export async function pruneWebReleaseRequests({ api, repository, execute = false }) {
  if (repository !== 'elevate-for-humanity/Elevate-lms')
    throw Error('RELEASE_REPOSITORY_NOT_AUTHORIZED');
  const results = [];
  for (const workflow of WEB_RELEASE_WORKFLOWS) {
    const inventory = await api(
      `repos/${repository}/actions/workflows/${workflow}/runs?event=workflow_dispatch&branch=main&per_page=100`,
    );
    if (!Array.isArray(inventory.workflow_runs)) throw Error('RELEASE_INVENTORY_UNAVAILABLE');
    const runs = inventory.workflow_runs.filter(eligible);
    if (!runs.length) continue;
    if (runs.some((r) => !Number.isSafeInteger(r.id) || !Number.isSafeInteger(r.run_number)))
      throw Error('RELEASE_INVENTORY_INVALID');
    const latest = Math.max(...runs.map((r) => r.run_number));
    for (const run of runs.filter((r) => r.run_number < latest && waiting.has(r.status))) {
      const endpoint = `repos/${repository}/actions/runs/${run.id}`;
      const current = await api(endpoint);
      if (
        !eligible(current) ||
        current.id !== run.id ||
        current.run_number !== run.run_number ||
        !waiting.has(current.status)
      )
        continue;
      const jobs = await api(endpoint + '/jobs?filter=all&per_page=100');
      if (!Array.isArray(jobs.jobs) || jobs.total_count > 100)
        throw Error('RELEASE_JOB_INVENTORY_UNAVAILABLE');
      // A verified, uploaded image must reach deployment and acceptance even when main advances.
      // Otherwise continuous course commits can repeatedly discard a ready LMS release.
      if (
        jobs.jobs.some(
          (j) =>
            j.name === 'build / image' && j.status === 'completed' && j.conclusion === 'success',
        )
      )
        continue;
      // A started deployment must finish its own acceptance/rollback sequence.
      if (
        jobs.jobs.some(
          (j) =>
            j.status === 'in_progress' ||
            (!preparationJobs.has(j.name) &&
              ((j.status === 'completed' && j.conclusion !== 'skipped') ||
                j.steps?.some(
                  (step) => step.status === 'in_progress' || step.status === 'completed',
                ))),
        )
      )
        continue;
      const beforeCancel = await api(endpoint);
      if (!waiting.has(beforeCancel.status) || beforeCancel.id !== run.id) continue;
      if (execute) await api(endpoint + '/cancel', 'POST');
      results.push({
        workflow,
        runId: run.id,
        status: execute ? 'cancellation_requested' : 'superseded_unstarted',
      });
    }
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const api = (path, method = 'GET') => releaseApi(path, method);
  const repository = process.env.GITHUB_REPOSITORY;
  const result = process.argv.includes('--assert-tested-web-rollout')
    ? await assertTestedWebRollout({
        api,
        repository,
        workflow: process.env.RELEASE_WORKFLOW,
        runId: process.env.GITHUB_RUN_ID,
        commitSha: process.env.GITHUB_SHA,
      })
    : process.argv.includes('--assert-tested-admin-rollout')
      ? await assertTestedAdminRollout({
          api,
          repository,
          runId: process.env.GITHUB_RUN_ID,
          commitSha: process.env.GITHUB_SHA,
        })
      : process.argv.includes('--assert-latest')
        ? await assertLatestWebReleaseRequest({
            api,
            repository,
            workflow: process.env.RELEASE_WORKFLOW,
            runId: process.env.GITHUB_RUN_ID,
          })
        : await pruneWebReleaseRequests({
            api,
            repository,
            execute: process.env.PRUNE_SUPERSEDED_RELEASES === 'true',
          });
  console.log(JSON.stringify(result));
}
