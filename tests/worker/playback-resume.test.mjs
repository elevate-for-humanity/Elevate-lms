import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { installPlaybackResume } from '../../lib/lms/playback-resume.mjs';
function media({readyState=0,duration=30,delayed=false}={}) {
 const events=new Map();let position=0;const seeks=[];
 const m={readyState,duration,seeking:false,events,seeks,
  get currentTime(){return position},set currentTime(value){seeks.push(value);if(delayed)m.seeking=true;else position=value},
  addEventListener(n,h){events.set(n,h)},removeEventListener(n,h){if(events.get(n)===h)events.delete(n)},
  emit(n){events.get(n)?.()},finishSeek(value){position=value;m.seeking=false;m.emit('seeked')}
 };return m;
}
test('cached metadata before hydration still restores durable position without playback',()=>{
 const m=media({readyState:1});let done=0;const cleanup=installPlaybackResume(m,5.535798,()=>done++);
 assert.equal(m.currentTime,5.535798);assert.equal(done,1);
 m.emit('loadedmetadata');m.emit('canplay');assert.deepEqual(m.seeks,[5.535798]);cleanup();assert.equal(m.events.size,0);
});
test('delayed metadata and asynchronous seek do not report restoration prematurely',()=>{
 const m=media({delayed:true});let done=0;installPlaybackResume(m,3.907824,()=>done++);
 assert.equal(done,0);m.readyState=1;m.emit('loadedmetadata');assert.equal(done,0);
 assert.equal(m.seeking,true);m.finishSeek(3.907824);assert.equal(done,1);
});
test('failed early seek retries at loaded data; old media listeners are removed',()=>{
 const m=media({readyState:1});let tries=0,done=0;
 Object.defineProperty(m,'currentTime',{get:()=>tries>1?4:0,set:()=>{tries++;if(tries===1)throw Error('not ready')}});
 const cleanup=installPlaybackResume(m,4,()=>done++);assert.equal(done,0);m.emit('loadeddata');assert.equal(done,1);
 cleanup();m.emit('canplay');assert.equal(tries,2);
});
test('invalid/zero resume does not seek or manufacture progress/completion',()=>{
 for(const position of [0,-1,NaN]){const m=media();let done=0;installPlaybackResume(m,position,()=>done++);assert.equal(done,1);assert.equal(m.seeks.length,0);}
 const m=media({readyState:1,duration:10});installPlaybackResume(m,50,()=>{});assert.equal(m.currentTime,9.75);
});

test('player keeps the Next client directive before all imports',()=>{
 const source=readFileSync(new URL('../../components/lms/InteractiveVideoPlayer.tsx',import.meta.url),'utf8');
 const directive=source.indexOf("'use client';"), firstImport=source.search(/^import /m);
 assert.ok(directive>=0 && directive<firstImport);
});
