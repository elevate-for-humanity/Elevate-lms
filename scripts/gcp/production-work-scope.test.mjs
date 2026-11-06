import test from 'node:test';
import assert from 'node:assert/strict';
import {productionWorkScope} from './production-work-scope.mjs';

const row=(pause,status='queued')=>({status,build:{status:'running',owner_paused:pause}});

test('production readiness requires explicit unpaused evidence',()=>{
 const rows=[row(true),row('true'),row(null),row(undefined),row(false),row('false')];
 const result=productionWorkScope(rows);
 assert.equal(result.counts.queued,6);
 assert.equal(result.paused.length,2);
 assert.equal(result.unknownPause.length,2);
 assert.equal(result.eligible.length,2);
 assert.equal(result.actionableQueued.length,2);
});

test('published and archived parents remain ineligible',()=>{
 const rows=[{status:'failed',build:{status:'published',owner_paused:false}},
  {status:'queued',build:{status:'archived',owner_paused:'false'}}];
 const result=productionWorkScope(rows);
 assert.equal(result.eligible.length,0);
});
