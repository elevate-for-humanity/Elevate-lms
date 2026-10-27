import { dispatchQueuedCourseJob } from './dispatch-course-job.mjs';
import { pathToFileURL } from 'node:url';

export async function courseReleasePending({request = fetch, env = process.env} = {}) {
  if (env.GITHUB_REPOSITORY !== 'elevate-for-humanity/Elevate-lms' || !env.GH_TOKEN)
    throw new Error('COURSE_RELEASE_CHECK_AUTHORITY_REQUIRED');
  const response = await request('https://api.github.com/repos/elevate-for-humanity/Elevate-lms/actions/workflows/deploy-google-course-worker.yml/runs?branch=main&per_page=30', {
    headers: {Authorization: `Bearer ${env.GH_TOKEN}`, Accept:'application/vnd.github+json'}, signal:AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('COURSE_RELEASE_CHECK_HTTP_' + response.status);
  const data = await response.json();
  if (!Array.isArray(data.workflow_runs)) throw new Error('COURSE_RELEASE_INVENTORY_INVALID');
  // Image builds and authoring-access checks may run for a long time. They do
  // not own the runtime lane and must not strand saved lessons. Only the
  // actual deployment job can ask this coordinator to yield.
  for (const run of data.workflow_runs.filter(run => run.head_branch === 'main' && run.status === 'in_progress')) {
    if (!Number.isSafeInteger(run.id) || run.id <= 0) throw new Error('COURSE_RELEASE_RUN_INVALID');
    const jobsResponse = await request(`https://api.github.com/repos/elevate-for-humanity/Elevate-lms/actions/runs/${run.id}/jobs?per_page=100`, {
      headers: {Authorization: `Bearer ${env.GH_TOKEN}`, Accept:'application/vnd.github+json'}, signal:AbortSignal.timeout(15000),
    });
    if (!jobsResponse.ok) throw new Error('COURSE_RELEASE_JOBS_HTTP_' + jobsResponse.status);
    const jobs = await jobsResponse.json();
    if (!Array.isArray(jobs.jobs)) throw new Error('COURSE_RELEASE_JOBS_INVALID');
    if (jobs.jobs.some(job => job.name === 'deploy' && job.status === 'in_progress')) return true;
  }
  return false;
}

/** A bounded coordinator, not a rendering worker. The workflow's existing
 * runtime-operation concurrency lock serializes it with deployments. Each
 * dispatcher call still refuses overlapping Cloud Run executions and proves
 * a fresh database claim. Stop when empty; never revive blocked jobs here. */
export async function continueCourseQueue({ dispatch = dispatchQueuedCourseJob,
  now = Date.now, delay = ms => new Promise(resolve => setTimeout(resolve, ms)),
  request = fetch, env = process.env, budgetMs = 20 * 60_000,
  onState = state => console.log(JSON.stringify(state)),
  releasePending = async () => false,
} = {}) {
  const started = now();
  let last;
  do {
    if (await releasePending()) return {status:'yielded_for_release'};
    const observed = await dispatch();
    // No claimable row does not mean production is idle: the active worker
    // may still be rendering before its next durable lesson checkpoint.
    const state = observed?.status === 'empty' && Number.isSafeInteger(observed.activeExecutions) && observed.activeExecutions > 0
      ? {...observed,status:'busy'} : observed;
    if (!['empty', 'busy', 'assigned', 'capacity_wait'].includes(state?.status))
      throw new Error('COURSE_CONTINUATION_STATE_INVALID');
    if (state.status !== last) onState(state);
    last = state.status;
    if (last === 'empty') return { status: 'empty' };
    // Capacity exhaustion cannot be resolved by spinning the coordinator.
    // Exit instead of running for twenty minutes and dispatching another
    // workflow. The scheduled dispatcher can retry after quota recovers.
    if (last === 'capacity_wait') return {status:'capacity_wait', reason:state.reason ?? 'regional_capacity_unavailable'};
    if (now() - started < budgetMs) await delay(30_000);
  } while (now() - started < budgetMs);

  // Do not replace a pending worker deployment with our successor in GitHub's
  // single pending concurrency slot. Successful release restarts coordination.
  if (await releasePending()) return {status:'yielded_for_release'};
  if (env.GITHUB_REPOSITORY !== 'elevate-for-humanity/Elevate-lms' || !env.GH_TOKEN)
    throw new Error('COURSE_CONTINUATION_DISPATCH_AUTHORITY_REQUIRED');
  // Explicit workflow_dispatch starts a new trusted main run. Unlike delayed
  // scheduled events, this handoff is acknowledged before this run releases
  // the single runtime-operation lane. It does not claim course completion.
  const response = await request('https://api.github.com/repos/elevate-for-humanity/Elevate-lms/actions/workflows/dispatch-google-course-job.yml/dispatches', {
    method: 'POST', headers: { Authorization: `Bearer ${env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json', 'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28' },
    body: JSON.stringify({ ref: 'main' }), signal: AbortSignal.timeout(15_000),
  });
  if (response.status !== 204) throw new Error('COURSE_CONTINUATION_HANDOFF_HTTP_' + response.status);
  return { status: 'handed_off', lastStatus: last };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(JSON.stringify(await continueCourseQueue({releasePending: () => courseReleasePending()})));
