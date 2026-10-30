import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pruneWebReleaseRequests,
  assertLatestWebReleaseRequest,
  releaseApi,
  WEB_RELEASE_WORKFLOWS,
} from './prune-web-release-requests.mjs';
const repository = 'elevate-for-humanity/Elevate-lms';
const row = (id, status = 'pending', extra = {}) => ({
  id,
  run_number: id,
  event: 'workflow_dispatch',
  head_branch: 'main',
  status,
  ...extra,
});
function fixture({
  rows = [row(1), row(2)],
  current,
  started = false,
  invalid = false,
  jobs,
} = {}) {
  const writes = [];
  let reads = 0;
  const api = async (path, method) => {
    if (method === 'POST') {
      writes.push(path);
      return {};
    }
    if (path.includes('/workflows/'))
      return { workflow_runs: path.includes(WEB_RELEASE_WORKFLOWS[0]) ? rows : [] };
    if (path.includes('/jobs'))
      return invalid
        ? {}
        : {
            total_count: 1,
            jobs: jobs ?? [
              {
                name: 'Build and deploy Admin on Google',
                status: started ? 'in_progress' : 'pending',
                started_at: started ? '2026-10-18T00:00:00Z' : null,
              },
            ],
          };
    reads++;
    return current?.(reads) ?? rows[0];
  };
  return { api, writes };
}
test('only the older unstarted same-app main dispatch is canceled', async () => {
  const f = fixture();
  const r = await pruneWebReleaseRequests({ ...f, repository, execute: true });
  assert.deepEqual(f.writes, [`repos/${repository}/actions/runs/1/cancel`]);
  assert.equal(r[0].runId, 1);
});
test('dry run preserves requests', async () => {
  const f = fixture();
  await pruneWebReleaseRequests({ ...f, repository });
  assert.deepEqual(f.writes, []);
});
test('active runs, started jobs, current requests and other branches remain untouched', async () => {
  for (const options of [
    { rows: [row(1, 'in_progress'), row(2)], started: true },
    { started: true },
    { rows: [row(1)] },
    { rows: [row(1, 'pending', { head_branch: 'fix' }), row(2)] },
    { current: () => row(1, 'completed') },
    { current: (n) => row(1, n === 1 ? 'pending' : 'completed') },
  ]) {
    const f = fixture(options);
    await pruneWebReleaseRequests({ ...f, repository, execute: true });
    assert.deepEqual(f.writes, []);
  }
});
test('unreadable job inventory or another repository cannot authorize cancellation', async () => {
  const f = fixture({ invalid: true });
  await assert.rejects(pruneWebReleaseRequests({ ...f, repository, execute: true }), /INVENTORY/);
  assert.deepEqual(f.writes, []);
  await assert.rejects(
    pruneWebReleaseRequests({ ...fixture(), repository: 'another/repository', execute: true }),
    /NOT_AUTHORIZED/,
  );
});
test('only the newest request for the selected app can start an expensive build', async () => {
  const f = fixture();
  const workflow = WEB_RELEASE_WORKFLOWS[0];
  await assert.rejects(
    assertLatestWebReleaseRequest({ ...f, repository, workflow, runId: 1 }),
    /SUPERSEDED/,
  );
  assert.equal(
    (await assertLatestWebReleaseRequest({ ...f, repository, workflow, runId: 2 })).runId,
    2,
  );
  assert.deepEqual(f.writes, []);
});
test('large GitHub inventories are read without a subprocess output buffer', async () => {
  const payload = {
    workflow_runs: [{ ...row(1), head_commit: { message: 'x'.repeat(2_000_000) } }],
  };
  const result = await releaseApi(
    `repos/${repository}/actions/workflows/deploy-admin.yml/runs`,
    'GET',
    {
      token: 'test-token',
      request: async (url, options) => {
        assert.equal(new URL(url).hostname, 'api.github.com');
        assert.equal(options.headers.Authorization, 'Bearer test-token');
        return Response.json(payload);
      },
    },
  );
  assert.equal(result.workflow_runs[0].head_commit.message.length, 2_000_000);
});
test('GitHub failure, missing credentials and foreign API paths fail closed', async () => {
  await assert.rejects(
    releaseApi(`repos/${repository}/actions/runs/1`, 'GET', {
      token: 'test',
      request: async () => new Response('unavailable', { status: 503 }),
    }),
    /HTTP_503/,
  );
  await assert.rejects(
    releaseApi('repos/another/repository/actions/runs', 'GET', { token: 'test' }),
    /NOT_AUTHORIZED/,
  );
  await assert.rejects(
    releaseApi(`repos/${repository}/actions/runs`, 'GET', { token: '' }),
    /AUTH_REQUIRED/,
  );
  for (const status of [202, 204])
    assert.deepEqual(
      await releaseApi(`repos/${repository}/actions/runs/1/cancel`, 'POST', {
        token: 'test',
        request: async () => new Response(null, { status }),
      }),
      {},
    );
});

test('completed preparation does not trap a superseded release in the deployment queue', async () => {
  const jobs = [
    { name: 'validate', status: 'completed', started_at: '2026-10-18T00:00:00Z' },
    { name: 'build / image', status: 'completed', started_at: '2026-10-18T00:00:00Z' },
    { name: 'deploy', status: 'pending', started_at: '2026-10-18T00:00:00Z', steps: [] },
  ];
  const f = fixture({ rows: [row(1, 'in_progress'), row(2)], jobs });
  await pruneWebReleaseRequests({ ...f, repository, execute: true });
  assert.equal(f.writes.length, 1);
  for (const activeJobs of [
    [{ name: 'build', status: 'in_progress', started_at: '2026-10-18T00:00:00Z' }],
    [{ name: 'deploy', status: 'completed', started_at: '2026-10-18T00:00:00Z' }],
  ]) {
    const protectedRun = fixture({ rows: [row(1, 'in_progress'), row(2)], jobs: activeJobs });
    await pruneWebReleaseRequests({ ...protectedRun, repository, execute: true });
    assert.deepEqual(protectedRun.writes, []);
  }
});

test('an uploaded image awaiting deployment survives a newer release request', async () => {
  const jobs = [
    { name: 'validate', status: 'completed', conclusion: 'success' },
    { name: 'build / image', status: 'completed', conclusion: 'success' },
    { name: 'deploy / deploy (lms)', status: 'pending', steps: [] },
  ];
  const f = fixture({ rows: [row(1, 'in_progress'), row(2)], jobs });
  const result = await pruneWebReleaseRequests({ ...f, repository, execute: true });
  assert.deepEqual(f.writes, []);
  assert.deepEqual(result, []);
});

test('deployment retries retain the verified image from an earlier attempt', async () => {
  const f = fixture({ rows: [row(1, 'in_progress'), row(2)] });
  let historyRead = false;
  const api = async (path, method) => {
    if (path.includes('/jobs')) {
      historyRead = path.includes('filter=all');
      const deploy = { name: 'deploy / deploy (lms)', status: 'pending', steps: [] };
      return {
        total_count: historyRead ? 2 : 1,
        jobs: historyRead
          ? [{ name: 'build / image', status: 'completed', conclusion: 'success' }, deploy]
          : [deploy],
      };
    }
    return f.api(path, method);
  };
  await pruneWebReleaseRequests({ api, repository, execute: true });
  assert.equal(historyRead, true);
  assert.deepEqual(f.writes, []);
});

test('tested Admin rollout completes while newer requests are only building', async () => {
  const { assertTestedAdminRollout } = await import('./prune-web-release-requests.mjs');
  const sha = 'a'.repeat(40);
  const api = async (path) =>
    path.includes('/workflows/')
      ? {
          workflow_runs: [
            row(1, 'in_progress', { head_sha: sha }),
            row(2, 'in_progress', { head_sha: 'b'.repeat(40) }),
          ],
        }
      : {
          total_count: 1,
          jobs: path.includes('/runs/1/')
            ? [{ name: 'Build and upload Admin image', status: 'completed', conclusion: 'success' }]
            : [{ name: 'Build and upload Admin image', status: 'in_progress' }],
        };
  assert.equal(
    (await assertTestedAdminRollout({ api, repository, runId: 1, commitSha: sha })).status,
    'tested_admin_image_allowed',
  );
  await assert.rejects(
    assertTestedAdminRollout({ api, repository, runId: 1, commitSha: 'b'.repeat(40) }),
    /COMMIT_MISMATCH/,
  );
});
test('Admin rollout requires a successful trusted image build and fails closed on job history', async () => {
  const { assertTestedAdminRollout } = await import('./prune-web-release-requests.mjs');
  const sha = 'a'.repeat(40);
  for (const jobs of [
    { total_count: 0, jobs: [] },
    {
      total_count: 1,
      jobs: [{ name: 'Build and upload Admin image', status: 'completed', conclusion: 'failure' }],
    },
    { total_count: 101, jobs: [] },
    {},
  ]) {
    const api = async (path) =>
      path.includes('/workflows/')
        ? { workflow_runs: [row(1, 'in_progress', { head_sha: sha })] }
        : jobs;
    await assert.rejects(
      assertTestedAdminRollout({ api, repository, runId: 1, commitSha: sha }),
      /TESTED_IMAGE_REQUIRED|INVENTORY_UNAVAILABLE/,
    );
  }
});
test('Admin rollout never overwrites a newer started or completed rollout', async () => {
  const { assertTestedAdminRollout } = await import('./prune-web-release-requests.mjs');
  const sha = 'a'.repeat(40);
  for (const newer of [
    { status: 'in_progress' },
    { status: 'completed', conclusion: 'success' },
    { status: 'completed', conclusion: 'failure' },
    { status: 'pending', steps: [{ status: 'completed' }] },
  ]) {
    const api = async (path) =>
      path.includes('/workflows/')
        ? { workflow_runs: [row(1, 'in_progress', { head_sha: sha }), row(2)] }
        : {
            total_count: 1,
            jobs: path.includes('/runs/1/')
              ? [
                  {
                    name: 'Build and upload Admin image',
                    status: 'completed',
                    conclusion: 'success',
                  },
                ]
              : [{ name: 'Deploy and verify Admin on Google', ...newer }],
          };
    await assert.rejects(
      assertTestedAdminRollout({ api, repository, runId: 1, commitSha: sha }),
      /NEWER_ADMIN_ROLLOUT_STARTED/,
    );
  }
});

test('a cancelled job that never acquired a runner cannot block an already tested image', async () => {
  const { assertTestedAdminRollout } = await import('./prune-web-release-requests.mjs');
  const sha = 'a'.repeat(40);
  // Actual GitHub receipt from cancelled run 40961423017: the dependent
  // deployment was created and cancelled at the same instant with no runner.
  const unstarted = { status: 'completed', conclusion: 'cancelled', steps: [],
    runner_id: null, runner_name: null,
    started_at: '2026-10-29T22:03:23Z', completed_at: '2026-10-29T22:03:23Z' };
  const check = (newer) => assertTestedAdminRollout({ repository, runId: 1, commitSha: sha,
    api: async (path) => path.includes('/workflows/')
      ? { workflow_runs: [row(1, 'in_progress', { head_sha: sha }), row(2, 'completed')] }
      : { total_count: 1, jobs: path.includes('/runs/1/')
          ? [{ name: 'Build and upload Admin image', status: 'completed', conclusion: 'success' }]
          : [{ name: 'Deploy and verify Admin on Google', ...newer }] } });
  for (const runner_id of [null, 0])
    assert.equal((await check({...unstarted, runner_id})).status, 'tested_admin_image_allowed');
  // Cancellation alone is never permission to reverse a potentially started rollout.
  for (const change of [{runner_id: 42}, {runner_name: 'runner'}, {runner_id: undefined},
    {steps: undefined}, {steps: [{status: 'completed'}]}, {started_at: null},
    {started_at: '2026-10-29T22:03:22Z'}, {conclusion: 'failure'}])
    await assert.rejects(check({...unstarted, ...change}), /NEWER_ADMIN_ROLLOUT_STARTED/);
});

for (const [workflow, label] of [
  ['deploy-admin.yml', 'Admin'],
  ['deploy-google-store-runtime.yml', 'Store'],
  ['deploy-google-marketing-trigger.yml', 'Marketing'],
]) {
  test(label + ' recognizes the observed one-second reversed unstarted cancellation receipt', async () => {
    const { assertTestedWebRollout } = await import('./prune-web-release-requests.mjs');
    const sha = 'a'.repeat(40);
    // Store run 40976564692 / job 123810031006 never acquired a runner.
    const receipt = { status: 'completed', conclusion: 'cancelled', steps: [],
      runner_id: null, runner_name: null,
      started_at: '2026-10-30T00:08:44Z', completed_at: '2026-10-30T00:08:43Z' };
    const check = (change = {}) => assertTestedWebRollout({ repository, workflow, runId: 1, commitSha: sha,
      api: async path => path.includes('/workflows/')
        ? { workflow_runs: [row(1, 'in_progress', { head_sha: sha }), row(2, 'completed')] }
        : { total_count: 1, jobs: path.includes('/runs/1/')
          ? [{ name: `Build and upload ${label} image`, status: 'completed', conclusion: 'success' }]
          : [{ name: `Deploy and verify ${label} on Google`, ...receipt, ...change }] } });
    assert.equal((await check()).status, `tested_${label.toLowerCase()}_image_allowed`);
    for (const change of [{runner_id: 42}, {runner_name: 'runner'}, {runner_id: undefined},
      {steps: [{status: 'completed'}]}, {steps: undefined}, {completed_at: null},
      {completed_at: 'invalid'}, {completed_at: '2026-10-30T00:08:45Z'},
      {completed_at: '2026-10-30T00:08:42Z'}, {conclusion: 'failure'}])
      await assert.rejects(check(change), /ROLLOUT_STARTED/);
  });
  test(
    label + ' rollout requires its tested digest source and cannot reverse a newer release',
    async () => {
      const { assertTestedWebRollout } = await import('./prune-web-release-requests.mjs');
      const sha = 'a'.repeat(40);
      const input = { repository, workflow, runId: 1, commitSha: sha };
      const apiFor =
        (buildStatus = 'success', newerDeploy = false) =>
        async (path) =>
          path.includes('/workflows/')
            ? { workflow_runs: [row(1, 'in_progress', { head_sha: sha }), row(2, 'in_progress')] }
            : {
                total_count: 1,
                jobs: path.includes('/runs/1/')
                  ? [
                      {
                        name: `Build and upload ${label} image`,
                        status: 'completed',
                        conclusion: buildStatus,
                      },
                    ]
                  : [
                      {
                        name: newerDeploy
                          ? `Deploy and verify ${label} on Google`
                          : `Build and upload ${label} image`,
                        status: 'in_progress',
                      },
                    ],
              };
      assert.equal(
        (await assertTestedWebRollout({ ...input, api: apiFor() })).status,
        `tested_${label.toLowerCase()}_image_allowed`,
      );
      await assert.rejects(
        assertTestedWebRollout({ ...input, api: apiFor('failure') }),
        /TESTED_IMAGE_REQUIRED/,
      );
      await assert.rejects(
        assertTestedWebRollout({ ...input, api: apiFor('success', true) }),
        /ROLLOUT_STARTED/,
      );
      await assert.rejects(
        assertTestedWebRollout({ ...input, commitSha: 'b'.repeat(40), api: apiFor() }),
        /COMMIT_MISMATCH/,
      );
    },
  );
}
