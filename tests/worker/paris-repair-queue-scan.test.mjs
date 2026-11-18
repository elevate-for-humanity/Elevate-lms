import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {courseDefectDisposition} from '../../lib/ai/runtime/code-repair-policy.mjs';

const source=readFileSync(new URL('../../lib/ai/runtime/code-repair.ts',import.meta.url),'utf8');

test('PARIS dispatch scans beyond the first 100 queued repairs',()=>{
  assert.match(source,/\.eq\('status','queued'\)\.order\('created_at',\{ascending:true\}\)\.limit\(1000\)/);
  assert.match(source,/queued\.data\?\.length===1000\)throw Error\('PARIS_QUEUED_REPAIR_SCAN_LIMIT'\)/);
  assert.match(source,/for\(const candidate of queued\.data\?\?\[\]\)/);
});

test('PARIS retains guarded dispatch and source-job eligibility',()=>{
  assert.match(source,/canDispatchParisRepairAttempt\(candidate\)/);
  assert.match(source,/courseDefectDisposition\(\{source:source\.data,latest:latest\.data,build:build\.data\}\)/);
  assert.match(source,/\.eq\('status','queued'\)\.eq\('attempt_count',pending\.attempt_count\)/);
});

test('PARIS does not enqueue failed sources belonging to archived or superseded builds',()=>{
  const sweep=source.slice(source.indexOf('const failedPageSize=20;'),source.indexOf('for(const event of eligibleRepairEvents'));
  assert.ok(sweep.includes("from('ultimate_course_builds')"));
  assert.ok(sweep.includes("['running','queued','building','blocked'].includes(build.data.status)"));
  assert.ok(sweep.includes('build.data.profile?.ownerPaused===true'));
  assert.ok(sweep.includes("courseDefectDisposition({source:job,latest:latest.data,build:build.data})!=='repair'"));
  assert.ok(sweep.indexOf('const build=')<sweep.indexOf('await enqueueParisRepair'), 'current-build eligibility must precede enqueue');
});


test('current blocked builds keep failed monitored sources discoverable without reopening superseded or paused work',()=>{
  const source={id:'failed-job',build_id:'current-build',status:'failed',last_error:'ULTIMATE_VIDEO_RENDER_FAILED:PICTURE_CUE_NOT_ALIGNED_TO_SPEECH'};
  const latest={id:'failed-job',build_id:'current-build',status:'failed'};
  const build={id:'current-build',status:'blocked',profile:{ownerPaused:false}};
  assert.equal(courseDefectDisposition({source,latest,build}),'repair');
  assert.equal(courseDefectDisposition({source,latest,build:{...build,status:'archived'}}),'blocked');
  assert.equal(courseDefectDisposition({source,latest,build:{...build,status:'published'}}),'blocked');
  assert.equal(courseDefectDisposition({source,latest,build:{...build,profile:{ownerPaused:true}}}),'blocked');
  const recovery=readFileSync(new URL('../../lib/ai/runtime/code-repair.ts',import.meta.url),'utf8');
  assert.ok(recovery.slice(0,recovery.indexOf('const failedPageSize=20;')).includes("['running','queued','building','blocked'].includes(build.data.status)"));
});
