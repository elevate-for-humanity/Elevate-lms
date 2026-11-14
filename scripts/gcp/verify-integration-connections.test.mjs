import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configurationEvidence, verifyIntegrationConnections } from './verify-integration-connections.mjs';
test('presence reports never expose values or combine partial calendar clients',()=>{
 const evidence=configurationEvidence({GOOGLE_CALENDAR_CLIENT_ID:'private-one',GOOGLE_CLIENT_SECRET:'private-two',LIVEKIT_API_SECRET:'private-three'});
 assert.equal(evidence.calendar.configuredInGoogleSnapshot,false);
 assert.equal(evidence.meetings.configuredInGoogleSnapshot,false);
 assert.equal(JSON.stringify(evidence).includes('private'),false);
});
test('HTTP 200 alone cannot certify providers or replace consent/device evidence',async()=>{
 const run=args=>args[0]==='secrets'?JSON.stringify({version:1,component:args[5].replace('elevate-','').replace('-runtime-config',''),runtimeEnvironment:{},runtimeFiles:{},volumes:[]}):JSON.stringify({});
 const report=await verifyIntegrationConnections({run,request:async()=>Response.json({service:'wrong',healthy:true,ready:true})});
 assert.equal(report.publicConnectionsPassed,false);
 assert.equal(report.endToEndCertified,false);
 assert.ok(report.probes.every(p=>p.passed===false));
 assert.equal(JSON.stringify(report).includes('runtimeEnvironment'),false);
});

test('authenticates meeting credentials with read-only ListRooms and never prints the JWT or room metadata', async () => {
 const {verifyMeetingProvider}=await import('./verify-integration-connections.mjs');
 const calls=[];
 const result=await verifyMeetingProvider({LIVEKIT_URL:'wss://fixture.livekit.cloud',LIVEKIT_API_KEY:'test-id',LIVEKIT_API_SECRET:'private-secret'},async(url,init)=>{
  calls.push({url,init});return Response.json({rooms:[{name:'private-room'}]});
 });
 assert.equal(result.authenticated,true);assert.equal(result.mediaDeliveryCertified,false);
 assert.equal(calls[0].url,'https://fixture.livekit.cloud/twirp/livekit.RoomService/ListRooms');
 assert.equal(calls[0].init.body,'{}');
 assert(!JSON.stringify(result).includes('private'));
 const payload=JSON.parse(Buffer.from(calls[0].init.headers.Authorization.split('.')[1],'base64url').toString());
 assert.deepEqual(payload.video,{roomList:true});
});
test('rejects invalid meeting credentials and unsafe credential destinations', async () => {
 const {verifyMeetingProvider}=await import('./verify-integration-connections.mjs');
 const env={LIVEKIT_URL:'wss://fixture.livekit.cloud',LIVEKIT_API_KEY:'key',LIVEKIT_API_SECRET:'secret'};
 assert.equal((await verifyMeetingProvider(env,async()=>Response.json({error:'unauthorized'},{status:401}))).authenticated,false);
 let called=false;
 assert.equal((await verifyMeetingProvider({...env,LIVEKIT_URL:'http://localhost'},async()=>{called=true;})).authenticated,false);
 assert.equal(called,false);
});

test('detects a runtime/database OAuth client mismatch without returning credentials',async()=>{
 const {verifyQuickBooksCredentialSources}=await import('./verify-integration-connections.mjs');
 const result=await verifyQuickBooksCredentialSources({SUPABASE_URL:'https://cuxzzpsyufcewtmicszk.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-service-key',QB_CLIENT_ID:'runtime-client',QB_CLIENT_SECRET:'runtime-secret'},async(url,init)=>{
  assert.equal(new URL(url).hostname,'cuxzzpsyufcewtmicszk.supabase.co');assert.equal(init.redirect,'error');
  return Response.json([{key:'QB_CLIENT_ID',value:'saved-client'},{key:'QB_CLIENT_SECRET',value:'saved-secret'},{key:'QB_REFRESH_TOKEN',value:'private-refresh',updated_at:'2026-09-22'}]);
 });
 assert.equal(result.staticCredentialAgreement.QB_CLIENT_ID.match,false);
 assert.equal(result.savedTokens[0].present,true);
 for(const value of ['private-service-key','runtime-secret','saved-secret','private-refresh'])assert(!JSON.stringify(result).includes(value));
});
