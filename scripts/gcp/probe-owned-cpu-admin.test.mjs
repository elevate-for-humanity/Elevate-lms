import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {ADMIN_PROBE_SOURCE,adminProbeManifest,probeAdminModelInvocation} from './probe-owned-cpu-admin.mjs';
const base='https://elevate-owned-cpu-llm-test.run.app',identity='elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com',image='us-central1-docker.pkg.dev/elegant-racer-299721/elevate/admin@sha256:'+'a'.repeat(64),name='elevate-paris-probe-unit';
test('Admin proof uses one bounded finite task and only the existing scoped model secret',()=>{
 const manifest=adminProbeManifest({base,identity,image,name}),spec=manifest.spec.template.spec,task=spec.template.spec;
 assert.equal(spec.taskCount,1);assert.equal(spec.parallelism,1);assert.equal(task.maxRetries,0);assert.equal(task.timeoutSeconds,180);
 assert.deepEqual(task.containers[0].resources.limits,{cpu:'1',memory:'512Mi'});
 assert.deepEqual(task.containers[0].env.map(x=>x.name),['CPU_MODEL_URL','LLM_WORKER_SECRET']);assert.equal(task.serviceAccountName,identity);
 assert.ok(!JSON.stringify(manifest).includes('SUPABASE'));assert.throws(()=>adminProbeManifest({base:'https://foreign.test',identity,image,name}),/TARGET_UNVERIFIED/);
});
test('the real probe code reports catalog access without disclosing either credential',async()=>{
 for(const status of [200,403]) {
  const lines=[],process={env:{CPU_MODEL_URL:base,LLM_WORKER_SECRET:'fixture-model-secret'},exitCode:0};let calls=0;
  await runInNewContext('(async()=>{'+ADMIN_PROBE_SOURCE+'})()', {URL,AbortSignal,process,console:{log:x=>lines.push(x)},fetch:async(url,options)=>{
   calls++;if(String(url).startsWith('http://metadata.google.internal')){assert.equal(options.headers['Metadata-Flavor'],'Google');return new Response('fixture-identity');}
   assert.equal(options.headers.Authorization,'Bearer fixture-model-secret');assert.equal(options.headers['X-Serverless-Authorization'],'Bearer fixture-identity');return Response.json({data:[{id:'elevate-local'}]},{status});
  }});
  const result=JSON.parse(lines[0]);assert.equal(result.verified,status===200);assert.equal(result.httpStatus,status);assert.equal(calls,2);
  assert.ok(!lines[0].includes('fixture-'));assert.equal(process.exitCode,status===200?0:1);
 }
});
function fixture(verified=true,tamper=false) {
 let manifest;const calls=[];const run=args=>{
  calls.push(args);
  if(args.includes('replace')){manifest=JSON.parse(readFileSync(args[3],'utf8'));return '';}
  if(args.includes('execute')){if(!verified)throw Object.assign(Error('execution failed'),{code:'command_failed'});return '';}
  if(args.includes('executions')){const task=structuredClone(manifest.spec.template.spec.template.spec);if(tamper)task.serviceAccountName='other@elegant-racer-299721.iam.gserviceaccount.com';return JSON.stringify({spec:{template:{spec:task}},status:{conditions:[{type:'Completed',status:verified?'True':'False'}],succeededCount:verified?1:0}});}
  if(args.includes('describe'))return JSON.stringify({...manifest,status:{latestCreatedExecution:{name:name+'-run'}}});
  if(args.includes('logging'))return JSON.stringify([{jsonPayload:{probe:'owned-cpu-admin',verified,httpStatus:verified?200:403}}]);
  throw Error('Unexpected operation');
 };return {run,calls};
}
test('failed effective Admin invocation is recorded rather than inferred from an empty IAM policy',async()=>{
 const f=fixture(false);const result=await probeAdminModelInvocation({base,identity,image,name,run:f.run,capacity:async()=>({fits:true})});
 assert.equal(result.verified,false);assert.equal(result.discovery.httpStatus,403);assert.equal(result.permissionsChanged,false);
});
test('a successful execution under another identity is rejected',async()=>{
 const f=fixture(true,true);await assert.rejects(probeAdminModelInvocation({base,identity,image,name,run:f.run,capacity:async()=>({fits:true})}),/EXECUTION_IDENTITY_UNVERIFIED/);
});
test('insufficient regional capacity prevents job creation',async()=>{
 const f=fixture();await assert.rejects(probeAdminModelInvocation({base,identity,image,name,run:f.run,capacity:async()=>({fits:false})}),/CAPACITY_REQUIRED/);assert.equal(f.calls.length,0);
});
