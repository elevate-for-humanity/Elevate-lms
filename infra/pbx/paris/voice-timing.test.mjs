import {randomBytes} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {speak,createEventSocket} from './ari-media.mjs';
test('RTP timing excludes socket callback work from frame intervals',async()=>{
 let now=0;const sent=[];const session={closed:false,remote:{port:10000,address:'127.0.0.1'},seq:1,timestamp:1,ssrc:1,socket:{send(packet,port,host,done){sent.push(now);now+=5;done();}}};
 await speak(session,Buffer.alloc(480,255).toString('base64'),{clock:()=>now,wait:async ms=>{now+=ms;}});
 assert.deepEqual(sent,[0,20,40]);assert.equal(now,60);assert.equal(session.playing,false);
});

test('ARI uses an encoded private event credential with native WebSocket arguments',()=>{
 const password=randomBytes(12).toString('base64')+'+/?:&';
 let seen;class Socket{constructor(...args){seen=args;}}
 createEventSocket({ws:'ws://127.0.0.1:8088/ari/events',user:'test-user',password,app:'elevate-paris'},Socket);
 assert.equal(seen.length,1);assert.equal(seen[0].searchParams.get('api_key'),'test-user:'+password);assert.equal(seen[0].searchParams.get('app'),'elevate-paris');
 assert.throws(()=>createEventSocket({ws:'ws://example.test/ari/events',user:'test',password,app:'test'},Socket),/ARI_MUST_BE_LOOPBACK/);
});
