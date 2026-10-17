import test from 'node:test';
import assert from 'node:assert/strict';
import {billingDeploymentTarget,verifyBillingTarget,dispatcherSource} from './deploy-store-subscriptions.mjs';
const sha='a'.repeat(40);
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
