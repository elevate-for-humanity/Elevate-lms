import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(new URL('../../.github/workflows/'+name,import.meta.url),'utf8');

test('legacy repair entrypoints route to canonical guarded worker dispatch without pinned SHA or destructive restart',()=>{
 for(const name of ['resume-repaired-course-worker.yml','resume-barber-hvac-repairs.yml']){
  const workflow=read(name);
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/actions\/workflows\/dispatch-google-course-job\.yml\/dispatches/);
  assert.doesNotMatch(workflow,/workflow_run:|head_sha\s*==|REPAIRED_IMAGE_SHA|FORCE_COURSE_RESTART|attempts:\s*0|start-(?:repaired-course-overflow|barber-hvac-repair)\.mjs/);
 }
});

test('strict predeploy assessment runs for every PR targeting main, independent of its name',()=>{
 const workflow=read('predeploy-check.yml');
 const step=workflow.split('name: Enforce strict Platform Doctor on every PR')[1]?.split('\n      - name:')[0];
 assert.ok(step);
 assert.match(step,/if: github\.event_name == 'pull_request'/);
 assert.match(step,/run: node scripts\/run-platform-doctor-strict\.mjs/);
 assert.doesNotMatch(step,/github\.head_ref|startsWith/);
});

test('tested course deployment still routes via the serialized guarded dispatcher',()=>{
 const workflow=read('deploy-google-course-worker.yml');
 assert.match(workflow,/Verify all five deployed worker image digests and runtime identities/);
 assert.match(workflow,/actions\/workflows\/dispatch-google-course-job\.yml\/dispatches/);
 assert.match(read('dispatch-google-course-job.yml'),/group: google-course-runtime-operations/);
});
