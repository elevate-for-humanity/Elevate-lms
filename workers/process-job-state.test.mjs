import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const productionPath = process.env.PROCESS_JOB_SOURCE || new URL('../lib/ultimate-course-builder/worker/process-job.ts', import.meta.url);
const source = stripTypeScriptTypes(readFileSync(productionPath, 'utf8'))
  .replace(/^import .*;\n/gm, '').replace('export async function', 'async function');

function scenario(payload, completed = true) {
  const events = [];
  const build = { id: 'build', course_id: 'course', status: 'blocked', profile: { competencies: [{ id: 'competency' }] } };
  const q = { select: () => q, eq: () => q, single: async () => ({ data: build, error: null }) };
  const db = { from: () => q };
  class Queue {
    async claim() { return { id: 'job', build_id: 'build', payload }; }
    async heartbeat() { return true; }
    async complete() { events.push('complete'); }
    async fail() { events.push('fail'); }
  }
  const runtime = { persistence: { updateBuild: async value => events.push(value) }, artifacts: {} };
  const names = ['UltimateJobQueue', 'createUltimateRuntime', 'createProductionHandlers', 'UltimateBuildRunner', 'runUltimateCourse', 'assertCompleteLesson', 'UltimateReleaseService', 'nextCourseWork', 'resolveReleaseActor', 'hydrateUltimateProfileSources', 'materializeUltimateDraft'];
  const values = [Queue, async () => runtime, () => ({}), class {}, async () => ({ completed, findings: [], lessons: [] }), () => {}, class {}, () => ({ continue: false }), async () => 'actor', async (_db, _id, profile) => profile, async (_db, _id, profile) => profile];
  const worker = new Function(...names, source + '\nreturn processUltimateJob;')(...values);
  return { events, run: () => worker(db, 'owner') };
}

test('a successful targeted lesson clears course running state before releasing its job', async () => {
  for (const payload of [{ lessonBuildId: 'lesson' }, { competencyId: 'competency' }, { acceptance: true }]) {
    const s = scenario(payload);
    const result = await s.run();
    assert.equal(result.completed, true);
    assert.deepEqual(s.events, [{ buildId: 'build', status: 'blocked', currentStep: 'selective_repair' }, 'complete']);
  }
});

test('an incomplete targeted lesson stays in the existing repair queue instead of being completed', async () => {
  const s = scenario({ lessonBuildId: 'lesson' }, false);
  const result = await s.run();
  assert.equal(result.completed, false);
  assert.equal(result.repairQueued, true);
  assert.deepEqual(s.events, ['fail']);
});
