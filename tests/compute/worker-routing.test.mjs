import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

const queueUrl = new URL('../../lib/ultimate-course-builder/worker/job-queue.ts', import.meta.url);
// A data URL has no directory. Resolve every static relative import against
// the real module so newly added queue dependencies are tested without stubs.
const source = stripTypeScriptTypes(await readFile(queueUrl, 'utf8'), {mode: 'transform'})
  .replace(/\bfrom\s+(['"])(\.{1,2}\/[^'"]+)\1/g,
    (_match, _quote, specifier) => `from ${JSON.stringify(new URL(specifier, queueUrl).href)}`);
const {UltimateJobQueue} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
function scope(t, attempt, preview) {
  const saved = {...process.env};
  for (const key of ['EXTERNAL_COURSE_ATTEMPT_ID','ULTIMATE_OWNER_PREVIEW_JOB_ID']) delete process.env[key];
  if (attempt) process.env.EXTERNAL_COURSE_ATTEMPT_ID = attempt;
  if (preview) process.env.ULTIMATE_OWNER_PREVIEW_JOB_ID = preview;
  t.after(() => {
    for (const key of ['EXTERNAL_COURSE_ATTEMPT_ID','ULTIMATE_OWNER_PREVIEW_JOB_ID']) {
      if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
    }
  });
}
test('existing Google workers retain the canonical claim RPC', async t => {
  scope(t); const calls = [];
  const queue = new UltimateJobQueue({rpc: async (name, input) => {calls.push([name, input]); return {data: [{id: 'google-job'}]};}});
  assert.deepEqual(await queue.claim('google-worker'), {id: 'google-job'});
  assert.deepEqual(calls, [['claim_ultimate_build_job', {p_worker: 'google-worker', p_lease_seconds: 300}]]);
});
test('empty external target never falls through to Google or another tenant job', async t => {
  scope(t, 'exact-attempt'); const calls = [];
  const queue = new UltimateJobQueue({rpc: async (name, input) => {calls.push([name, input]); return {data: []};}});
  assert.equal(await queue.claim('modal-worker'), null);
  assert.deepEqual(calls, [['claim_external_course_job', {p_attempt: 'exact-attempt', p_worker: 'modal-worker'}]]);
});
test('conflicting exact targets refuse all claims', async t => {
  scope(t, 'external', 'preview'); let calls = 0;
  const queue = new UltimateJobQueue({rpc: async () => {calls++; return {data: []};}});
  await assert.rejects(queue.claim('modal-worker'), /CONFLICTING_EXACT/); assert.equal(calls, 0);
});
test('external claim failure is surfaced without retrying another provider', async t => {
  scope(t, 'external'); let calls = 0;
  const queue = new UltimateJobQueue({rpc: async () => {calls++; return {error: Error('permission denied')};}});
  await assert.rejects(queue.claim('modal-worker'), /permission denied/); assert.equal(calls, 1);
});
