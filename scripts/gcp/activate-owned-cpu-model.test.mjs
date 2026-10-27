import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareAdminCpuConfiguration,activatePrivateCpuModel,REQUIRED_ADMIN_CPU_COMMIT} from './activate-owned-cpu-model.mjs';
const config={version:1,component:'admin',runtimeEnvironment:{ELEVATE_LLM_URL:'https://retired.code.run',ELEVATE_LLM_SECRET:'a'.repeat(32),UNRELATED:'keep'},volumes:[],runtimeFiles:{}};
const base='https://elevate-owned-cpu-llm-123.run.app';
test('updates both endpoint aliases and paired credentials without mutating the source or unrelated settings',()=>{
 const next=prepareAdminCpuConfiguration(config,base,'a'.repeat(32));
 assert.equal(next.runtimeEnvironment.ELEVATE_LLM_URL,base);assert.equal(next.runtimeEnvironment.ELEVATE_LLM_CPU_URL,base);
 assert.equal(next.runtimeEnvironment.ELEVATE_LLM_GOOGLE_IAM,'true');assert.equal(next.runtimeEnvironment.AI_PROVIDER,'elevate');
 assert.equal(next.runtimeEnvironment.ELEVATE_LLM_CONTEXT_TOKENS,'8192');
 assert.equal(next.runtimeEnvironment.PARIS_GPU_ENABLED,'false');assert.equal(next.runtimeEnvironment.UNRELATED,'keep');
 assert.equal(config.runtimeEnvironment.ELEVATE_LLM_URL,'https://retired.code.run');
 assert.throws(()=>prepareAdminCpuConfiguration(config,'https://retired.code.run','a'.repeat(32)),/ENDPOINT_UNVERIFIED/);
});

function fixture() {
 let saved=structuredClone(config),staged=false;const writes=[];
 const adminIdentity='elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com';
 const deployIdentity='elevate-github-deploy@elegant-racer-299721.iam.gserviceaccount.com';
 const run=(args,input)=>{
  if(args.includes('describe')&&args.includes('elevate-owned-cpu-llm'))return JSON.stringify({status:{url:base}});
  if(args.includes('get-iam-policy'))return JSON.stringify({bindings:[{role:'roles/run.invoker',members:[adminIdentity,deployIdentity].map(x=>'serviceAccount:'+x)}]});
  if(args[0]==='secrets') {
   if(args.includes('add')){writes.push({args,input});saved=JSON.parse(input);return JSON.stringify({name:'projects/test/secrets/config/versions/12'});}
   if(args.includes('list'))return 'projects/test/secrets/config/versions/11';
   return JSON.stringify(saved);
  }
  if(args.includes('update')){writes.push({args});staged=true;return '';}
  if(args.includes('describe'))return JSON.stringify({spec:{template:{spec:{serviceAccountName:adminIdentity}}},status:{url:'https://admin-test.run.app',latestCreatedRevisionName:staged?'elevate-admin-migration-candidate':'elevate-admin-migration-prior',traffic:[{revisionName:'elevate-admin-migration-prior',percent:100}]}});
  throw Error('Unexpected operation');
 };
 return {run,writes,current:()=>saved};
}
const request=async()=>Response.json({healthy:true,service:'admin',commit:REQUIRED_ADMIN_CPU_COMMIT});
test('failed real-model acceptance leaves both runtime configuration and serving revision untouched',async()=>{
 const f=fixture();await assert.rejects(activatePrivateCpuModel({base,invokerToken:'test-identity',run:f.run,request,probeAdmin:async()=>({verified:true}),accept:async()=>({passed:false})}),/REAL_MODEL_ACCEPTANCE_REQUIRED/);
 assert.equal(f.writes.length,0);assert.deepEqual(f.current(),config);
});
test('only accepted inference can update aliases and activate the existing verified Admin image',async()=>{
 const f=fixture();let verifiedCommit;
 const result=await activatePrivateCpuModel({base,invokerToken:'test-identity',run:f.run,request,probeAdmin:async()=>({verified:true}),accept:async()=>({passed:true}),activate:async input=>{verifiedCommit=input.commit;return {traffic:100};}});
 assert.equal(result.productionTrafficChanged,true);assert.equal(verifiedCommit,REQUIRED_ADMIN_CPU_COMMIT);
 assert.equal(f.current().runtimeEnvironment.ELEVATE_LLM_CPU_URL,base);
 assert.ok(f.writes.find(x=>x.args.includes('update')).args.includes('--no-traffic'));
 assert.match(f.writes.find(x=>x.args.includes('update')).args.find(x=>x.startsWith('--update-env-vars=')),/ELEVATE_LLM_CONTEXT_TOKENS=8192/);
 assert.ok(f.writes.every(x=>!JSON.stringify(x.args).includes('a'.repeat(32))));
});

test('rejects a serving Admin image that predates the compact private prompt and owned-only retrieval',async()=>{
 const f=fixture();
 const oldRequest=async url=>String(url).includes('api.github.com')?Response.json({status:'behind'}):Response.json({healthy:true,service:'admin',commit:'4e79ac553bf2c698167655bcbc9c287b38d82cb4'});
 await assert.rejects(activatePrivateCpuModel({base,invokerToken:'test-identity',run:f.run,request:oldRequest,accept:async()=>({passed:true}),probeAdmin:async()=>({verified:true})}),/PRIVATE_TRANSPORT_ADAPTER_NOT_LIVE/);
 assert.equal(f.writes.length,0);
});
test('candidate validation failure restores the previous configuration instead of leaving a partial endpoint cutover',async()=>{
 const f=fixture();await assert.rejects(activatePrivateCpuModel({base,invokerToken:'test-identity',run:f.run,request,probeAdmin:async()=>({verified:true}),accept:async()=>({passed:true}),activate:async()=>{throw Error('candidate health failed');}}),/candidate health failed/);
 assert.deepEqual(f.current(),config);assert.equal(f.writes.filter(x=>x.args.includes('add')).length,2);
});

test('actual Admin invocation failure prevents endpoint writes even when the deployment identity can invoke',async()=>{
 const f=fixture();
 await assert.rejects(activatePrivateCpuModel({base,invokerToken:'test-identity',run:f.run,request,accept:async()=>({passed:true}),probeAdmin:async()=>({verified:false,discovery:{httpStatus:403}})}),/ADMIN_INVOCATION_REQUIRED/);
 assert.equal(f.writes.length,0);assert.deepEqual(f.current(),config);
});
test('effective inherited access can pass without adding redundant service-level grants',async()=>{
 const f=fixture();const run=(args,input)=>args.includes('get-iam-policy')?JSON.stringify({bindings:[]}):f.run(args,input);
 const result=await activatePrivateCpuModel({base,invokerToken:'test-identity',run,request,accept:async()=>({passed:true}),probeAdmin:async()=>({verified:true,execution:'probe-success'}),activate:async()=>({traffic:100})});
 assert.equal(result.productionTrafficChanged,true);assert.equal(result.adminInvocation.verified,true);
 assert.ok(f.writes.every(x=>!x.args.includes('add-iam-policy-binding')));
});
