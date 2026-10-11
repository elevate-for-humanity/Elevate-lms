import { dispatchQueuedCourseJob } from './dispatch-course-job.mjs';
import { pathToFileURL } from 'node:url';

/** A bounded coordinator, not a rendering worker. The workflow's existing
 * runtime-operation concurrency lock serializes it with deployments. Each
 * dispatcher call still refuses overlapping Cloud Run executions and proves
 * a fresh database claim. Stop when empty; never revive blocked jobs here. */
export async function continueCourseQueue({ dispatch = dispatchQueuedCourseJob,
  now = Date.now, delay = ms => new Promise(resolve => setTimeout(resolve, ms)),
  request = fetch, env = process.env, budgetMs = 20 * 60_000,
  onState = state => console.log(JSON.stringify(state)),
} = {}) {
  const started = now();
  let last;
  do {
    const state = await dispatch();
    if (!['empty', 'busy', 'assigned', 'capacity_wait'].includes(state?.status))
      throw new Error('COURSE_CONTINUATION_STATE_INVALID');
    if (state.status !== last) onState(state);
    last = state.status;
    if (last === 'empty') return { status: 'empty' };
    if (now() - started < budgetMs) await delay(30_000);
  } while (now() - started < budgetMs);

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
  console.log(JSON.stringify(await continueCourseQueue()));
