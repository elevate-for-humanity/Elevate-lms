import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isOpenHandsManagedTask, shouldExpireOpenHandsWithoutReceipt } from '../../lib/devstudio/openhands/studio-timeout-policy.mjs';

const now = Date.parse('2026-11-22T15:00:00.000Z');
const old = '2026-11-22T08:00:00.000Z';
const base = {
  tool_name: 'openhands.execute',
  status: 'running',
  created_at: old,
  started_at: old,
  requires_approval: false,
  approval_status: 'not_required',
  tool_output: {},
};

test('generic Studio recovery delegates all OpenHands tasks to dedicated reconciliation', () => {
  assert.equal(isOpenHandsManagedTask(base), true);
  assert.equal(isOpenHandsManagedTask({...base, tool_name: null}), false);
  assert.equal(isOpenHandsManagedTask({...base, tool_name: 'other.tool'}), false);
  const source = readFileSync(new URL('../../lib/devstudio/os/task-runner.ts', import.meta.url), 'utf8');
  assert.match(source, /if \(isOpenHandsManagedTask\(task\)\) continue;/);
});

test('accepted provider start survives 360 minutes without a duplicate paid execution', () => {
  assert.equal(shouldExpireOpenHandsWithoutReceipt({
    ...base, tool_output: {start_task_id: 'original-provider-start'},
  }, now, 360), false);
});

test('pending or inconsistent approval is never treated as an expired job', () => {
  for (const status of ['pending', 'rejected', null, 'unknown']) {
    assert.equal(shouldExpireOpenHandsWithoutReceipt({
      ...base, requires_approval: true, approval_status: status,
    }, now, 360), false);
  }
});

test('an unaccepted dispatch remains bounded under normal timeout policy', () => {
  assert.equal(shouldExpireOpenHandsWithoutReceipt(base, now, 360), true);
  assert.equal(shouldExpireOpenHandsWithoutReceipt({
    ...base, started_at: '2026-11-22T14:00:00.000Z',
  }, now, 360), false);
  assert.equal(shouldExpireOpenHandsWithoutReceipt({
    ...base, status: 'awaiting_approval',
  }, now, 360), false);
});

test('missing timestamps cannot cause a false timeout', () => {
  assert.equal(shouldExpireOpenHandsWithoutReceipt({
    ...base, started_at: null, created_at: null,
  }, now, 360), false);
});
