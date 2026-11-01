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
