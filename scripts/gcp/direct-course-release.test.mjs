import test from 'node:test';import assert from 'node:assert/strict';
import {directJobTemplate,launchDirectRelease,knownObsoletePhotoExecution} from './direct-course-release.mjs';
const source={spec:{template:{spec:{taskCount:1,parallelism:1,template:{spec:{serviceAccountName:'existing-service',maxRetries:3,containers:[{image:'old',env:[{name:'SUPABASE_SERVICE_ROLE_KEY',valueFrom:{secretKeyRef:{name:'existing-secret',key:'latest'}}}],resources:{limits:{memory:'16Gi',cpu:'4'}},volumeMounts:[{name:'existing'}]}],volumes:[{name:'existing'}]}}}}}};
const imageSha='a'.repeat(40),imageDigest='sha256:'+'b'.repeat(64);
test('a direct execution in another region prevents overlapping course production',async()=>{
 const calls=[];
 const result=await launchDirectRelease({imageSha,region:'us-east1',executionRegions:['us-central1','us-east1'],inspect:()=>{throw Error('no capacity write permitted');},run:args=>{
  calls.push(args);
  if(args[0]==='artifacts')return imageDigest;
  if(args.includes('elevate-course-builder'))return JSON.stringify(source);
  if(args.includes('executions'))return args.includes('--region=us-central1')?JSON.stringify([{metadata:{name:'elevate-direct-course-release-existing'},status:{}}]):'[]';
  return 'existing';
 }});
 assert.equal(result.state,'already-running');assert.equal(calls.some(a=>a.includes('replace')||a.includes('execute')),false);
});
test('secondary-region launch retains the source identity and checks that regions exact capacity',async()=>{
 const calls=[];let saved;
 const result=await launchDirectRelease({imageSha,region:'us-east1',executionRegions:['us-central1','us-east1'],inspect:async({region,task})=>{assert.equal(region,'us-east1');assert.deepEqual(task.resources,undefined);assert.equal(task.serviceAccountName,'existing-service');return {fits:true};},run:(args,body)=>{
  calls.push(args);
  if(args[0]==='artifacts')return imageDigest;
  if(args.includes('elevate-course-builder')){assert.ok(args.includes('--region=us-central1'));return JSON.stringify(source);}
  if(args.includes('replace')){saved=JSON.parse(body);return '';}
  if(args.includes('describe')){if(saved&&args.includes('--format=json'))return JSON.stringify(saved);const e=Error('missing');e.code='not_found';throw e;}
  if(args.includes('execute'))return '';
  throw Error('unexpected command');
 }});
 assert.equal(result.region,'us-east1');assert.equal(calls.filter(a=>a.includes('execute')).length,1);
 assert.ok(calls.find(a=>a.includes('execute')).includes('--region=us-east1'));
});
test('direct job uses existing identity and connections with no automatic task retries',()=>{
 const result=directJobTemplate(source,{imageSha,imageDigest});const task=result.spec.template.spec.template.spec;
 assert.equal(task.maxRetries,0);assert.equal(task.serviceAccountName,'existing-service');
 assert.deepEqual(task.containers[0].env[0],source.spec.template.spec.template.spec.containers[0].env[0]);
 assert.deepEqual(task.containers[0].resources,{limits:{memory:'16Gi',cpu:'4'}});
 assert.deepEqual(task.containers[0].args,['--import=tsx','workers/direct-course-release.ts']);
 assert.equal(source.spec.template.spec.template.spec.containers[0].image,'old');assert.equal(result.spec.template.spec.taskCount,1);assert.equal(result.spec.template.spec.parallelism,1);
});
test('an active direct execution cannot be duplicated or have its configuration replaced',async()=>{
 const calls=[];const result=await launchDirectRelease({imageSha,inspect:()=>{throw Error('must preserve active execution');},run:args=>{
  calls.push(args);if(args[0]==='artifacts')return imageDigest;
  if(args.includes('executions'))return JSON.stringify([{status:{conditions:[{status:'Unknown'}]}}]);
  if(args.includes('elevate-course-builder'))return JSON.stringify(source);return 'existing';
 }});assert.equal(result.state,'already-running');assert.equal(calls.some(args=>args.includes('replace')||args.includes('execute')),false);
});
test('a mutable image tag cannot replace tested immutable image evidence',()=>{
 assert.throws(()=>directJobTemplate(source,{imageSha:'main',imageDigest}),/TESTED_IMAGE/);
});

import {googleFailureCode} from './runtime-config.mjs';
test('Cloud Run missing-job wording is distinguished from permissions and unknown errors',()=>{
 assert.equal(googleFailureCode('ERROR: (gcloud.run.jobs.describe) Cannot find job [elevate-direct-course-release].'),'not_found');
 assert.equal(googleFailureCode('PERMISSION_DENIED: Cannot find job [private].'),'permission_denied');
 assert.equal(googleFailureCode('Cannot find credential file'),'command_failed');
});

function admissionHarness(inspect) {
 const calls=[];let saved;
 return {calls,input:{imageSha,inspect,run:(args,body)=>{
  calls.push(args);
  if(args[0]==='artifacts')return imageDigest;
  if(args.includes('elevate-course-builder'))return JSON.stringify(source);
  if(args.includes('replace')){saved=JSON.parse(body);return '';}
  if(args.includes('describe')){
   if(saved)return JSON.stringify(saved);
   const error=Error('missing');error.code='not_found';throw error;
  }
  if(args.includes('execute'))return '';
  throw Error('unexpected command');
 }}};
}
test('a direct execution cannot replace configuration or start when web reservations exhaust capacity',async()=>{
 const harness=admissionHarness(async()=>({fits:false,required:{cpu:23000,memory:48*2**30},granted:{cpu:20000,memory:40*2**30}}));
 await assert.rejects(launchDirectRelease(harness.input),/DIRECT_RELEASE_REGIONAL_CAPACITY_UNAVAILABLE/);
 assert.equal(harness.calls.some(args=>args.includes('replace')||args.includes('execute')),false);
});
test('unavailable or ambiguous capacity fails closed before a direct execution is created',async()=>{
 for(const inspect of [async()=>{throw Error('quota unavailable');},async()=>({fits:'true'})]){
  const harness=admissionHarness(inspect);
  await assert.rejects(launchDirectRelease(harness.input));
  assert.equal(harness.calls.some(args=>args.includes('replace')||args.includes('execute')),false);
 }
});
test('admission budgets the exact immutable job allocation before any configuration write',async()=>{
 let inspected=false;
 const harness=admissionHarness(async({region,task,taskCount,run})=>{
  assert.equal(region,'us-central1');assert.equal(taskCount,1);assert.equal(run,harness.input.run);
  assert.deepEqual(task.containers[0].resources,source.spec.template.spec.template.spec.containers[0].resources);
  assert.match(task.containers[0].image,new RegExp(imageDigest+'$'));
  assert.equal(harness.calls.some(args=>args.includes('replace')||args.includes('execute')),false);
  inspected=true;return {fits:true};
 });
 const result=await launchDirectRelease(harness.input);
 assert.equal(inspected,true);assert.equal(result.state,'started');assert.equal(result.retries,0);
 assert.equal(harness.calls.filter(args=>args.includes('execute')).length,1);
 assert.equal(source.spec.template.spec.template.spec.containers[0].image,'old');
});

const obsolete={metadata:{name:'elevate-direct-course-release-mcf87'},status:{conditions:[{type:'Completed',status:'Unknown'}]},spec:{template:{spec:{containers:[{
 image:'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker@sha256:ef30b16e9cb3ea4e3517aab3ef6633db9d7dbf3aac56bb24489a10eb98194480',
 env:[{name:'DIRECT_RELEASE_SOURCE_SHA',value:'3ae82989396abe436d503a694c02f54396d80bb4'}],
}]}}}};
test('retirement requires the exact obsolete execution, source and immutable image',()=>{
 assert.equal(knownObsoletePhotoExecution(obsolete),true);
 for(const change of [x=>x.metadata.name+='-other',x=>x.spec.template.spec.containers[0].image='other',x=>x.spec.template.spec.containers[0].env[0].value='new-source',x=>x.status.completionTime='2026-10-30T10:00:00Z']){
  const x=structuredClone(obsolete);change(x);assert.equal(knownObsoletePhotoExecution(x),false);
 }
});
test('explicit obsolete-source replacement waits for terminal readback before one new launch',async()=>{
 const calls=[];let saved,cancelled=false;
 const result=await launchDirectRelease({imageSha,retireKnownTextCardExecution:true,inspect:async()=>({fits:true}),run:(args,body)=>{
  calls.push(args);
  if(args[0]==='artifacts')return imageDigest;
  if(args.includes('executions')){
   if(args.includes('list'))return JSON.stringify(cancelled?[]:[obsolete]);
   if(args.includes('describe'))return JSON.stringify(obsolete);
   if(args.includes('cancel')){cancelled=true;return '';}
  }
  if(args.includes('replace')){saved=JSON.parse(body);return '';}
  if(args.includes('elevate-course-builder'))return JSON.stringify(source);
  if(args.includes('describe'))return saved?JSON.stringify(saved):'existing';
  if(args.includes('execute'))return '';
  throw Error('unexpected command');
 }});
 assert.equal(result.state,'started');assert.equal(calls.filter(a=>a.includes('cancel')).length,1);
 assert.equal(calls.filter(a=>a.includes('execute')).length,1);
 assert.ok(calls.findIndex(a=>a.includes('cancel'))<calls.findIndex(a=>a.includes('replace')));
});
test('pending cancellation preserves no-overlap without replacing or launching',async()=>{
 const calls=[];
 const result=await launchDirectRelease({imageSha,retireKnownTextCardExecution:true,run:args=>{
  calls.push(args);
  if(args[0]==='artifacts')return imageDigest;
  if(args.includes('executions'))return args.includes('describe')?JSON.stringify(obsolete):args.includes('cancel')?'':JSON.stringify([obsolete]);
  if(args.includes('elevate-course-builder'))return JSON.stringify(source);
  return 'existing';
 }});
 assert.equal(result.state,'obsolete-source-cancelling');
 assert.equal(calls.some(a=>a.includes('replace')||a.includes('execute')),false);
});

test('direct image requests use supported global capacity while preserving other runtime settings',()=>{
 const original=structuredClone(source);
 original.spec.template.spec.template.spec.containers[0].env.push({name:'ULTIMATE_PHOTO_REGION',value:'us'});
 const result=directJobTemplate(original,{imageSha,imageDigest});
 const env=result.spec.template.spec.template.spec.containers[0].env;
 assert.deepEqual(env.filter(e=>e.name==='ULTIMATE_PHOTO_REGION'),[{name:'ULTIMATE_PHOTO_REGION',value:'global'}]);
 assert.equal(original.spec.template.spec.template.spec.containers[0].env.find(e=>e.name==='ULTIMATE_PHOTO_REGION').value,'us');
});
test('only the identified superseded photo image can be replaced with the audited newer image',()=>{
 const x=structuredClone(obsolete);x.metadata.name='elevate-direct-course-release-saved';
 x.spec.template.spec.containers[0].image='us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker@sha256:b131064b00050f336357b40ffaab88362d9d90932c8ebadb18cd75461a830bb8';
 x.spec.template.spec.containers[0].env[0].value='79dc886bd59385d2f42069fe22c216211d8f00b9';
 assert.equal(knownObsoletePhotoExecution(x),true);
 x.spec.template.spec.containers[0].env[0].value='80eb6455d0bfff9178306fcaedc9b88c84390e73';
 assert.equal(knownObsoletePhotoExecution(x),false);
 x.spec.template.spec.containers[0].image='us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker@sha256:85ac9b7f7b4bdd4760e8032fc03dc5922c26dc6449d4671582a8987c36873ca3';
 assert.equal(knownObsoletePhotoExecution(x),true);
 x.spec.template.spec.containers[0].env[0].value='a'.repeat(40);
 assert.equal(knownObsoletePhotoExecution(x),false);
});
