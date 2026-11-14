import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { releaseApi } from './prune-web-release-requests.mjs';

const repository = 'elevate-for-humanity/Elevate-lms';
const waiting = new Set(['queued', 'in_progress', 'pending', 'waiting', 'requested']);
const obsolete = (run, latestSha) =>
  run.event === 'push' &&
  run.head_branch === 'main' &&
  run.path === '.github/workflows/ci.yml' &&
  /^[a-f0-9]{40}$/.test(run.head_sha || '') &&
  run.head_sha !== latestSha &&
  waiting.has(run.status);

/** Keep bounded, started validation so frequent main commits cannot starve
 * required evidence. Obsolete queued runs and historical hangs still retire. */
export async function pruneSupersededCi({ api, latestSha, execute = false, now = Date.now() }) {
  if (!/^[a-f0-9]{40}$/.test(latestSha || '')) throw Error('INVALID_MAIN_SHA');
  const runs = new Map();
  for (const status of waiting) {
    for (let page = 1; page <= 10; page++) {
      const inventory = await api(
        `repos/${repository}/actions/workflows/ci.yml/runs?branch=main&event=push&status=${status}&per_page=100&page=${page}`,
      );
      if (!Array.isArray(inventory.workflow_runs)) throw Error('CI_INVENTORY_UNAVAILABLE');
      for (const run of inventory.workflow_runs) runs.set(run.id, run);
      if (inventory.workflow_runs.length < 100) break;
      if (page === 10) throw Error('CI_INVENTORY_TRUNCATED');
    }
  }
  const results = [];
  for (const run of [...runs.values()].filter((run) => obsolete(run, latestSha))) {
    if (!Number.isSafeInteger(run.id)) throw Error('INVALID_CI_RUN_ID');
    const endpoint = `repos/${repository}/actions/runs/${run.id}`;
    const current = await api(endpoint);
    if (current.id !== run.id || current.head_sha !== run.head_sha || !obsolete(current, latestSha))
      continue;
    const started = Date.parse(current.run_started_at || current.created_at || '');
    if (Number.isFinite(started) && now - started >= 0 && now - started < 45 * 60 * 1000) {
      const jobs = await api(endpoint + '/jobs?per_page=100');
      if (!Array.isArray(jobs.jobs) || jobs.total_count > 100)
        throw Error('CI_JOB_INVENTORY_UNAVAILABLE');
      if (jobs.jobs.some(job => ['in_progress', 'completed'].includes(job.status) && job.name !== 'CI Required Gate')) {
        results.push({ runId: run.id, commit: run.head_sha, status: 'active_validation_preserved' });
        continue;
      }
    }
    if (execute) {
      try {
        await api(endpoint + '/cancel', 'POST');
      } catch (error) {
        // GitHub may finish a run between the read and cancellation POST.
        // Accept that race only after verifying the same run is terminal.
        if (!(error instanceof Error) || error.message !== 'RELEASE_API_HTTP_409') throw error;
        const receipt = await api(endpoint);
        if (receipt.id !== run.id || receipt.head_sha !== run.head_sha) throw error;
        if (receipt.status === 'completed') {
          results.push({ runId: run.id, commit: run.head_sha, status: 'already_completed' });
          continue;
        }
        if (!obsolete(receipt, latestSha)) throw error;
        // Only obsolete CI can use GitHub's documented force-cancel fallback.
        // Release rollouts and course jobs never reach this path.
        try {
          await api(endpoint + '/force-cancel', 'POST');
          results.push({
            runId: run.id,
            commit: run.head_sha,
            status: 'force_cancellation_requested',
          });
        } catch (forceError) {
          if (!(forceError instanceof Error) || forceError.message !== 'RELEASE_API_HTTP_409')
            throw forceError;
          const finalReceipt = await api(endpoint);
          if (finalReceipt.id !== run.id || finalReceipt.head_sha !== run.head_sha)
            throw forceError;
          results.push({
            runId: run.id,
            commit: run.head_sha,
            status:
              finalReceipt.status === 'completed'
                ? 'already_completed'
                : 'github_cancellation_conflict',
          });
        }
        continue;
      }
    }
    results.push({
      runId: run.id,
      commit: run.head_sha,
      status: execute ? 'cancellation_requested' : 'superseded_ci',
    });
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.GITHUB_REPOSITORY !== repository) throw Error('CI_REPOSITORY_NOT_AUTHORIZED');
  // Read main now: the coordinator itself may have waited while main advanced.
  const latestSha = execFileSync(
    'gh',
    ['api', `repos/${repository}/git/ref/heads/main`, '--jq', '.object.sha'],
    { encoding: 'utf8', timeout: 20000 },
  ).trim();
  const results = await pruneSupersededCi({
    api: releaseApi,
    latestSha,
    execute: process.argv.includes('--execute'),
  });
  console.log(JSON.stringify(results));
  const conflicts = results.filter((result) => result.status === 'github_cancellation_conflict');
  if (conflicts.length)
    console.warn(
      `::warning::GitHub refused normal and force cancellation for obsolete CI runs: ${conflicts.map((result) => result.runId).join(', ')}. These require GitHub-side reconciliation; cleanup continued for the other runs.`,
    );
}
