import test from 'node:test';
import assert from 'node:assert/strict';
import { continueCourseQueue } from './continue-course-queue.mjs';
test('continues after a running task and fresh claim, then stops without dispatching an empty queue', async () => {
  const states = ['busy', 'assigned', 'busy', 'empty']; let clock = 0, handoffs = 0;
  const result = await continueCourseQueue({ dispatch: async () => ({ status: states.shift() }), now: () => clock,
    delay: async ms => { clock += ms; }, request: async () => { handoffs++; }, onState: () => {} });
  assert.equal(result.status, 'empty'); assert.equal(handoffs, 0);
});
test('hands remaining eligible work to one bounded trusted-main successor', async () => {
  let clock = 0; const calls = [];
  const result = await continueCourseQueue({ dispatch: async () => ({ status: 'busy' }), now: () => clock,
    delay: async ms => { clock += ms; }, budgetMs: 30_000, onState: () => {},
    env: { GITHUB_REPOSITORY: 'elevate-for-humanity/Elevate-lms', GH_TOKEN: 'test' },
    request: async (url, options) => { calls.push({ url, options }); return { status: 204 }; } });
  assert.equal(result.status, 'handed_off'); assert.equal(calls.length, 1);
  assert.deepEqual(JSON.parse(calls[0].options.body), { ref: 'main' });
});
test('does not certify or hand off when the dispatcher or acknowledgment fails', async () => {
  await assert.rejects(continueCourseQueue({ dispatch: async () => { throw Error('queue unavailable'); }, onState: () => {} }), /queue unavailable/);
  await assert.rejects(continueCourseQueue({ dispatch: async () => ({ status: 'capacity_wait' }), budgetMs: 0,
    env: { GITHUB_REPOSITORY: 'elevate-for-humanity/Elevate-lms', GH_TOKEN: 'test' },
    request: async () => ({ status: 403 }), onState: () => {} }), /HANDOFF_HTTP_403/);
});
test('no credential or wrong repository cannot schedule a successor', async () => {
  await assert.rejects(continueCourseQueue({ dispatch: async () => ({ status: 'busy' }), budgetMs: 0,
    env: {}, onState: () => {} }), /DISPATCH_AUTHORITY_REQUIRED/);
});
