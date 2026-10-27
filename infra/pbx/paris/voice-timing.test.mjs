import {randomBytes} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {speak,createEventSocket} from './ari-media.mjs';
test('RTP timing excludes socket callback work from frame intervals',async()=>{
 let now=0;const sent=[];const session={closed:false,remote:{port:10000,address:'127.0.0.1'},seq:1,timestamp:1,ssrc:1,socket:{send(packet,port,host,done){sent.push(now);now+=5;done();}}};
 await speak(session,Buffer.alloc(480,255).toString('base64'),{clock:()=>now,wait:async ms=>{now+=ms;}});
 assert.deepEqual(sent,[0,20,40]);assert.equal(now,60);assert.equal(session.playing,false);
});

test('operator keypad handoff interrupts audio before the next RTP frame',async()=>{
 let sent=0;const session={closed:false,remote:{port:10000,address:'127.0.0.1'},seq:1,timestamp:1,ssrc:1,
  socket:{send(packet,port,host,done){sent++;session.transferring=true;done();}}};
 await speak(session,Buffer.alloc(480,255).toString('base64'),{clock:()=>0,wait:async()=>{}});
 assert.equal(sent,1);assert.equal(session.playing,false);
});

test('a business greeting longer than twenty seconds plays within a bounded envelope',async()=>{
 let now=0,sent=0;const session={closed:false,remote:{port:10000,address:'127.0.0.1'},seq:1,timestamp:1,ssrc:1,
  socket:{send(packet,port,host,done){sent++;done();}}};
 await speak(session,Buffer.alloc(200000,255).toString('base64'),{clock:()=>now,wait:async ms=>{now+=ms;}});
 assert.equal(sent,1250);assert.equal(now,25000);
 await assert.rejects(speak(session,Buffer.alloc(640160,255).toString('base64')),/INVALID_ULAW_AUDIO/);
});

test('ARI uses an encoded private event credential with native WebSocket arguments',()=>{
 const password=randomBytes(12).toString('base64')+'+/?:&';
 let seen;class Socket{constructor(...args){seen=args;}}
 createEventSocket({ws:'ws://127.0.0.1:8088/ari/events',user:'test-user',password,app:'elevate-paris'},Socket);
 assert.equal(seen.length,1);assert.equal(seen[0].searchParams.get('api_key'),'test-user:'+password);assert.equal(seen[0].searchParams.get('app'),'elevate-paris');
 assert.throws(()=>createEventSocket({ws:'ws://example.test/ari/events',user:'test',password,app:'test'},Socket),/ARI_MUST_BE_LOOPBACK/);
});
