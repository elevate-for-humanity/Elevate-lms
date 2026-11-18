import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

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
  assert.ok(sweep.includes("['running','queued','building'].includes(build.data.status)"));
  assert.ok(sweep.includes('build.data.profile?.ownerPaused===true'));
  assert.ok(sweep.includes("courseDefectDisposition({source:job,latest:latest.data,build:build.data})!=='repair'"));
  assert.ok(sweep.indexOf('const build=')<sweep.indexOf('await enqueueParisRepair'), 'current-build eligibility must precede enqueue');
});
