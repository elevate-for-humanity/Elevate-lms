import test from 'node:test';
import assert from 'node:assert/strict';
import {reduceModelIdle} from './reduce-model-idle.mjs';
function state(min='1') {return {metadata:{name:'elevate-owned-cpu-llm',annotations:{'run.googleapis.com/minScale':min}},spec:{template:{metadata:{annotations:{}},spec:{containers:[{image:'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/owned-cpu-llm@sha256:'+'a'.repeat(64),resources:{limits:{cpu:'4',memory:'8Gi'}}}]}}},status:{url:'https://elevate-owned-cpu-llm-test.run.app',latestReadyRevisionName:'model-1',latestCreatedRevisionName:'model-1',traffic:[{revisionName:'model-1',percent:100}],conditions:[{type:'Ready',status:'True'}]}};}
test('removes service-only model reservation after real acceptance without changing revision or image',async()=>{
 let current=state(),calls=0;const result=await reduceModelIdle({read:()=>structuredClone(current),update:min=>{current.metadata.annotations['run.googleapis.com/minScale']=min;},accept:async()=>{calls++;return {passed:true};}});
 assert.equal(calls,2);assert.equal(result.removedReservedMemoryGiB,8);assert.equal(result.imageUnchanged,true);assert.equal(current.status.latestReadyRevisionName,'model-1');
});
test('unproven inference or unexpected image never changes model capacity',async()=>{
 await assert.rejects(reduceModelIdle({read:()=>state(),update:()=>assert.fail(),accept:async()=>({passed:false})}),/FUNCTIONAL_ACCEPTANCE_REQUIRED/);
 const wrong=state();wrong.spec.template.spec.containers[0].image='unverified';
 await assert.rejects(reduceModelIdle({read:()=>wrong,update:()=>assert.fail(),accept:()=>assert.fail()}),/TOPOLOGY_UNVERIFIED/);
});
test('failed post-change inference restores the original reservation and verifies rollback',async()=>{
 let current=state(),calls=0;const updates=[];
 await assert.rejects(reduceModelIdle({read:()=>structuredClone(current),update:min=>{updates.push(min);current.metadata.annotations['run.googleapis.com/minScale']=min;},accept:async()=>({passed:++calls===1})}),/CHANGE_ROLLED_BACK/);
 assert.deepEqual(updates,['0','1']);
});
