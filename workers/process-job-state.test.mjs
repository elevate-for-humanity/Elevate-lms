import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import {createLeaseDeadline} from '../lib/ultimate-course-builder/worker/runtime-guards.mjs';

const productionPath = process.env.PROCESS_JOB_SOURCE || new URL('../lib/ultimate-course-builder/worker/process-job.ts', import.meta.url);
const source = stripTypeScriptTypes(readFileSync(productionPath, 'utf8'))
  .replace(/^import .*;\n/gm, '').replace('export async function', 'async function');

function scenario(payload, completed = true, options = {}) {
  const events = [];
  const build = { id: 'build', course_id: 'course', status: 'blocked', profile: { competencies: [{ id: 'competency' }] } };
  const q = { select: () => q, eq: () => q, single: async () => ({ data: build, error: null }) };
  const db = { from: () => q };
  class Queue {
    async claim() { return { id: 'job', build_id: 'build', execution_generation: 1, payload }; }
    async heartbeat() { return true; }
    async complete() { events.push('complete'); }
    async fail() { events.push('fail'); }
  }
  const runtime = { persistence: { updateBuild: async value => events.push(value) }, artifacts: {} };
  const names = ['createLeaseDeadline', 'UltimateJobQueue', 'createUltimateRuntime', 'createProductionHandlers', 'UltimateBuildRunner', 'runUltimateCourse', 'assertCompleteLesson', 'UltimateReleaseService', 'nextCourseWork', 'resolveReleaseActor', 'hydrateUltimateProfileSources', 'materializeUltimateDraft'];
  const values = [options.leaseFactory || createLeaseDeadline, Queue, async () => runtime, () => ({}), class {}, options.runCourse || (async () => ({ completed, findings: [], lessons: [] })), () => {}, class {}, () => ({ continue: false }), async () => 'actor', async (_db, _id, profile) => profile, async (_db, _id, profile) => profile];
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

test('a media task that never returns loses its lease without completing or changing the job',async()=>{
 const s=scenario({acceptance:true},false,{leaseFactory:(id,options)=>createLeaseDeadline(id,{...options,leaseMs:10}),runCourse:()=>new Promise(()=>{})});
 const result=await s.run();assert.equal(result.completed,false);assert.match(result.error,/LEASE_LOST/);assert.deepEqual(s.events,[]);
});
