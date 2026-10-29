import test from 'node:test';
import assert from 'node:assert/strict';
import {repairOwnedCpuMemory,repeatCpuInference} from './repair-owned-cpu-memory.mjs';
import {CPU_CACHE_ENV} from './deploy-owned-cpu-model.mjs';

function fixture({tamper=false}={}) {
 const base='https://elevate-owned-cpu-llm-aabnh2y32a-ue.a.run.app';
 const old='elevate-owned-cpu-llm-old',next='elevate-owned-cpu-llm-new';
 const calls=[];let staged=false,serving=old;
 const task={serviceAccountName:'elevate-llm-runtime@elegant-racer-299721.iam.gserviceaccount.com',containerConcurrency:1,
  containers:[{image:'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/owned-cpu-llm@sha256:'+'a'.repeat(64),resources:{limits:{cpu:'4',memory:'8Gi'}},env:[{name:'LLM_WORKER_SECRET',valueFrom:{secretKeyRef:{name:'existing-secret',key:'latest'}}}]}]};
 const run=args=>{
  calls.push(args);
  if(args[0]==='secrets')return JSON.stringify({version:1,component:'admin',runtimeEnvironment:{ELEVATE_LLM_SECRET:'secret-'.repeat(8)},volumes:[],runtimeFiles:{}});
  if(args.includes('elevate-admin-migration'))return JSON.stringify({spec:{template:{spec:{serviceAccountName:'elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com'}}}});
  if(args.includes('get-iam-policy'))return JSON.stringify({bindings:[]});
  if(args[2]==='update'){staged=true;return '';}
  if(args[2]==='update-traffic'){serving=args.some(a=>a==='--to-revisions='+next+'=100')?next:old;return '';}
  if(args[1]==='revisions'){
   const spec=structuredClone(task);
   if(args[3]===next)spec.containers[0].env.push(...Object.entries(CPU_CACHE_ENV).map(([name,value])=>({name,value:tamper?'8192':value})));
   return JSON.stringify({spec});
  }
  if(args[2]==='describe')return JSON.stringify({spec:{template:{spec:task}},status:{url:base,latestCreatedRevisionName:staged?next:old,latestReadyRevisionName:staged?next:old,
   traffic:[{percent:100,revisionName:serving},...(staged?[{tag:'elevate-owned-cpu-llm-mem',revisionName:next,url:'https://elevate-owned-cpu-llm-mem---'+new URL(base).hostname}]:[])]}});
  throw Error('UNEXPECTED_OPERATION');
 };
 return {run,calls,base,old,next,capacity:async()=>({fits:true}),invokerToken:'fixture-identity',accept:async()=>({passed:true}),repeat:async()=>({passed:true,requests:8})};
}
test('isolated candidate keeps the immutable image, identity and limits and activates only after repeated inference',async()=>{
 const f=fixture();let accepted=false,repeated=false;
 const result=await repairOwnedCpuMemory({...f,accept:async({base})=>{if(!accepted){assert.match(base,/mem---/);assert.ok(!f.calls.some(c=>c[2]==='update-traffic'));}else assert.equal(base,f.base);accepted=true;return {passed:true};},repeat:async()=>{assert.ok(accepted);assert.ok(!f.calls.some(c=>c[2]==='update-traffic'));repeated=true;return {passed:true,requests:8};}});
 assert.ok(repeated);assert.equal(result.repaired,true);assert.equal(result.memory,'8Gi');assert.equal(result.permissionsChanged,false);
 assert.ok(f.calls.find(c=>c[2]==='update').includes('--no-traffic'));
 assert.ok(!f.calls.some(c=>c.includes('add-iam-policy-binding')||c.includes('deploy')));
});
test('failed acceptance preserves serving traffic',async()=>{
 for(const stage of ['accept','repeat']){
  const f=fixture();await assert.rejects(repairOwnedCpuMemory({...f,[stage]:async()=>({passed:false})}),/ACCEPTANCE_REQUIRED/);
  assert.ok(!f.calls.some(c=>c[2]==='update-traffic'));
 }
});
test('wrong cache readback and insufficient capacity block activation',async()=>{
 const tampered=fixture({tamper:true});await assert.rejects(repairOwnedCpuMemory(tampered),/CANDIDATE_READBACK_FAILED/);
 assert.ok(!tampered.calls.some(c=>c[2]==='update-traffic'));
 const full=fixture();await assert.rejects(repairOwnedCpuMemory({...full,capacity:async()=>({fits:false,region:'us-east1',required:{cpu:8000,memory:17179869184},granted:{cpu:4000,memory:8589934592}})}),error=>{
  assert.match(error.message,/CANDIDATE_CAPACITY_REQUIRED/);assert.equal(error.capacity.granted.memory,8589934592);return true;
 });
 assert.ok(!full.calls.some(c=>c[2]==='update'));
});
test('failed service-URL acceptance rolls traffic back to the original revision',async()=>{
 const f=fixture();let n=0;
 await assert.rejects(repairOwnedCpuMemory({...f,accept:async()=>({passed:++n===1})}),/LIVE_ACCEPTANCE_REQUIRED/);
 const changes=f.calls.filter(c=>c[2]==='update-traffic');assert.equal(changes.length,2);
 assert.ok(changes[1].includes('--to-revisions='+f.old+'=100'));
});
test('sustained proof performs eight different bounded requests and rejects wrong answers',async()=>{
 const prompts=[];const f=fixture();
 const result=await repeatCpuInference({base:f.base,token:'application-secret',invokerToken:'identity-secret',request:async(_url,options)=>{
  const body=JSON.parse(options.body);prompts.push(body.messages[1].content);assert.equal(body.max_tokens,16);
  assert.equal(options.headers['X-Serverless-Authorization'],'Bearer identity-secret');return Response.json({choices:[{message:{content:'4'}}]});
 }});
 assert.equal(result.requests,8);assert.equal(new Set(prompts).size,8);assert.ok(prompts.every(p=>p.length>4000));
 await assert.rejects(repeatCpuInference({base:f.base,request:async()=>Response.json({choices:[{message:{content:'wrong'}}]})}),/REPEATED_INFERENCE_FAILED/);
});
