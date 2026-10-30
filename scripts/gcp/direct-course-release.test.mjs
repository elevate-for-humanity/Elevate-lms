import test from 'node:test';import assert from 'node:assert/strict';
import {directJobTemplate,launchDirectRelease} from './direct-course-release.mjs';
const source={spec:{template:{spec:{taskCount:1,parallelism:1,template:{spec:{serviceAccountName:'existing-service',maxRetries:3,containers:[{image:'old',env:[{name:'SUPABASE_SERVICE_ROLE_KEY',valueFrom:{secretKeyRef:{name:'existing-secret',key:'latest'}}}],resources:{limits:{memory:'16Gi',cpu:'4'}},volumeMounts:[{name:'existing'}]}],volumes:[{name:'existing'}]}}}}}};
const imageSha='a'.repeat(40),imageDigest='sha256:'+'b'.repeat(64);
test('direct job uses existing identity and connections with no automatic task retries',()=>{
 const result=directJobTemplate(source,{imageSha,imageDigest});const task=result.spec.template.spec.template.spec;
 assert.equal(task.maxRetries,0);assert.equal(task.serviceAccountName,'existing-service');
 assert.deepEqual(task.containers[0].env[0],source.spec.template.spec.template.spec.containers[0].env[0]);
 assert.deepEqual(task.containers[0].resources,{limits:{memory:'16Gi',cpu:'4'}});
 assert.deepEqual(task.containers[0].args,['--import=tsx','workers/direct-course-release.ts']);
 assert.equal(source.spec.template.spec.template.spec.containers[0].image,'old');assert.equal(result.spec.template.spec.taskCount,1);assert.equal(result.spec.template.spec.parallelism,1);
});
test('an active direct execution cannot be duplicated or have its configuration replaced',()=>{
 const calls=[];const result=launchDirectRelease({imageSha,run:args=>{
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
