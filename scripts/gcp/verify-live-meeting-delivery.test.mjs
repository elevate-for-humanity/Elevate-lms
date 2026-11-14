import {test} from 'node:test';
import assert from 'node:assert/strict';
import {meetingEndpoint,verifyLiveMeetingDelivery} from './verify-live-meeting-delivery.mjs';
test('meeting credential destinations are limited to secure provider roots',()=>{
 assert.equal(meetingEndpoint('https://fixture.livekit.cloud/'),'wss://fixture.livekit.cloud');
 for(const url of ['http://localhost','wss://user:secret@fixture.livekit.cloud','wss://fixture.livekit.cloud/path','https://livekit.cloud.evil.test'])assert.throws(()=>meetingEndpoint(url));
});
test('a configuration failure cannot certify media delivery or reveal provider details',async()=>{
 const result=await verifyLiveMeetingDelivery({run:()=>{throw Error('private provider payload');}});
 assert.equal(result.passed,false);assert.equal(result.phase,'configuration');assert(!JSON.stringify(result).includes('private'));
});
