import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/worker/job-queue.ts', import.meta.url), 'utf8'), { mode: 'transform' });
const { UltimateJobQueue } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

function database(rows = [{ id: 'job' }]) {
  const writes = [];
  const predicates = [];
  const query = {
    update(value) { writes.push(value); return this; },
    eq(...args) { predicates.push(['eq', ...args]); return this; },
    gt(...args) { predicates.push(['gt', ...args]); return this; },
    async select() { return { data: rows, error: null }; },
  };
  return { writes, predicates, from: () => query };
}

test('dependency waiting saves the final cursor without manufacturing a wakeup or resetting retries', async () => {
  const db = database();
  const payload = { requestedBy: 'admin', nextCompetencyIndex: 14,
    lessonRepairCounts: { a: 2 }, unresolvedCompetencyIds: ['a'], acceptanceBuild: true };
  await new UltimateJobQueue(db).waitForDependency('job', 'worker', 'missing media', 9, payload);
  assert.deepEqual(db.writes[0].payload, payload);
  assert.equal('pending_dependency_resume' in db.writes[0], false);
  assert.equal('attempts' in db.writes[0], false);
  assert.equal('execution_generation' in db.writes[0], false);
  assert.equal(db.writes[0].status, 'failed');
  assert.ok(db.predicates.some(p => p[1] === 'lease_owner' && p[2] === 'worker'));
  assert.ok(db.predicates.some(p => p[1] === 'execution_generation' && p[2] === 9));
  assert.ok(db.predicates.some(p => p[1] === 'status' && p[2] === 'running'));
  assert.ok(db.predicates.some(p => p[0] === 'gt' && p[1] === 'lease_expires_at'));
});

test('targeted waits leave existing scope and dependency-arrival events untouched', async () => {
  const db = database();
  await new UltimateJobQueue(db).waitForDependency('job', 'worker', 'access denied', 9);
  assert.equal('payload' in db.writes[0], false);
  assert.equal('pending_dependency_resume' in db.writes[0], false);
});

test('a stale worker cannot report a successful dependency transition', async () => {
  const db = database([]);
  await assert.rejects(new UltimateJobQueue(db).waitForDependency('job', 'stale', 'blocked', 8),
    /ULTIMATE_JOB_LEASE_LOST:job/);
});
