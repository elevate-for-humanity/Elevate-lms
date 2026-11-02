import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveMainRelease, hasPendingSuccessor, run } from './resolve-main-release.mjs';
const current = 'a'.repeat(40),
  latest = 'b'.repeat(40);
const input = { ref: 'refs/heads/main', current, requested: current, latest: current };
test('current main is eligible for exact revision verification', () => {
  assert.deepEqual(resolveMainRelease(input), { ready: true, successor: null });
});
test('superseded main hands off without authorizing stale deployment', () => {
  assert.deepEqual(resolveMainRelease({ ...input, latest }), { ready: false, successor: latest });
});
test('manual dispatch can omit requested SHA', () => {
  assert.equal(resolveMainRelease({ ...input, requested: '' }).ready, true);
});
test('a delayed request hands off even when the workflow already sees newer main', () => {
  assert.deepEqual(resolveMainRelease({ ...input, requested: latest }), {
    ready: false,
    successor: current,
  });
});
test('non-main and malformed requests remain blocked', () => {
  for (const patch of [
    { ref: 'refs/heads/fix' },
    { current: 'unknown' },
    { latest: '' },
    { requested: 'invalid' },
  ]) {
    assert.throws(() => resolveMainRelease({ ...input, ...patch }));
  }
});

test('a handoff reuses an already queued or running exact-main release', () => {
  for (const status of ['queued', 'pending', 'waiting', 'requested', 'in_progress'])
    assert.equal(
      hasPendingSuccessor(
        {
          workflow_runs: [
            { head_branch: 'main', event: 'workflow_dispatch', head_sha: latest, status },
          ],
        },
        latest,
      ),
      true,
    );
});
test('failed, completed, other-branch and other-commit runs cannot suppress a required release', () => {
  const run = {
    head_branch: 'main',
    event: 'workflow_dispatch',
    head_sha: latest,
    status: 'queued',
  };
  for (const patch of [
    { status: 'completed' },
    { head_branch: 'work' },
    { head_sha: current },
    { event: 'push' },
  ])
    assert.equal(hasPendingSuccessor({ workflow_runs: [{ ...run, ...patch }] }, latest), false);
  assert.throws(() => hasPendingSuccessor({}, latest), /inventory unavailable/);
});

test('large workflow inventories are projected by gh before stdout buffering', async () => {
  const { mkdtempSync, readFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'release-inventory-'));
  const calls = [];
  try {
    const result = run({ GITHUB_REPOSITORY: 'elevate-for-humanity/Elevate-lms', RELEASE_WORKFLOW: 'deploy-google-lms-trigger.yml', GITHUB_REF: 'refs/heads/main', GITHUB_SHA: current, REQUESTED_SHA: current, GITHUB_OUTPUT: join(dir, 'output') }, (_command, args) => {
      calls.push(args);
      if (args.includes('.object.sha')) return latest;
      if (args.some(value => value.includes('/runs?'))) {
        assert.ok(args.some(value => value.includes('head_sha=' + latest)));
        assert.equal(args.at(-2), '--jq');
        assert.ok(args.at(-1).includes('{head_branch, event, head_sha, status}'));
        return JSON.stringify({workflow_runs:[{head_branch:'main',event:'workflow_dispatch',head_sha:latest,status:'queued'}]});
      }
      throw new Error('An existing exact-main successor must prevent duplicate dispatch');
    });
    assert.equal(result.ready, false);
    assert.equal(calls.length, 2);
    assert.equal(readFileSync(join(dir, 'output'), 'utf8'), 'ready=false\n');
  } finally { rmSync(dir, {recursive:true,force:true}); }
});
