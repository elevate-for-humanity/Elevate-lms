import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { pruneSupersededCi } from './prune-superseded-ci.mjs';
const latestSha = 'a'.repeat(40),
  oldSha = 'b'.repeat(40);
const run = (id, patch = {}) => ({
  id,
  event: 'push',
  head_branch: 'main',
  path: '.github/workflows/ci.yml',
  head_sha: oldSha,
  status: 'in_progress',
  ...patch,
});

test('releases obsolete CI runners while preserving latest tests, releases, workers, PRs and other branches', async () => {
  const inventory = [
    run(1),
    run(2, { head_sha: latestSha }),
    run(3, { event: 'pull_request' }),
    run(4, { head_branch: 'work' }),
    run(5, { path: '.github/workflows/deploy-google-lms-trigger.yml' }),
    run(6, { path: '.github/workflows/dispatch-google-course-queue.yml' }),
    run(7, { status: 'completed' }),
  ];
  const writes = [];
  const api = async (path, method = 'GET') => {
    if (method === 'POST') {
      writes.push(path);
      return {};
    }
    return path.includes('/workflows/')
      ? { workflow_runs: inventory }
      : inventory.find((r) => path.endsWith('/' + r.id));
  };
  assert.equal((await pruneSupersededCi({ api, latestSha, execute: true })).length, 1);
  assert.deepEqual(writes, ['repos/elevate-for-humanity/Elevate-lms/actions/runs/1/cancel']);
});
test('dry run cannot mutate and completion racing cleanup is preserved', async () => {
  for (const completed of [false, true]) {
    const api = async (path, method = 'GET') => {
      assert.equal(method, 'GET');
      return path.includes('/workflows/')
        ? { workflow_runs: [run(1)] }
        : run(1, { status: completed ? 'completed' : 'queued' });
    };
    assert.equal((await pruneSupersededCi({ api, latestSha })).length, completed ? 0 : 1);
  }
});
test('incomplete inventories and invalid main identity fail closed', async () => {
  await assert.rejects(pruneSupersededCi({ api: async () => ({}), latestSha }), /INVENTORY/);
  await assert.rejects(
    pruneSupersededCi({
      api: async () => {
        throw Error('must not query');
      },
      latestSha: 'invalid',
    }),
    /INVALID_MAIN/,
  );
});
test('CI concurrency is per branch and keeps every gate on the current commit', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const policy = workflow.split('concurrency:')[1].split('jobs:')[0];
  assert.match(policy, /group: ci-\$\{\{ github.workflow \}\}-\$\{\{ github.ref \}\}/);
  assert.doesNotMatch(policy, /github.sha/);
  assert.match(policy, /cancel-in-progress: true/);
  assert.match(workflow, /Run required Vitest suite/);
});

test('a cancellation conflict is accepted only after a terminal receipt for the same run', async () => {
  for (const terminal of [false, true]) {
    let reads = 0;
    const api = async (path, method = 'GET') => {
      if (method === 'POST') throw Error('RELEASE_API_HTTP_409');
      if (path.includes('/workflows/')) return { workflow_runs: [run(1)] };
      reads++;
      return run(1, { status: terminal && reads > 1 ? 'completed' : 'in_progress' });
    };
    if (terminal)
      assert.equal(
        (await pruneSupersededCi({ api, latestSha, execute: true }))[0].status,
        'already_completed',
      );
    else await assert.rejects(pruneSupersededCi({ api, latestSha, execute: true }), /HTTP_409/);
  }
});
