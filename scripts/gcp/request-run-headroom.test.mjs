import test from 'node:test';
import assert from 'node:assert/strict';
import { quotaContact, requestHeadroom, targets } from './request-run-headroom.mjs';

const resource = id => 'projects/484736877039/locations/global/quotaPreferences/' + id;
const response = (body, status = 200) => ({ok: status >= 200 && status < 300, status, json: async () => body});
function preference(target, overrides = {}) {
  return {name: resource(target.id), service: 'run.googleapis.com', quotaId: target.quotaId,
    dimensions: {region: 'us-central1'}, etag: 'version-1',
    quotaConfig: {preferredValue: target.preferredValue, grantedValue: '20000'}, ...overrides};
}
function provider({preferences = {}, effective = '20000', mutate} = {}) {
  const writes = [];
  const reads = [];
  const request = async (input, options) => {
    const url = new URL(input);
    if (!options.method) {
      reads.push(url.pathname);
      if (url.pathname.includes('/quotaInfos/')) return response({dimensionsInfos: [
        {dimensions: {region: 'us-central1'}, details: {value: effective}},
      ]});
      const id = url.pathname.split('/').at(-1);
      return Object.hasOwn(preferences, id) ? response(preferences[id]) : response({error: {status: 'NOT_FOUND'}}, 404);
    }
    const body = JSON.parse(options.body);
    writes.push({url, options, body});
    assert.equal(url.searchParams.has('ignoreSafetyChecks'), false);
    assert.equal(url.searchParams.has('allowMissing'), false);
    return mutate ? mutate({url, options, body}) : response({error: {status: 'FAILED_PRECONDITION'}}, 400);
  };
  return {request, writes, reads};
}

test('ambiguous contacts stop instead of selecting someone arbitrarily', () => {
  assert.throws(() => quotaContact({bindings: []}), /One existing/);
  assert.throws(() => quotaContact({bindings: [{role: 'roles/owner', members: ['user:a@example.test', 'user:b@example.test']}]}), /One existing/);
  assert.equal(quotaContact({bindings: [{role: 'roles/owner', members: ['serviceAccount:ignored', 'user:owner@example.test']}]}), 'owner@example.test');
});

test('default creates only the bounded preferences and preserves provider checks', async () => {
  const api = provider();
  const results = await requestHeadroom('token', 'owner@example.test', api.request);
  assert.deepEqual(api.writes.map(x => x.body.quotaConfig.preferredValue), ['128000', '274877906944']);
  assert(api.writes.every(x => x.options.method === 'POST' && x.body.dimensions.region === 'us-central1'));
  assert(api.reads.includes('/v1/' + resource('elevate-run-memory-us-central1')));
  assert(results.every(x => x.accepted === false));
});

test('explicit maximum patches exact owned preferences using their etags and a narrow mask', async () => {
  const api = provider({preferences: Object.fromEntries(targets.map(t => [t.id, preference(t)]))});
  await requestHeadroom('token', 'owner@example.test', api.request, {requestMaximum: true});
  assert.equal(api.writes.length, 2);
  for (const [index, write] of api.writes.entries()) {
    assert.equal(write.options.method, 'PATCH');
    assert.equal(write.url.pathname, '/v1/' + resource(targets[index].id));
    assert.equal(write.url.searchParams.get('updateMask'), 'quotaConfig.preferredValue,justification,contactEmail');
    assert.deepEqual(Object.keys(write.body).sort(), ['contactEmail', 'dimensions', 'etag', 'justification', 'name', 'quotaConfig', 'quotaId', 'service']);
    assert.equal(write.body.service, 'run.googleapis.com');
    assert.equal(write.body.quotaId, targets[index].quotaId);
    assert.deepEqual(write.body.dimensions, {region: 'us-central1'});
    assert.equal(write.body.etag, 'version-1');
    assert.equal(write.body.quotaConfig.preferredValue, '-1');
  }
});

test('maximum can create missing owned preferences but needs explicit boolean authorization', async () => {
  const api = provider();
  await requestHeadroom('token', 'owner@example.test', api.request, {requestMaximum: true});
  assert.deepEqual(api.writes.map(x => x.body.quotaConfig.preferredValue), ['-1', '-1']);
  await assert.rejects(requestHeadroom('token', 'owner@example.test', api.request, {requestMaximum: 'true'}), /boolean/);
});

test('unlimited effective quota is sufficient for finite and maximum requests', async () => {
  for (const requestMaximum of [false, true]) {
    const api = provider({effective: '-1'});
    const results = await requestHeadroom('token', 'owner@example.test', api.request, {requestMaximum});
    assert.equal(api.writes.length, 0);
    assert(results.every(x => x.alreadySufficient === true && x.effectiveValue === '-1'));
  }
});

test('matching or larger prior requests are idempotent without treating them as granted', async () => {
  for (const preferredValue of ['999999999999']) {
    const api = provider({preferences: Object.fromEntries(targets.map(t => [t.id,
      preference(t, {quotaConfig: {preferredValue, grantedValue: '20000'}})]))});
    const results = await requestHeadroom('token', 'owner@example.test', api.request);
    assert.equal(api.writes.length, 0);
    assert(results.every(x => x.alreadyRequested && !x.alreadySufficient));
    assert(results.every(x => x.requestedValue === preferredValue && x.grantedValue === '20000' && x.reconciling === undefined));
  }
  const api = provider({preferences: Object.fromEntries(targets.map(t => [t.id, preference(t)]))});
  const results = await requestHeadroom('token', 'owner@example.test', api.request);
  assert.equal(api.writes.length, 0);
  assert(results.every(x => x.alreadyRequested));
});

test('matching unlimited requests do not issue another maximum request', async () => {
  const api = provider({preferences: Object.fromEntries(targets.map(t => [t.id,
    preference(t, {quotaConfig: {preferredValue: '-1', grantedValue: '20000'}})]))});
  const results = await requestHeadroom('token', 'owner@example.test', api.request, {requestMaximum: true});
  assert.equal(api.writes.length, 0);
  assert(results.every(x => x.alreadyRequested && !x.alreadySufficient));
});

test('never lowers an existing provider grant while effective quota catches up', async () => {
  const api = provider({preferences: Object.fromEntries(targets.map(t => [t.id,
    preference(t, {quotaConfig: {preferredValue: '10000', grantedValue: '-1'}})]))});
  const results = await requestHeadroom('token', 'owner@example.test', api.request);
  assert.equal(api.writes.length, 0);
  assert(results.every(x => x.alreadyGranted && !x.alreadySufficient));
});

test('refuses mismatched preference identity, scope, or missing etag before updating', async () => {
  const first = targets[0];
  for (const override of [
    {name: resource('someone-elses-preference')}, {service: 'compute.googleapis.com'},
    {quotaId: 'OtherQuota'}, {dimensions: {region: 'us-east1'}},
    {dimensions: {region: 'us-central1', zone: 'us-central1-a'}}, {etag: ''},
  ]) {
    const api = provider({preferences: {[first.id]: preference(first, override)}});
    await assert.rejects(requestHeadroom('token', 'owner@example.test', api.request, {requestMaximum: true}), /preference|etag/i);
    assert.equal(api.writes.length, 0);
  }
});

test('accepts only the two known project name aliases for an owned preference', async () => {
  const api = provider({preferences: Object.fromEntries(targets.map(t => [t.id,
    preference(t, {name: resource(t.id).replace('484736877039', 'elegant-racer-299721')})]))});
  await requestHeadroom('token', 'owner@example.test', api.request, {requestMaximum: true});
  assert.equal(api.writes.length, 2);
  const other = provider({preferences: {[targets[0].id]: preference(targets[0],
    {name: resource(targets[0].id).replace('484736877039', 'another-project')})}});
  await assert.rejects(requestHeadroom('token', 'owner@example.test', other.request, {requestMaximum: true}), /preference/i);
  assert.equal(other.writes.length, 0);
});

test('quota read and owned preference read failures never turn into creation', async () => {
  for (const failQuotaRead of [true, false]) {
    let writes = 0;
    const request = async (url, options) => {
      if (options.method) writes++;
      if (failQuotaRead || !String(url).includes('/quotaInfos/')) return response({error: {status: 'PERMISSION_DENIED'}}, 403);
      return response({dimensionsInfos: [{dimensions: {region: 'us-central1'}, details: {value: '20000'}}]});
    };
    await assert.rejects(requestHeadroom('token', 'owner@example.test', request), /read/i);
    assert.equal(writes, 0);
  }
});

test('etag rejection is reported without retrying or overwriting another update', async () => {
  const api = provider({preferences: Object.fromEntries(targets.map(t => [t.id, preference(t)])),
    mutate: () => response({error: {status: 'ABORTED', message: 'etag conflict for owner@example.test; token=private-token'}}, 409)});
  const results = await requestHeadroom('token', 'owner@example.test', api.request, {requestMaximum: true});
  assert.equal(api.writes.length, 2);
  assert(results.every(x => x.accepted === false && x.errorStatus === 'ABORTED'));
  assert(results.every(x => x.errorMessage.startsWith('etag conflict')));
  assert(!/owner@example|private-token/.test(JSON.stringify(results)));
});

test('reports accepted versus effective and granted values with sanitized provider diagnostics', async () => {
  const api = provider({mutate: () => response({quotaConfig: {preferredValue: '32000', grantedValue: '20000',
    stateDetail: 'Denied for owner@example.test; token=private-token Bearer hidden-value secret=hidden-secret',
    traceId: 'trace-123'}, reconciling: false, contactEmail: 'owner@example.test', justification: 'private-context'})});
  const results = await requestHeadroom('private-token', 'owner@example.test', api.request);
  assert(results.every(x => x.accepted === true && x.grantedValue === '20000' && x.effectiveValue === '20000' && x.reconciling === false));
  assert(results.every(x => x.traceId === 'trace-123' && x.stateDetail.startsWith('Denied')));
  assert.equal(api.reads.filter(x => x.includes('/quotaInfos/')).length, 4);
  assert(!/private|owner@example|hidden-value|hidden-secret/.test(JSON.stringify(results)));
});

test('finite 128 CPU and 256 GiB request replaces previously declined unlimited preference', async () => {
  const api = provider({preferences: Object.fromEntries(targets.map(t => [t.id,
    preference(t, {quotaConfig: {preferredValue: '-1', grantedValue: t.quotaId.startsWith('Cpu') ? '20000' : '42949672960'}})])),
    mutate: ({body}) => response({quotaConfig: {preferredValue: body.quotaConfig.preferredValue, grantedValue: '20000'}})});
  const results = await requestHeadroom('token', 'owner@example.test', api.request);
  assert.deepEqual(api.writes.map(x => x.body.quotaConfig.preferredValue), ['128000', '274877906944']);
  assert(api.writes.every(x => x.options.method === 'PATCH'));
  assert(results.every(x => x.accepted && x.effectiveValue === '20000'));
});
