import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRtp,rtp,isSpeech,routeOperator} from './ari-media.mjs';

test('PCMU RTP round trip maintains packetization and sequence',()=>{
 const state={seq:65535,timestamp:100,ssrc:123};
 const voice=Buffer.alloc(160,0xff);
 const packet=rtp(voice,state);
 const parsed=parseRtp(packet);
 assert.deepEqual(parsed.payload,voice);
 assert.equal(parsed.ssrc,123);
 assert.equal(state.seq,0);
 assert.equal(state.timestamp,260);
});
test('malformed, unsupported and truncated RTP are rejected',()=>{
 assert.equal(parseRtp(Buffer.alloc(3)),null);
 const packet=rtp(Buffer.alloc(160,0xff),{seq:0,timestamp:0,ssrc:1});
 packet[1]=8;assert.equal(parseRtp(packet),null);
 packet[0]=0x90;packet[12]=0xff;packet[13]=0xff;assert.equal(parseRtp(packet),null);
});
test('quiet PCMU is not caller speech',()=>{
 assert.equal(isSpeech(Buffer.alloc(160,0xff)),false);
 assert.equal(isSpeech(Buffer.alloc(160,0x00)),true);
});
test('operator transfer exits Stasis into the reviewed dialplan without changing channel technology',async()=>{
  const calls=[];
  await routeOperator('call-1',{type:'operator',extension:'0'},async(path,method,params)=>{
    // ARI redirect requires the same channel technology; SIP -> Local is 422.
    if(path.includes('/redirect'))throw Error('ARI_POST_422');
    calls.push({path,method,params});
  });
  assert.deepEqual(calls,[{path:'/channels/call-1/continue',method:'POST',params:{context:'internal',extension:'0',priority:1}}]);
});
test('operator transfer rejects arbitrary dial strings and propagates ARI rejection',async()=>{
  let called=false;
  for(const route of [{type:'operator',extension:'100'},{type:'external',extension:'+18005551212'}]){
    await assert.rejects(routeOperator('call-1',route,async()=>{called=true;}),/ROUTE_NOT_ALLOWED/);
  }
  assert.equal(called,false);
  await assert.rejects(routeOperator('call-1',{type:'operator',extension:'0'},async()=>{throw Error('ARI_POST_409');}),/ARI_POST_409/);
});
