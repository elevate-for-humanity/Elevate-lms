import test from 'node:test';
import assert from 'node:assert/strict';
import {preflightWebRollout} from './preflight-web-rollout.mjs';
const options=()=>({service:'elevate-store-migration',cpu:'4',memory:'8Gi',run:()=>JSON.stringify({status:{latestCreatedRevisionName:'serving',traffic:[{revisionName:'serving',percent:100}]}})});
test('replacement reserves one additional candidate without any mutation',async()=>{
 const calls=[];const o=options();const read=o.run;
 const result=await preflightWebRollout({...o,run:args=>{calls.push(args);return read();},inspect:async input=>{
  assert.deepEqual(input.task.containers[0].resources.limits,{cpu:'4',memory:'8Gi'});assert.equal(input.taskCount,1);return {fits:true};
 }});
 assert.equal(result.service,'elevate-store-migration');assert.equal(calls.length,2);
 assert.ok(calls.every(args=>args.slice(0,3).join(' ')==='run services describe'));
});
test('insufficient capacity and unreadable quota reject the rollout',async()=>{
 await assert.rejects(preflightWebRollout({...options(),inspect:async()=>({fits:false})}),/CAPACITY/);
 await assert.rejects(preflightWebRollout({...options(),inspect:async()=>{throw Error('quota unreadable');}}),/quota unreadable/);
});
test('a release during quota inspection invalidates the result',async()=>{
 let revision='before';
 await assert.rejects(preflightWebRollout({...options(),run:()=>JSON.stringify({status:{latestCreatedRevisionName:revision}}),inspect:async()=>{revision='after';return {fits:true};}}),/Concurrent/);
});
test('unapproved target or allocation fails before any Google read',async()=>{
 for(const changes of [{service:'another-app'},{cpu:'8'},{memory:'32Gi'}])await assert.rejects(preflightWebRollout({...options(),...changes,run:()=>{throw Error('must not read');}}),/required/);
});
