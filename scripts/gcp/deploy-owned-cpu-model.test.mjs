import test from 'node:test';
import assert from 'node:assert/strict';
import {privateCpuDeploymentArguments,reviewPrivateModelPolicy,preflightPrivateCpuRelease} from './deploy-owned-cpu-model.mjs';
const admin='elevate-admin-runtime@elegant-racer-299721.iam.gserviceaccount.com';
test('CPU release is immutable, bounded, scale-to-zero and never enables public access or GPUs',()=>{
 const args=privateCpuDeploymentArguments('sha256:'+'a'.repeat(64));
 for(const pair of [['--region','us-east1'],['--cpu','4'],['--memory','8Gi'],['--concurrency','1'],['--max-instances','1'],['--min-instances','0']])assert.equal(args[args.indexOf(pair[0])+1],pair[1]);
 assert.ok(!args.some(arg=>/allow-unauthenticated|invoker-iam|--gpu|allUsers/.test(arg)));
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
