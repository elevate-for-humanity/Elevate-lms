import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { recoverExactCourseExecution } from './recover-exact-course-execution.mjs';
const workflow=readFileSync(new URL('../../.github/workflows/recover-obsolete-cpu-execution.yml',import.meta.url),'utf8');
test('manual recovery invokes a parseable tested module without automatic incident retries',()=>{
 assert.ok(workflow.includes('run: node scripts/gcp/recover-exact-course-execution.mjs'));
 assert.ok(!workflow.includes('workflow_run:')); assert.ok(!workflow.includes('push:'));
 const result=spawnSync(process.execPath,['--check',fileURLToPath(new URL('./recover-exact-course-execution.mjs',import.meta.url))],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});
test('recovery refuses unpinned and unrelated worker repositories before cancellation',async()=>{
 const image='us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker';
 for(const value of [image+':latest',image+'@sha256:abc',image.replace('elegant-racer-299721','other-project')+'@sha256:'+'a'.repeat(64)]) {
  const calls=[];
  await assert.rejects(recoverExactCourseExecution({name:'elevate-course-builder-x7tbr',run:args=>{
   calls.push(args);return JSON.stringify({spec:{template:{spec:{template:{spec:{containers:[{image:value}]}}}}}});
  }}),/GOOGLE_WORKER_TEMPLATE_NOT_PINNED/);
  assert.equal(calls.length,1);
 }
});
