import test from 'node:test';
import assert from 'node:assert/strict';
import {receiveCallerAudio,speak,greet,turn,handleDtmf} from './ari-media.mjs';

const voice=()=>Buffer.alloc(160,0x00);
const silence=()=>Buffer.alloc(160,0xff);
const session=()=>({callId:'interruption-call',id:'a'.repeat(24),turn:0,frames:[],quiet:0,heard:false,bridgeReady:true,remote:{address:'127.0.0.1',port:12345}});
function feed(s,count,frame=voice,dependencies){for(let i=0;i<count;i++)receiveCallerAudio(s,frame(),dependencies);}

test('sustained caller speech stops the greeting and preserves its first frame',async()=>{
 const s=session();let sent=0,now=0;
 s.busy=true;s.writeAudio=async()=>{sent++;receiveCallerAudio(s,voice());};
 await speak(s,Buffer.alloc(160*3000,0xff).toString('base64'),{clock:()=>now,wait:async ms=>{now+=ms;}});
 assert.equal(sent,15);assert.equal(s.playing,false);assert.equal(s.playbackInterrupted,true);
 assert.equal(s.frames.length,15);assert.deepEqual(s.frames[0],voice());
});

test('isolated noise does not interrupt playback or queue a delayed command',async()=>{
 const s=session();let sent=0,now=0;
 s.busy=true;s.writeAudio=async()=>{sent++;receiveCallerAudio(s,sent%10===1?voice():silence());};
 await speak(s,Buffer.alloc(160*100,0xff).toString('base64'),{clock:()=>now,wait:async ms=>{now+=ms;}});
 assert.equal(sent,100);assert.equal(s.playbackInterrupted,false);assert.equal(s.frames.length,0);assert.equal(s.heard,false);
});

test('short phoneme gaps retain the first words and still interrupt playback',()=>{
 const s=session();s.busy=true;s.playing=true;
 feed(s,10);feed(s,1,silence);feed(s,5);
 assert.equal(s.playbackInterrupted,true);assert.equal(s.frames.length,16);assert.deepEqual(s.frames[0],voice());
});

test('an unconfirmed tail click is not processed after playback ends',()=>{
 const s=session();s.busy=true;s.playing=true;let turns=0;
 receiveCallerAudio(s,voice());s.playing=false;s.busy=false;
 feed(s,45,silence,{processTurn:()=>{turns++;}});
 assert.equal(turns,0);assert.equal(s.frames.length,0);assert.equal(s.heard,false);
});

test('real speech straddling playback completion is retained and processed',()=>{
 const s=session();s.busy=true;s.playing=true;let turns=0;
 feed(s,10);s.playing=false;s.busy=false;
 feed(s,25);feed(s,45,silence,{processTurn:()=>{turns++;}});
 assert.equal(turns,1);assert.equal(s.frames.length,80);assert.deepEqual(s.frames[0],voice());
});

test('utterance completed during greeting is processed once after playback unwinds',async()=>{
 const s=session();let requests=0,turns=0;let firstFrame;
 await greet(s,{
  request:async()=>{requests++;return {replyAudioUlawBase64:'greeting'};},
  play:async()=>{s.playing=true;feed(s,35);feed(s,45,silence);feed(s,100);assert.equal(s.frames.length,80);assert.equal(s.inputReady,true);assert.equal(turns,0);s.playing=false;},
  processTurn:async current=>{turns++;assert.equal(current.busy,false);firstFrame=current.frames[0];current.inputReady=false;},
  finish:async()=>assert.fail('unexpected fallback'),
 });
 assert.equal(requests,1);assert.equal(turns,1);assert.deepEqual(firstFrame,voice());
});

test('partial interruption continues after greeting and flushes at end of speech',async()=>{
 const s=session();let turns=0;
 const dependencies={processTurn:async()=>{turns++;}};
 s.busy=true;s.playing=true;feed(s,15,voice,dependencies);s.playing=false;s.busy=false;
 feed(s,20,voice,dependencies);feed(s,45,silence,dependencies);
 assert.equal(turns,1);assert.equal(s.frames.length,80);feed(s,100,voice,dependencies);assert.equal(turns,1);
});

test('continuous speech is bounded and cannot dispatch overlapping busy turns',()=>{
 const s=session();s.busy=true;s.playing=true;let turns=0;
 feed(s,10000,voice,{processTurn:()=>{turns++;}});
 assert.equal(s.frames.length,600);assert.equal(s.inputReady,true);assert.equal(turns,0);
});

test('closed, transferring, not-ready and inference-busy sessions reject incoming media',()=>{
 for(const state of [{closed:true},{transferring:true},{bridgeReady:false},{busy:true}]){
  const s={...session(),...state};feed(s,100);assert.equal(s.frames.length,0);
 }
});

test('keypad transfer wins over buffered speech without running a stale voice turn',async()=>{
 const s=session();let routed=0,turns=0;
 await greet(s,{
  request:async()=>({replyAudioUlawBase64:'greeting'}),
  play:async()=>{s.playing=true;feed(s,35);feed(s,45,silence);await handleDtmf({type:'ChannelDtmfReceived',digit:'0',channel:{id:s.callId}},new Map([[s.callId,s]]),{route:async()=>{routed++;},finish:async()=>{}});s.playing=false;},
  processTurn:async()=>{turns++;},finish:async()=>assert.fail('unexpected fallback'),
 });
 assert.equal(routed,1);assert.equal(turns,0);assert.equal(s.inputReady,false);assert.equal(s.frames.length,0);
});

test('speech during a reply is processed sequentially and uses the next sequence',async()=>{
 const s=session();s.frames=Array.from({length:35},voice);s.turn=1;let requests=0;
 await turn(s,{
  request:async(url,body)=>{requests++;assert.equal(body.sequence,requests);return {replyAudioUlawBase64:'reply'};},
  play:async()=>{if(requests===1){s.playing=true;feed(s,35);feed(s,45,silence);s.playing=false;}},
  finish:async()=>assert.fail('unexpected fallback'),
 });
 assert.equal(requests,2);assert.equal(s.frames.length,0);assert.equal(s.busy,false);assert.equal(s.inputReady,false);
});

for(const terminal of [{endCall:true},{requestedRoute:{type:'operator',extension:'0'}}]){
 test('interrupted terminal reply waits for caller correction: '+JSON.stringify(terminal),async()=>{
  const s=session();s.frames=Array.from({length:35},voice);let requests=0;
  await turn(s,{
   request:async()=>{requests++;return {replyAudioUlawBase64:'reply',...(requests===1?terminal:{})};},
   play:async()=>{if(requests===1){s.playing=true;feed(s,35);feed(s,45,silence);s.playing=false;}},
   finish:async()=>assert.fail('interrupted action must not end or transfer caller'),
  });
  assert.equal(requests,2);assert.equal(s.closed,undefined);assert.equal(s.transferring,undefined);
 });
}
