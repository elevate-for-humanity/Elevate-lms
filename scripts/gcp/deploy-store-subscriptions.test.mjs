import test from 'node:test';
import assert from 'node:assert/strict';
import {billingDeploymentTarget,verifyBillingTarget,dispatcherSource,preflightBillingRollout} from './deploy-store-subscriptions.mjs';
const sha='a'.repeat(40);
function billingFixture({identity='elevate-billing-runtime@elegant-racer-299721.iam.gserviceaccount.com',activeOnRead=0}={}) {
 let reads=0;
 return args=>{
  assert.equal(args[0],'run');assert.equal(args[1],'jobs');
  if(args[2]==='describe')return JSON.stringify({spec:{template:{spec:{template:{spec:{serviceAccountName:identity}}}}}});
  assert.equal(args[2],'executions');assert.equal(args[3],'list');
  return JSON.stringify(++reads===activeOnRead?[{status:{}}]:[]);
 };
}
test('billing rollout checks scoped identity and reserves its bounded capacity',async()=>{
 let checked=false;
 const result=await preflightBillingRollout({run:billingFixture(),capacityCheck:async input=>{
  assert.equal(input.region,'us-central1');assert.equal(input.taskCount,1);
  assert.deepEqual(input.task.containers[0].resources.limits,{cpu:'1',memory:'512Mi'});
  checked=true;return {fits:true};
 }});
 assert.equal(checked,true);assert.equal(result.capacityVerified,true);
});
test('billing rollout refuses unknown identity or unavailable capacity',async()=>{
 await assert.rejects(preflightBillingRollout({run:billingFixture({identity:'admin'}),capacityCheck:()=>{throw Error('must not run');}}),/IDENTITY_UNVERIFIED/);
 await assert.rejects(preflightBillingRollout({run:billingFixture(),capacityCheck:async()=>({fits:false})}),/CAPACITY_UNAVAILABLE/);
});
for(const activeOnRead of [1,2])test('billing rollout refuses an execution appearing on read '+activeOnRead,async()=>{
 await assert.rejects(preflightBillingRollout({run:billingFixture({activeOnRead}),capacityCheck:async()=>({fits:true})}),/ALREADY_ACTIVE/);
});
test('Store deployment requires only Store identity and makes no Admin or Marketing requests',async()=>{
 const target=billingDeploymentTarget({BILLING_RUNTIME_COMPONENT:'store',GOOGLE_STORE_TOKEN:'store-identity'});
 const calls=[];
 await verifyBillingTarget(target,sha,async(url,init)=>{
  assert.equal(new URL(url).origin,target.url);assert.equal(init.redirect,'error');calls.push(url);
  return Response.json(url.endsWith('quickbooks')?{ready:true,connected:true,webhookVerifierConfigured:true}:{service:'store',commit:sha,ready:true,healthy:true,dependencies:{supabase:{ok:true}}});
 });
 assert.equal(calls.length,3);
 assert.ok(dispatcherSource().includes('BILLING_RUNTIME_COMPONENT'));
});
for(const defect of ['wrong_service','wrong_commit','unhealthy','missing_webhook'])test('billing release refuses '+defect,async()=>{
 const target=billingDeploymentTarget({BILLING_RUNTIME_COMPONENT:'store',GOOGLE_STORE_TOKEN:'store-identity'});
 await assert.rejects(verifyBillingTarget(target,sha,async(url)=>Response.json(url.endsWith('quickbooks')?{ready:true,connected:true,webhookVerifierConfigured:defect!=='missing_webhook'}:{service:defect==='wrong_service'?'admin':'store',commit:defect==='wrong_commit'?'b'.repeat(40):sha,ready:true,healthy:defect!=='unhealthy',dependencies:{supabase:{ok:true}}})),/BILLING_/);
});
test('unsupported billing destinations and missing scoped identity are refused',()=>{
 assert.throws(()=>billingDeploymentTarget({BILLING_RUNTIME_COMPONENT:'custom',GOOGLE_STORE_TOKEN:'identity'}),/COMPONENT_INVALID/);
 assert.throws(()=>billingDeploymentTarget({BILLING_RUNTIME_COMPONENT:'store',GOOGLE_ADMIN_TOKEN:'wrong-identity'}),/IDENTITY_REQUIRED/);
});
