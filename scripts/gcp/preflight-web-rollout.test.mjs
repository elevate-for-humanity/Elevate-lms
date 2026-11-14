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
test('image-only releases reserve the existing allocation instead of assuming a profile',async()=>{
 const service={spec:{template:{spec:{containers:[{resources:{limits:{cpu:'4000m',memory:'8Gi'}}}]}}},status:{latestCreatedRevisionName:'serving',traffic:[]}};
 const result=await preflightWebRollout({service:'elevate-lms-migration',run:()=>JSON.stringify(service),inspect:async({task})=>{
  assert.deepEqual(task.containers[0].resources.limits,{cpu:'4',memory:'8Gi'});return {fits:true};
 }});
 assert.deepEqual(result.candidate,{cpu:'4',memory:'8Gi'});
});
test('image-only releases cannot proceed with an unreadable current allocation',async()=>{
 await assert.rejects(preflightWebRollout({service:'elevate-admin-migration',run:()=>JSON.stringify({}),inspect:async()=>{throw Error('must not inspect');}}),/allocation required/);
});

test('capacity rejection retains bounded allocation evidence without service secrets',async()=>{
 const capacity={region:'us-central1',required:{cpu:21000,memory:44*2**30},granted:{cpu:20000,memory:40*2**30},fits:false};
 const calls=[];
 await assert.rejects(preflightWebRollout({...options(),run:args=>{calls.push(args);return JSON.stringify({spec:{template:{spec:{containers:[{env:[{name:'PRIVATE_KEY',value:'fixture-secret'}]}]}}}});},inspect:async()=>capacity}),error=>{
  assert.equal(error.code,'WEB_ROLLOUT_REGIONAL_CAPACITY_UNAVAILABLE');
  assert.deepEqual(error.diagnostic,{service:'elevate-store-migration',region:'us-central1',candidate:{cpu:'4',memory:'8Gi'},capacity});
  assert.equal(JSON.stringify(error).includes('fixture-secret'),false);
  return true;
 });
 assert.equal(calls.length,1);
 assert.equal(calls[0].slice(0,3).join(' '),'run services describe');
});
