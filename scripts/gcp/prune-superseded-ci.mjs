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

/** Only obsolete CI tests are cancelled. Never touch a release or course worker. */
export async function pruneSupersededCi({ api, latestSha, execute = false }) {
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
    if (execute) {
      try {
        await api(endpoint + '/cancel', 'POST');
      } catch (error) {
        // GitHub may finish a run between the read and cancellation POST.
        // Accept that race only after verifying the same run is terminal.
        if (!(error instanceof Error) || error.message !== 'RELEASE_API_HTTP_409') throw error;
        const receipt = await api(endpoint);
        if (receipt.id !== run.id || receipt.status !== 'completed') throw error;
        results.push({ runId: run.id, commit: run.head_sha, status: 'already_completed' });
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
  console.log(
    JSON.stringify(
      await pruneSupersededCi({
        api: releaseApi,
        latestSha,
        execute: process.argv.includes('--execute'),
      }),
    ),
  );
}
