import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareAdminCpuConfiguration,prepareOwnedModelConfiguration,activatePrivateCpuModel,configureOwnedModelConsumers,OWNED_MODEL_CONSUMERS,REQUIRED_ADMIN_CPU_COMMIT} from './activate-owned-cpu-model.mjs';
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
 assert.match(f.writes.find(x=>x.args.includes('update')).args.find(x=>x.startsWith('--update-env-vars=')),/OWNED_MODEL_RUNTIME_CONFIG_PROVIDER=google-secret-manager/);
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

test('every consumer surface receives the same owned-model connection as admin',async()=>{
 const token='b'.repeat(32);
 const consumerConfig=component=>({version:1,component,runtimeEnvironment:{KEEP:'1'},volumes:[],runtimeFiles:{}});
 const identity=`elevate-${'x'}-runtime@elegant-racer-299721.iam.gserviceaccount.com`;
 const writes=[];
 const saved=new Map();
 const run=(args,input)=>{
  if(args[0]==='secrets'&&args.includes('access')){
   const name=args[args.indexOf('--secret')+1];
   if(name==='elevate-owned-llm-token')return token;
   if(saved.has(name))return saved.get(name);
   const component=name.replace(/^elevate-/,'').replace(/-runtime-config$/,'');
   return JSON.stringify(consumerConfig(component));
  }
  if(args[0]==='secrets'&&args.includes('add')){
   const name=args[3];
   saved.set(name,input);
   writes.push({args,input});
   return JSON.stringify({name:'projects/test/secrets/config/versions/9'});
  }
  if(args[0]==='secrets'&&args.includes('get-iam-policy'))return JSON.stringify({bindings:[{role:'roles/secretmanager.secretAccessor',members:['serviceAccount:'+identity]}]});
  if(args.includes('describe'))return JSON.stringify({spec:{template:{spec:{serviceAccountName:identity}}},status:{url:base,traffic:[{latestRevision:true,percent:100,revisionName:'elevate-x-migration-1'}]}});
  if(args.includes('update-traffic')||args.includes('update')||args.includes('add-iam-policy-binding')){writes.push({args});return '';}
  throw Error('Unexpected operation: '+args.slice(0,3).join(' '));
 };
 // prepareOwnedModelConfiguration keeps unrelated keys and sets the shared model
 const next=prepareOwnedModelConfiguration(consumerConfig('lms'),'lms',base,token);
 assert.equal(next.runtimeEnvironment.AI_PROVIDER,'elevate');
 assert.equal(next.runtimeEnvironment.ELEVATE_LLM_CPU_URL,base);
 assert.equal(next.runtimeEnvironment.KEEP,'1');
 const results=await configureOwnedModelConsumers({base,token,run});
 assert.deepEqual(results.map(r=>r.component),OWNED_MODEL_CONSUMERS);
 assert.ok(results.every(r=>r.configured));
 assert.ok(results.every(r=>r.trafficRouted));
 const updates=writes.filter(w=>w.args.includes('update')&&w.args.includes('run')&&!w.args.includes('update-traffic'));
 assert.equal(updates.length,OWNED_MODEL_CONSUMERS.length);
 const trafficMoves=writes.filter(w=>w.args.includes('update-traffic'));
 assert.equal(trafficMoves.length,OWNED_MODEL_CONSUMERS.length);
 assert.ok(trafficMoves.every(w=>w.args.includes('--to-latest')));
 for(const update of updates){
  const envVar=update.args.find(a=>a.startsWith('--update-env-vars='));
  assert.match(envVar,/AI_PROVIDER=elevate/);
  assert.match(envVar,/ELEVATE_LLM_CPU_URL=/);
  assert.ok(update.args.includes('--remove-env-vars=ELEVATE_LLM_SECRET,ELEVATE_LLM_CPU_SECRET'));
  assert.ok(update.args.some(a=>a.startsWith('--update-secrets=ELEVATE_LLM_SECRET=elevate-owned-llm-token:latest')));
 }
});

test('a consumer without a verified identity is reported, never silently misconfigured',async()=>{
 const token='c'.repeat(32);
 let saved=JSON.stringify({version:1,component:'store',runtimeEnvironment:{},volumes:[],runtimeFiles:{}});
 const run=(args,input)=>{
  if(args[0]==='secrets'&&args.includes('access'))return args.includes('elevate-owned-llm-token')?token:saved;
  if(args[0]==='secrets'&&args.includes('add')){saved=input;return JSON.stringify({name:'projects/test/secrets/config/versions/3'});}
  if(args.includes('describe'))return JSON.stringify({spec:{template:{spec:{serviceAccountName:'allUsers'}}}});
  throw Error('Unexpected operation');
 };
 const results=await configureOwnedModelConsumers({base,token,run,components:['store']});
 assert.equal(results.length,1);
 assert.equal(results[0].configured,false);
 assert.match(results[0].code,/CONSUMER_IDENTITY_UNVERIFIED/);
});
