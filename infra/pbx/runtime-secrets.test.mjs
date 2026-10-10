import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRoleSecrets} from './runtime-secrets.mjs';
const root='projects/elegant-racer-299721/secrets/';
const environment={PARIS_TURN_TOKEN_SECRET:root+'elevate-paris-turn-token/versions/1',PARIS_ARI_PASSWORD_SECRET:root+'elevate-paris-ari-password/versions/1'};
test('turn role reads only its required secret using metadata identity',async()=>{
  const requests=[];const value='test-only-runtime-token'.repeat(2);
  const result=await loadRoleSecrets('turn',{environment,request:async(url,options)=>{
    requests.push({url,options});return {ok:true,json:async()=>url.includes('computeMetadata')?{access_token:'test-workload-token'}:{payload:{data:Buffer.from(value).toString('base64')}}};
  }});
  assert.deepEqual(result,{PARIS_TURN_TOKEN:value});assert.equal(requests.length,2);
  assert.equal(requests[0].options.headers['Metadata-Flavor'],'Google');
  assert.equal(requests[1].options.headers.Authorization,'Bearer test-workload-token');
  assert.equal(requests.some(x=>x.url.includes('ari-password')),false);
  assert.equal(requests.every(x=>x.options.redirect==='error'),true);
});
test('foreign secret project and unknown role fail before any network request',async()=>{
  let requests=0;const request=async()=>{requests++;};
  await assert.rejects(loadRoleSecrets('other',{environment,request}),/ROLE_INVALID/);
  await assert.rejects(loadRoleSecrets('turn',{environment:{...environment,PARIS_TURN_TOKEN_SECRET:'projects/other/secrets/key/versions/1'},request}),/REFERENCE_INVALID/);
  assert.equal(requests,0);
});
test('denied secret access never returns credential values or raw provider errors',async()=>{
  await assert.rejects(loadRoleSecrets('gateway',{environment,request:async url=>({ok:url.includes('computeMetadata'),json:async()=>({access_token:'test-token',error:{message:'private provider detail'}})})}),/^Error: PBX_SECRET_ACCESS_DENIED$/);
});
