import test from 'node:test';
import assert from 'node:assert/strict';
import {addReader,repairAdminSecretAccess} from './repair-admin-secret-access.mjs';
test('reader update preserves conditional bindings and concurrency etag',()=>{
 const p={etag:'etag',bindings:[{role:'roles/secretmanager.secretAccessor',members:['existing'],condition:{expression:'false'}}]};
 const next=addReader(p,'runtime');assert.equal(next.etag,'etag');assert.equal(next.bindings.length,2);assert.deepEqual(p.bindings[0].members,['existing']);
 assert.equal(addReader(next,'runtime'),null);assert.throws(()=>addReader({},'x'),/ETAG/);
});
test('denied IAM cannot mutate or report access true and does not leak error data',async()=>{
 const calls=[];const r=await repairAdminSecretAccess({token:'fixture',apply:true,request:async(url,options)=>{calls.push(url);return {ok:false,status:403,json:async()=>({error:{status:'PERMISSION_DENIED',message:'secret-fixture',details:[{'@type':'type.googleapis.com/google.rpc.ErrorInfo',reason:'IAM_PERMISSION_DENIED',metadata:{permission:'secretmanager.versions.access',private:'secret-fixture'}}]}})};}});
 assert.equal(r.allAccessible,false);assert.ok(!calls.some(x=>x.endsWith(':setIamPolicy')));assert.ok(!JSON.stringify(r).includes('secret-fixture'));assert.equal(r.results[0].access.reason,'IAM_PERMISSION_DENIED');
});
test('billing failure leaves IAM permissions unknown, rather than falsely missing',async()=>{
 const r=await repairAdminSecretAccess({token:'fixture',apply:true,request:async()=>({ok:false,status:403,json:async()=>({error:{status:'PERMISSION_DENIED',details:[{'@type':'type.googleapis.com/google.rpc.ErrorInfo',reason:'BILLING_DISABLED'}]}})})});
 assert.equal(r.results[0].permissions['secretmanager.versions.access'],null);
 assert.equal(r.results[0].permissionsAfter['secretmanager.versions.access'],null);
 assert.equal(r.results[0].access.reason,'BILLING_DISABLED');assert.equal(r.allAccessible,false);
});
test('scoped repair uses conditional-safe GET and etag-preserving writes without payload exposure',async()=>{
 const calls=[];const r=await repairAdminSecretAccess({token:'fixture',apply:true,request:async(url,options)=>{
  calls.push({url,options});let body={};
  if(url.endsWith('/billingInfo'))body={billingEnabled:true,billingAccountName:'private-account'};
  else if(url.endsWith(':testIamPermissions'))body={permissions:['secretmanager.secrets.getIamPolicy','secretmanager.secrets.setIamPolicy','secretmanager.versions.access']};
  else if(url.includes(':getIamPolicy')){assert.equal(options.method,'GET');body={etag:'concurrency-fixture',bindings:[]};}
  else if(url.endsWith(':setIamPolicy')){assert.equal(JSON.parse(options.body).policy.etag,'concurrency-fixture');}
  else if(url.endsWith(':access'))body={payload:{data:'private-payload'}};
  return {ok:true,status:200,json:async()=>body};
 }});
 assert.equal(r.allAccessible,true);assert.equal(r.billing.billingEnabled,true);
 assert.equal(calls.filter(x=>x.url.endsWith(':setIamPolicy')).length,4);
 assert.ok(!JSON.stringify(r).includes('private-payload'));assert.ok(!JSON.stringify(r).includes('private-account'));
 assert.ok(calls.every(x=>!x.url.includes('/projects/-')&&!x.url.includes('/projects/elegant-racer-299721:setIamPolicy')));
});
