import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRtp,rtp,isSpeech,routeOperator,isCallerStart,createExternalChannel,releaseCaller} from './ari-media.mjs';

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
test('external media StasisStart before its HTTP response cannot recursively start another bridge',async()=>{
  const session={id:'a'.repeat(24)};
  let creations=0;
  const external=await createExternalChannel(session,'127.0.0.1:19000',async(path,method,params)=>{
    creations++;
    assert.equal(path,'/channels/externalMedia');
    assert.equal(method,'POST');
    assert.equal('appArgs' in params,false); // Unsupported by externalMedia in Asterisk 20.
    assert.equal(params.channelId,session.externalId);
    const event={type:'StasisStart',args:[],channel:{id:params.channelId,name:'UnicastRTP/127.0.0.1:19000-00000001'}};
    assert.equal(isCallerStart(event),false);
    return event.channel;
  });
  assert.equal(creations,1);
  assert.equal(external.id,session.externalId);
});
test('only caller channel technologies enter PARIS, including when media events have empty args',()=>{
  for(const name of ['PJSIP/pwa-test-00000001','Local/901@internal-00000001;1']){
    assert.equal(isCallerStart({type:'StasisStart',args:[],channel:{id:'call-1',name}}),true);
  }
  for(const channel of [{id:'generated-1',name:'UnicastRTP/127.0.0.1:19000-1'},
    {id:'paris-media-'+ 'a'.repeat(24),name:'PJSIP/unexpected'}, {id:'call-1'}, {id:'bad/id',name:'PJSIP/test'}]){
    assert.equal(isCallerStart({type:'StasisStart',args:[],channel}),false);
  }
  assert.equal(isCallerStart({type:'StasisEnd',channel:{id:'call-1',name:'PJSIP/test'}}),false);
});
test('external channel response must match the preallocated cleanup identity',async()=>{
  await assert.rejects(createExternalChannel({id:'b'.repeat(24)},'127.0.0.1:19000',async()=>({id:'unexpected'})),/EXTERNAL_CHANNEL_ID_MISMATCH/);
});
test('voice processing failure returns the caller to its owning dialplan without a fabricated route',async()=>{
  const calls=[];
  await releaseCaller('call-1','continue',async(...args)=>calls.push(args));
  assert.deepEqual(calls,[['/channels/call-1/continue','POST']]);
});
test('failed fallback or requested call termination hangs up only the owned caller leg',async()=>{
  const calls=[];
  await releaseCaller('call-1','continue',async(...args)=>{
    calls.push(args);if(args[1]==='POST')throw Error('ARI_POST_409');
  });
  assert.deepEqual(calls,[['/channels/call-1/continue','POST'],['/channels/call-1','DELETE']]);
  const hangups=[];
  await releaseCaller('call-2','hangup',async(...args)=>hangups.push(args));
  assert.deepEqual(hangups,[['/channels/call-2','DELETE']]);
  await assert.rejects(releaseCaller('call-2','hangup',async()=>{throw Error('ARI_DELETE_403');}),/ARI_DELETE_403/);
  await assert.rejects(releaseCaller('../other','hangup',async()=>assert.fail('must not request')),/CALL_RELEASE_NOT_ALLOWED/);
});

test('RTP padding cannot exceed payload and zero-length packets are rejected',()=>{
 const base=rtp(Buffer.alloc(160,0xff),{seq:0,timestamp:0,ssrc:1});
 const oversized=Buffer.from(base);oversized[0]|=0x20;oversized[oversized.length-1]=255;
 assert.equal(parseRtp(oversized),null);
 const empty=base.subarray(0,12);assert.equal(parseRtp(empty),null);
 const zeroPad=Buffer.from(base);zeroPad[0]|=0x20;zeroPad[zeroPad.length-1]=0;
 assert.equal(parseRtp(zeroPad),null);
});
