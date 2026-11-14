import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForReadyRevision } from './wait-ready-public-revision.mjs';

const revision = 'elevate-marketing-migration-r12345678-123-1';
const noPause = async () => {};
const response = status => JSON.stringify({ status: { conditions: [{ type: 'Ready', status }] } });

test('asynchronous creation waits for the exact revision, without switching traffic', async () => {
  let calls = 0;
  const read = args => {
    assert.deepEqual(args.slice(0, 4), ['run', 'revisions', 'describe', revision]);
    assert.ok(args.includes('--region=us-central1'));
    calls++;
    if (calls === 1) throw Object.assign(new Error('not yet created'), { code: 'not_found' });
    return response(calls === 2 ? 'Unknown' : 'True');
  };
  assert.deepEqual(await waitForReadyRevision({ revision, read, pause: noPause, attempts: 3 }), { revision, ready: true });
  assert.equal(calls, 3);
});

test('unready revision exhausts bounded polling and fails closed', async () => {
  let calls = 0;
  await assert.rejects(waitForReadyRevision({ revision, read: () => { calls++; return response('False'); }, pause: noPause, attempts: 2 }), /readiness timed out/);
  assert.equal(calls, 2);
});

test('permission failure is surfaced immediately', async () => {
  await assert.rejects(waitForReadyRevision({ revision, read: () => { throw Object.assign(new Error('permission denied'), { code: 'permission_denied' }); }, pause: noPause }), /permission denied/);
});

test('wrong service cannot be polled as a Marketing release', async () => {
  await assert.rejects(waitForReadyRevision({ revision: 'elevate-admin-migration-123', read: () => { throw new Error('must not run'); } }), /Exact Marketing revision required/);
});
