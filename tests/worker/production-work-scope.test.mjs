import test from 'node:test';
import assert from 'node:assert/strict';
import {productionWorkScope} from '../../scripts/gcp/production-work-scope.mjs';
const make=(status,buildStatus='running',owner_paused='false')=>({
 id:crypto.randomUUID(),status,monitor:{enabled:true},build:{status:buildStatus,owner_paused},
});
test('owner holds and historical failures remain raw evidence, not runnable backlog',()=>{
 const rows=[make('completed'),make('failed'),make('queued'),make('running'),
  ...Array.from({length:41},()=>make('queued','running','true')),
  make('failed','archived'),make('failed','published'),make('failed','blocked','true')];
 const result=productionWorkScope(rows);
 assert.deepEqual(result.counts,{completed:1,failed:4,queued:42,running:1});
 assert.equal(result.paused.length,42);
 assert.equal(result.actionableFailed.length,1);
 assert.equal(result.actionableQueued.length,1);
 assert.equal(result.actionableRunning.length,1);
});
test('unpaused blocked builds remain actionable, including jobs waiting on a repair',()=>{
 const result=productionWorkScope([make('failed','blocked',null),make('queued','blocked',null)]);
 assert.equal(result.actionableFailed.length,1);
 assert.equal(result.actionableQueued.length,1);
});
test('missing build association cannot silently certify the production gate',()=>{
 assert.throws(()=>productionWorkScope([{id:'orphan',status:'failed'}]),/PRODUCTION_BUILD_SCOPE_EVIDENCE_REQUIRED/);
 assert.throws(()=>productionWorkScope([{status:'mystery',build:{status:'running'}}]),/PRODUCTION_BUILD_SCOPE_EVIDENCE_REQUIRED/);
});
test('acceptance inventory uses an embedded pause flag without reading sensitive profiles',async()=>{
 const {readFileSync}=await import('node:fs');
 const source=readFileSync(new URL('../../scripts/gcp/final-production-acceptance.mjs',import.meta.url),'utf8');
 assert.ok(source.includes('build:ultimate_course_builds!inner(status,owner_paused:profile->>ownerPaused)'));
 assert.ok(source.includes('productionWorkScope(jobs.rows)'));
});
