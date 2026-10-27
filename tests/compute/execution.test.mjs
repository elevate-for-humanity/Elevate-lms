import test from 'node:test';
import assert from 'node:assert/strict';
import {submitExecution, cancelExecution} from '../../lib/compute/execution.mjs';
import {createModalProvider} from '../../lib/compute/modal-provider.mjs';
import {estimateComputeCost, creditSettlement} from '../../lib/compute/resource-cost.mjs';

function fixture() {
  let state = 'prepared'; const calls = [];
  const db = {async rpc(name, input) {
    calls.push([name, input]);
    if (name === 'begin_external_course_dispatch') {
      if (state !== 'prepared') return {data: []};
      state = 'dispatching'; return {data: [{id: 'attempt', provider: 'modal'}]};
    }
    if (name === 'mark_external_course_uncertain') state = 'uncertain';
    return {data: true};
  }};
  return {db, calls, state: () => state};
}
test('concurrent dispatches submit only once', async () => {
  const f = fixture(); let starts = 0;
  const providers = {modal: {async submit() {starts++; return {executionId: 'fc-test'};}}};
  const results = await Promise.all([submitExecution(f.db, 'attempt', providers), submitExecution(f.db, 'attempt', providers)]);
  assert.equal(starts, 1); assert.equal(results.filter(r => r.dispatched).length, 1);
  assert.equal(results[0].executionVerified, false);
});
test('timeout leaves an uncertain receipt and never invokes fallback', async () => {
  const f = fixture(); let fallback = 0;
  const providers = {modal: {async submit() {throw Error('timeout');}}, google: {async submit() {fallback++;}}};
  await assert.rejects(submitExecution(f.db, 'attempt', providers), /UNCERTAIN/);
  assert.equal(f.state(), 'uncertain'); assert.equal(fallback, 0);
  assert.equal((await submitExecution(f.db, 'attempt', providers)).dispatched, false);
});
test('acknowledgement persistence failure stays uncertain', async () => {
  const f = fixture(), original = f.db.rpc;
  f.db.rpc = (name, input) => name === 'ack_external_course_dispatch' ? {error: Error('storage')} : original(name, input);
  await assert.rejects(submitExecution(f.db, 'attempt', {modal: {submit: async () => ({executionId: 'fc-real'})}}), /UNCERTAIN/);
  assert.equal(f.state(), 'uncertain');
});
test('cancellation acknowledgement never refunds credits or releases a lease', async () => {
  const calls = []; let cancelled;
  const db = {async rpc(name) {calls.push(name); return {data: [{provider: 'modal', provider_execution_id: 'fc-real'}]};}};
  const result = await cancelExecution(db, 'attempt', {modal: {async cancel(input) {cancelled = input;}}});
  assert.deepEqual(cancelled, {executionId: 'fc-real'});
  assert.equal(result.reconciliationRequired, true); assert.deepEqual(calls, ['request_external_course_cancel']);
});
test('Modal refuses missing authority and untrusted destinations before network', () => {
  assert.throws(() => createModalProvider({env: {}}), /DISABLED/);
  for (const url of ['http://fixture.modal.run', 'https://modal.run.evil.test', 'https://fixture.modal.run/?token=secret'])
    assert.throws(() => createModalProvider({env: {EXTERNAL_COMPUTE_ENABLED: 'true', MODAL_COMPUTE_ENDPOINT: url}}), /TRUSTED/);
});
test('Modal uses proxy auth and refuses redirects with no retry', async () => {
  let calls = 0;
  const provider = createModalProvider({env: {EXTERNAL_COMPUTE_ENABLED: 'true', MODAL_COMPUTE_ENDPOINT: 'https://fixture.modal.run', MODAL_PROXY_KEY: 'test-key', MODAL_PROXY_SECRET: 'test-secret'},
    request: async (_url, options) => {
      calls++; assert.equal(options.redirect, 'error'); assert.equal(options.headers['Modal-Key'], 'test-key');
      assert.deepEqual(JSON.parse(options.body), {action: 'submit', attemptId: 'attempt'});
      return new Response('{}', {status: 503});
    }});
  await assert.rejects(provider.submit({attemptId: 'attempt'}), /HTTP_503/); assert.equal(calls, 1);
});
test('cost and credit calculations enforce bounded settlement', () => {
  // 60 seconds * (2 CPUs * 10 microdollars + 4 GiB * 5) = 2400 microdollars.
  assert.equal(estimateComputeCost({wallSeconds: 60, cpu: 2, memoryMiB: 4096, cpuMicrosPerSecond: 10, memoryMicrosPerGiBSecond: 5}), 2400);
  assert.deepEqual(creditSettlement(100, 60), {settled: 60, refund: 40, uncovered: 0});
  assert.deepEqual(creditSettlement(100, 120), {settled: 100, refund: 0, uncovered: 20});
  assert.throws(() => creditSettlement(100, NaN), /INVALID/);
  assert.throws(() => estimateComputeCost({wallSeconds: -1}), /INVALID/);
});
