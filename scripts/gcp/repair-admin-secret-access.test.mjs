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
