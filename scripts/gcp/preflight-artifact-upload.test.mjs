import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyArtifactUpload} from './preflight-artifact-upload.mjs';
const base='https://us-central1-docker.pkg.dev/v2/elegant-racer-299721/elevate/store/blobs/uploads/';
const run=()=> 'fixture-token';
test('proves empty upload admission and cancels only its own session without publishing an image',async()=>{
 const calls=[];
 const result=await verifyArtifactUpload({run,request:async(url,init)=>{
  calls.push({url,init});assert.equal(init.redirect,'error');assert.equal(init.headers.authorization,'Bearer fixture-token');
  if(init.method==='POST'){assert.equal(init.body,'');return new Response(null,{status:202,headers:{location:base+'session?_state=fixture'}});}
  assert.equal(url,base+'session?_state=fixture');assert.equal(init.method,'DELETE');return new Response(null,{status:204});
 }});
 assert.equal(calls.length,2);assert.equal(result.imagePublished,false);assert.equal(result.emptySessionCancelled,true);
});
test('billing rejection is classified without leaking the response and prevents cleanup or publication',async()=>{
 let calls=0;
 await assert.rejects(verifyArtifactUpload({run,request:async()=>{calls++;return new Response('This API method requires billing to be enabled. private detail',{status:403});}}),error=>error.message==='ARTIFACT_UPLOAD_BILLING_BLOCKED');
 assert.equal(calls,1);
});
for(const location of ['https://attacker.example/session',base.replace('/store/','/admin/')+'session',base+'../manifest',base])test('upload location cannot send credentials outside the exact session path: '+location,async()=>{
 let calls=0;
 await assert.rejects(verifyArtifactUpload({run,request:async()=>{calls++;return new Response(null,{status:202,headers:{location}});}}),/LOCATION_INVALID/);
 assert.equal(calls,1);
});
test('cleanup failure cannot be reported as a passing build preflight',async()=>{
 await assert.rejects(verifyArtifactUpload({run,request:async(_url,init)=>init.method==='POST'?new Response(null,{status:202,headers:{location:base+'session'}}):new Response(null,{status:403})}),/CLEANUP_UNVERIFIED_HTTP_403/);
});
