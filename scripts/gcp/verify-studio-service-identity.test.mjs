import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyStudioIdentity} from './verify-studio-service-identity.mjs';
const member='serviceAccount:elevate-studio-runtime@elegant-racer-299721.iam.gserviceaccount.com';
function fixture({attachment=true,secret=true,storage=true}={}){
 const calls=[];
 return {calls,run:args=>{calls.push(args);if(args[0]==='auth')return 'test-token';return JSON.stringify({bindings:[{role:args[0]==='secrets'?'roles/secretmanager.secretAccessor':'roles/storage.objectUser',members:(args[0]==='secrets'?secret:storage)?[member]:[]}]});},request:async(url,options)=>{assert.match(url,/elevate-studio-runtime%40/);assert.deepEqual(JSON.parse(options.body).permissions,['iam.serviceAccounts.actAs']);return new Response(JSON.stringify({permissions:attachment?['iam.serviceAccounts.actAs']:[]}));}};
}
test('owner-prepared identity is verified without new IAM grants or Admin fallback',async()=>{const f=fixture();const result=await verifyStudioIdentity(f);assert.equal(result.bindingsVerified,true);assert.equal(result.applicationDeployed,false);assert.ok(f.calls.every(a=>a[0]==='auth'||a.includes('get-iam-policy')));});
for(const [config,code] of [[{attachment:false},'ATTACHMENT_DENIED'],[{secret:false},'SECRET_BINDING_UNVERIFIED'],[{storage:false},'STORAGE_BINDING_UNVERIFIED']])test('missing boundary blocks acceptance: '+code,async()=>{await assert.rejects(verifyStudioIdentity(fixture(config)),new RegExp(code));});
