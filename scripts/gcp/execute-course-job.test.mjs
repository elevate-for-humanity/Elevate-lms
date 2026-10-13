import test from 'node:test';
import assert from 'node:assert/strict';
import { assertNoActiveExecutions } from './execute-course-job.mjs';

test('blocks running and pending executions before dispatch', () => {
  for (const status of [{}, { conditions: [{ type: 'Completed', status: 'Unknown' }] }]) {
    assert.throws(() => assertNoActiveExecutions([{ status }]), /ALREADY_ACTIVE/);
  }
  assert.throws(() => assertNoActiveExecutions(null), /INVALID/);
});
test('permits an empty history and terminal failed or successful tasks', () => {
  assertNoActiveExecutions([]);
  assertNoActiveExecutions([{ status: { completionTime: '2026-10-06T10:00:00Z' } }]);
  for (const status of ['True', 'False']) {
    assertNoActiveExecutions([{ status: { conditions: [{ type: 'Completed', status }] } }]);
  }
});
