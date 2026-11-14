import test from 'node:test';import assert from 'node:assert/strict';
import {ownedModelHeaders} from './google-runtime-auth.mjs';
const jwt=claims=>'header.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.signature';
const env={ELEVATE_LLM_GOOGLE_IAM:'true'};
test('existing application-auth endpoints do not request Google identity',async()=>{
 const headers=await ownedModelHeaders('https://existing.example','application-token',{env:{},request:async()=>{throw Error('must not call');}});assert.equal(headers.Authorization,'Bearer application-token');assert.equal(headers['X-Serverless-Authorization'],undefined);
});
test('private invocation uses metadata identity without sending the application key to metadata',async()=>{
 const base='https://elevate-owned-cpu-llm-identity-test.a.run.app';let calls=0;
 const request=async(url,options)=>{calls++;assert.equal(url.hostname,'metadata.google.internal');assert.equal(url.searchParams.get('audience'),base);assert.equal(options.headers['Metadata-Flavor'],'Google');assert.equal(options.headers.Authorization,undefined);return new Response(jwt({aud:base,iss:'https://accounts.google.com',exp:Math.floor(Date.now()/1000)+3600}));};
 const first=await ownedModelHeaders(base,'application-token',{env,request});const next=await ownedModelHeaders(base,'rotated-application-token',{env,request});assert.equal(calls,1);assert.match(first['X-Serverless-Authorization'],/^Bearer /);assert.equal(next.Authorization,'Bearer rotated-application-token');
});
test('identity failure and unapproved targets cannot fall back to public application-only requests',async()=>{
 await assert.rejects(ownedModelHeaders('https://example.com','token',{env}),/IDENTITY_UNAVAILABLE/);
 for(const [suffix,response] of [['rejected',new Response(null,{status:403})],['malformed',new Response('invalid')],['foreign',new Response(jwt({aud:'other',iss:'https://accounts.google.com',exp:9999999999}))]])await assert.rejects(ownedModelHeaders('https://elevate-owned-cpu-llm-'+suffix+'.a.run.app','token',{env,request:async()=>response}),/IDENTITY_UNAVAILABLE/);
});
test('caller cancellation prevents a metadata request',async()=>{
 const c=new AbortController();c.abort(new Error('CALLER_CANCELLED'));let called=false;await assert.rejects(ownedModelHeaders('https://elevate-owned-cpu-llm-cancel.a.run.app','token',{env,signal:c.signal,request:async()=>{called=true;}}),/CALLER_CANCELLED/);assert.equal(called,false);
});
