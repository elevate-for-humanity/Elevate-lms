import test from 'node:test';
import assert from 'node:assert/strict';
import { quotaContact, requestHeadroom } from './request-run-headroom.mjs';

test('ambiguous contacts stop instead of selecting someone arbitrarily', () => {
  assert.throws(() => quotaContact({bindings: []}), /One existing/);
  assert.throws(() => quotaContact({bindings: [{role: 'roles/owner', members: ['user:a@example.test', 'user:b@example.test']}]}), /One existing/);
  assert.equal(quotaContact({bindings: [{role: 'roles/owner', members: ['serviceAccount:ignored', 'user:owner@example.test']}]}), 'owner@example.test');
});
test('bounded requests preserve provider checks and do not expose contact or token', async () => {
  const sent = [];
  const results = await requestHeadroom('private-token', 'private@example.test', async (url, options) => {
    if (!options.method) return {ok: true, json: async () => ({dimensionsInfos: [{dimensions: {region: 'us-central1'}, details: {value: '20000'}}]})};
    assert.equal(options.method, 'POST');
    assert(!url.includes('ignoreSafetyChecks'));
    sent.push(JSON.parse(options.body));
    return {ok: false, status: 400, json: async () => ({error: {status: 'FAILED_PRECONDITION', message: 'private details', details: [{reason: 'NOT_ENOUGH_USAGE_HISTORY'}]}})};
  });
  assert.deepEqual(sent.map(x => x.quotaConfig.preferredValue), ['32000', '68719476736']);
  assert(sent.every(x => x.dimensions.region === 'us-central1'));
  assert(results.every(x => !x.accepted));
  assert(!JSON.stringify(results).includes('private'));
});
test('sufficient quota causes no writes or decrease', async () => {
  let calls = 0;
  const results = await requestHeadroom('token', 'owner@example.test', async (url, options) => {
    calls++;
    assert.equal(options.method, undefined);
    return {ok: true, json: async () => ({dimensionsInfos: [{dimensions: {region: 'us-central1'}, details: {value: '999999999999'}}]})};
  });
  assert.equal(calls, 2);
  assert(results.every(x => x.alreadySufficient));
});
