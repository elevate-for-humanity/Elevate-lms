import test from 'node:test';
import assert from 'node:assert/strict';
import {connect} from 'node:net';
import {once} from 'node:events';
import {AudioSocketParser,audioSocketFrame,listenAudioSocket,greet,createExternalChannel,isCallerStart,waitForOwnedMedia} from './ari-media.mjs';
const uuid='12345678-1234-4234-8234-123456789abc';
const identity=Buffer.concat([Buffer.from([1,0,16]),Buffer.from(uuid.replaceAll('-',''),'hex')]);

test('AudioSocket authenticates the call UUID across fragmented TCP messages before accepting PCM',()=>{
 const frames=[];let ready=0;
 const decoder=new AudioSocketParser(uuid,f=>frames.push(f),()=>ready++);
 const packet=Buffer.concat([identity,audioSocketFrame(Buffer.alloc(160,0xff)),audioSocketFrame(Buffer.alloc(160,0x20))]);
 for(let i=0;i<packet.length;i+=7)decoder.push(packet.subarray(i,i+7));
 assert.equal(ready,1);assert.equal(frames.length,2);assert.deepEqual(frames[0],Buffer.alloc(160,0xff));
 assert.ok(frames[1].every(v=>Math.abs(v-0x20)<=1));
});
test('wrong identities, unannounced audio, unsupported PCM and oversized frames fail closed',()=>{
 const invalid=Buffer.from(identity);invalid[18]^=1;
 for(const packet of [invalid,audioSocketFrame(Buffer.alloc(160)),Buffer.from([1,25,1])]){
  assert.throws(()=>new AudioSocketParser(uuid,()=>assert.fail('untrusted media')).push(packet),/AUDIO_SOCKET_/);
 }
 for(const packet of [identity,Buffer.from([17,0,2,0,0]),Buffer.from([16,0,1,0]),Buffer.from([0,0,0])]){
  const decoder=new AudioSocketParser(uuid,()=>assert.fail('invalid audio'));
  decoder.push(identity);assert.throws(()=>decoder.push(packet),/AUDIO_SOCKET_/);
 }
});
test('fragmented PCM frames are regrouped into exact 20 ms voice frames',()=>{
 const frames=[],decoder=new AudioSocketParser(uuid,f=>frames.push(f));decoder.push(identity);
 for(let i=0;i<4;i++)decoder.push(Buffer.concat([Buffer.from([16,0,80]),Buffer.alloc(80)]));
 assert.equal(frames.length,1);assert.equal(frames[0].length,160);
});
test('media creation selects verified TCP PCM with an explicit per-call identity and cannot recursively start a caller',async()=>{
 const session={id:'a'.repeat(24),audioSocketId:uuid};
 await createExternalChannel(session,'127.0.0.1:19000',async(path,method,params)=>{
  assert.equal(params.transport,'tcp');assert.equal(params.encapsulation,'audiosocket');assert.equal(params.format,'slin');assert.equal(params.data,uuid);
  const channel={id:params.channelId,name:'AudioSocket/127.0.0.1:19000-'+uuid};
  assert.equal(isCallerStart({type:'StasisStart',channel}),false);return channel;
 });
});
test('a real loopback TCP handshake delivers the greeting without caller audio and accepts return PCM',async()=>{
 const incoming=[],session={id:'b'.repeat(24),callId:'test-tcp',turn:0,bridgeReady:true,audioSocketId:uuid};
 const failures=[];const media=await listenAudioSocket(session,f=>incoming.push(f),{finish:async(...args)=>failures.push(args)});
 const target=new URL('tcp://'+media.host),client=connect({host:target.hostname,port:Number(target.port)});
 try{
  await once(client,'connect');client.write(identity.subarray(0,5));client.write(identity.subarray(5));await media.connected;
  const received=once(client,'data');
  await greet(session,{request:async()=>({replyAudioUlawBase64:Buffer.alloc(160,0x20).toString('base64')}),finish:async()=>assert.fail('greeting failed')});
  const [packet]=await received;assert.equal(packet.length,323);assert.equal(packet[0],16);assert.equal(packet.readUInt16BE(1),320);assert.ok(Math.abs(packet.readInt16LE(3))>400);
  client.write(audioSocketFrame(Buffer.alloc(160,0xff)));
  for(let n=0;n<10&&!incoming.length;n++)await new Promise(r=>setTimeout(r,5));
  assert.equal(incoming.length,1);assert.equal(failures.length,0);
 }finally{session.closed=true;clearTimeout(session.mediaDeadline);client.destroy();session.socket?.destroy();session.server.close();}
});

test('external media joins only after the owned channel enters Stasis and public destinations are refused',async()=>{
 const session={externalId:'paris-media-abc'};let reads=0;
 await waitForOwnedMedia(session,async path=>{assert.equal(path,'/applications/elevate-paris');return {channel_ids:++reads>1?[session.externalId]:[]};},async()=>{});
 assert.equal(reads,2);
 await assert.rejects(waitForOwnedMedia(session,async()=>({channel_ids:[]}),async()=>{}),/STASIS_NOT_READY/);
 for(const host of ['8.8.8.8:19000','127.0.0.1:80','127.0.0.1:99999','localhost:19000'])await assert.rejects(createExternalChannel({id:'c'.repeat(24)},host,async()=>assert.fail('must not create channel')),/HOST_NOT_LOOPBACK/);
});
