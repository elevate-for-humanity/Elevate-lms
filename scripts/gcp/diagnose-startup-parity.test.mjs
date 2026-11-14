import test from 'node:test';
import assert from 'node:assert/strict';
import { startupRevisionPair } from './diagnose-startup-parity.mjs';
const name='elevate-store-migration';
const state=()=>({status:{latestReadyRevisionName:name+'-failed-candidate',latestCreatedRevisionName:name+'-failed-candidate',traffic:[{revisionName:name+'-healthy',percent:100},{revisionName:name+'-failed-candidate',tag:'candidate'}]}});
test('startup comparison uses the actual serving revision when latest-ready is an unhealthy zero-traffic candidate',()=>{
 assert.deepEqual(startupRevisionPair(state(),name),{serving:name+'-healthy',created:name+'-failed-candidate'});
});
test('split or unresolved traffic cannot be represented as one known-good runtime',()=>{
 for(const traffic of [[],[{revisionName:name+'-healthy',percent:50}],[{revisionName:name+'-a',percent:50},{revisionName:name+'-b',percent:50}]]){
  const data=state();data.status.traffic=traffic;assert.throws(()=>startupRevisionPair(data,name),/fully serving revision/);
 }
});
test('revision identity must belong to the inspected service',()=>{
 const data=state();data.status.latestCreatedRevisionName='elevate-admin-migration-other';
 assert.throws(()=>startupRevisionPair(data,name),/Exact existing service revisions/);
});
