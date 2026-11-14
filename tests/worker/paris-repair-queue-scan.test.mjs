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
