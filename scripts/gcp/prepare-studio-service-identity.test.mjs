import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareStudioIdentity,STUDIO_ACCOUNT} from './prepare-studio-service-identity.mjs';
const deployment='serviceAccount:elevate-github-deploy@elegant-racer-299721.iam.gserviceaccount.com';
function fixture(existing=true,valid=true){
 const calls=[];
 return {calls,run:args=>{
  calls.push(args);
  if(args.slice(0,3).join(' ')==='iam service-accounts list')return JSON.stringify(existing?[{email:STUDIO_ACCOUNT}]:[]);
  if(args.includes('get-iam-policy'))return JSON.stringify({bindings:valid?[{role:args[0]==='secrets'?'roles/secretmanager.secretAccessor':args[0]==='storage'?'roles/storage.objectUser':'roles/iam.serviceAccountUser',members:[args[0]==='iam'?deployment:'serviceAccount:'+STUDIO_ACCOUNT]}]:[]});
  return '';
 }};
}
test('Studio identity gets only its auth secret, auth bucket and deployer actAs binding',()=>{
 const f=fixture();const result=prepareStudioIdentity({run:f.run});
 assert.equal(result.bindingsVerified,true);assert.equal(result.applicationDeployed,false);assert.equal(result.sessionsMoved,false);
 assert.equal(f.calls.some(args=>args.includes('create')),false);
 const mutations=f.calls.filter(args=>args.includes('add-iam-policy-binding'));
 assert.equal(mutations.length,3);assert.ok(mutations.every(args=>args[0]!=='projects'));
 assert.equal(f.calls.some(args=>args[0]==='run'||args.includes('delete')||args.includes('update-traffic')),false);
});
test('missing dedicated identity is created once and invalid binding readback fails',()=>{
 const f=fixture(false);prepareStudioIdentity({run:f.run});assert.equal(f.calls.filter(args=>args.includes('create')).length,1);
 const bad=fixture(true,false);assert.throws(()=>prepareStudioIdentity({run:bad.run}),/READBACK_FAILED/);
});
test('IAM denial never falls back to Admin runtime identity',()=>{
 const calls=[];
 assert.throws(()=>prepareStudioIdentity({run:args=>{calls.push(args);throw Error('permission_denied');}}),/permission_denied/);
 assert.equal(calls.length,1);assert.equal(JSON.stringify(calls).includes('elevate-admin-runtime'),false);
});
