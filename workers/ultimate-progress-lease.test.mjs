import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const source = stripTypeScriptTypes(await readFile(new URL('../lib/ultimate-course-builder/worker/job-queue.ts', import.meta.url), 'utf8'), { mode: 'transform' }).replace("'./default-course-monitor.mjs'", JSON.stringify(new URL('../lib/ultimate-course-builder/worker/default-course-monitor.mjs',import.meta.url).href)).replace("'./owner-preview-claim.mjs'", JSON.stringify(new URL('../lib/ultimate-course-builder/worker/owner-preview-claim.mjs',import.meta.url).href)).replace("'./dispatch-on-enqueue.mjs'", JSON.stringify(new URL('../lib/ultimate-course-builder/worker/dispatch-on-enqueue.mjs',import.meta.url).href));
const { UltimateJobQueue } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

function database(owned) {
  const writes = [];
  const filters = [];
  const query = {
    update(values) { writes.push(values); return query; },
    eq(...args) { filters.push(['eq', ...args]); return query; },
    gt(...args) { filters.push(['gt', ...args]); return query; },
    async select() { return { data: owned ? [{ id: 'job' }] : [], error: null }; },
  };
  return { db: { from() { return query; } }, writes, filters };
}

test('checkpoint continuation retains lesson repair evidence and a fresh execution retry budget', async () => {
  const f = database(true);
  const payload = { nextCompetencyIndex: 6, lessonRepairCounts: { lesson: 2 } };
  await new UltimateJobQueue(f.db).yieldProgress('job', 'worker', payload, 7);
  assert.equal(f.writes[0].status, 'queued');
  assert.equal(f.writes[0].attempts, 0);
  assert.deepEqual(f.writes[0].payload, payload);
  assert.ok(f.filters.some(x => x[0] === 'eq' && x[1] === 'execution_generation' && x[2] === 7));
  assert.ok(f.filters.some(x => x[0] === 'eq' && x[1] === 'lease_owner' && x[2] === 'worker'));
  assert.ok(f.filters.some(x => x[0] === 'gt' && x[1] === 'lease_expires_at'));
});

test('expired or superseded worker cannot yield a continuation', async () => {
  const f = database(false);
  await assert.rejects(new UltimateJobQueue(f.db).yieldProgress('job', 'old-worker', {}, 6), /ULTIMATE_JOB_LEASE_LOST/);
});
