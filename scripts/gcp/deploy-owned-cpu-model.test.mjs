import test from 'node:test';
import assert from 'node:assert/strict';
import {privateCpuDeploymentArguments,reviewPrivateModelPolicy,preflightPrivateCpuRelease} from './deploy-owned-cpu-model.mjs';
const admin='elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com';
test('CPU release is immutable, bounded, keeps one warm instance and never enables public access or GPUs',()=>{
 const args=privateCpuDeploymentArguments('sha256:'+'a'.repeat(64));
 for(const pair of [['--region','us-east1'],['--cpu','8'],['--memory','16Gi'],['--concurrency','2'],['--max-instances','3'],['--min','1'],['--min-instances','1']])assert.equal(args[args.indexOf(pair[0])+1],pair[1]);
 assert.ok(!args.some(arg=>/allow-unauthenticated|invoker-iam|--gpu|allUsers/.test(arg)));
 assert.ok(args.includes('--cpu-boost'));
 assert.ok(!args.includes('--no-cpu-boost'));
 assert.ok(args.includes('--update-env-vars=LLAMA_ARG_CACHE_RAM=0,LLAMA_ARG_CTX_CHECKPOINTS=0'));
 assert.throws(()=>privateCpuDeploymentArguments('latest'),/IMMUTABLE_IMAGE/);
});
test('reports explicit service bindings without confusing them with effective IAM access',()=>{
 const required=reviewPrivateModelPolicy({bindings:[]},admin).requiredInvokers;
 assert.equal(required.length,2);
 assert.deepEqual(reviewPrivateModelPolicy({bindings:[{role:'roles/run.invoker',members:required.map(x=>'serviceAccount:'+x)}]},admin).principalsWithoutServiceBinding,[]);
 for(const member of ['allUsers','allAuthenticatedUsers'])assert.throws(()=>reviewPrivateModelPolicy({bindings:[{role:'roles/run.invoker',members:[member]}]},admin),/PUBLIC_ACCESS/);
});
test('missing existing model identity blocks before compute, configuration or IAM mutations',async()=>{
 const calls=[];
 const run=(args)=>{calls.push(args);if(args.includes('elevate-admin-runtime-config'))return JSON.stringify({version:1,component:'admin',runtimeEnvironment:{ELEVATE_LLM_SECRET:'a'.repeat(32)},volumes:[],runtimeFiles:{}});throw Object.assign(Error('blocked'),{code:'not_found'});};
 await assert.rejects(preflightPrivateCpuRelease({run}));
 assert.ok(calls.every(args=>!args.some(x=>['deploy','update','add','create','add-iam-policy-binding'].includes(x))));
});

test('preflight budgets the complete new model envelope without dropping the old serving bound',async()=>{
 const model='elevate-llm-runtime@elegant-racer-299721.iam.gserviceaccount.com';
 const fixture='a'.repeat(32);
 const calls=[];
 const run=args=>{
   calls.push(args);
   if(args.includes('elevate-admin-runtime-config'))return JSON.stringify({version:1,component:'admin',runtimeEnvironment:{ELEVATE_LLM_SECRET:fixture},volumes:[],runtimeFiles:{}});
   if(args[0]==='iam')return model;
   if(args[0]==='secrets'&&args[1]==='get-iam-policy')return JSON.stringify({bindings:[{role:'roles/secretmanager.secretAccessor',members:['serviceAccount:'+model,'serviceAccount:'+admin]}]});
   if(args[0]==='run'&&args[1]==='services')return JSON.stringify({spec:{template:{spec:{serviceAccountName:admin}}}});
   if(args[0]==='secrets'&&args[1]==='versions')return fixture;
   throw Error('Unexpected command');
 };
 const capacity=({region,task,taskCount})=>{
   assert.equal(region,'us-east1');
   assert.equal(taskCount,3);
   assert.deepEqual(task.containers,[{resources:{limits:{cpu:'8',memory:'16Gi'}}}]);
   // Old 2 x 4 CPU / 8 GiB plus all 3 new slots: 32 CPU / 64 GiB.
   const required={cpu:8000+8000*taskCount,memory:(16+16*taskCount)*2**30};
   const granted={cpu:20000,memory:40*2**30};
   return {required,granted,fits:required.cpu<=granted.cpu&&required.memory<=granted.memory};
 };
 await assert.rejects(preflightPrivateCpuRelease({run,capacity}),/REGIONAL_CAPACITY_REQUIRED/);
 const accepted=await preflightPrivateCpuRelease({run,capacity:args=>({...capacity(args),granted:{cpu:32000,memory:64*2**30},fits:true})});
 assert.equal(accepted.capacity.required.cpu,32000);
 assert.equal(accepted.capacity.required.memory,64*2**30);
 assert.ok(calls.every(args=>!args.some(x=>['deploy','update','add','create','add-iam-policy-binding'].includes(x))));
});
