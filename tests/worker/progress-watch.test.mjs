import test from 'node:test';
import assert from 'node:assert/strict';
import {createCourseProgressWatch,reportCourseProgress} from '../../lib/ultimate-course-builder/worker/progress-watch.mjs';
function fixture(){let clock=0,stalls=0;const w=createCourseProgressWatch({idleMs:100,now:()=>clock,schedule:()=>0,cancel:()=>{},onStall:async()=>{stalls++;}});return {w,advance:n=>clock+=n,stalls:()=>stalls};}
test('an active heartbeat without output cannot prevent a stall',async()=>{const f=fixture();f.advance(101);await f.w.check();assert.equal(f.stalls(),1);assert.equal(f.w.signal.aborted,true);f.w.dispose();});
test('new photo or encoded frame extends progress deadline',async()=>{const f=fixture();f.advance(90);f.w.run(()=>reportCourseProgress('photos',1,3));f.advance(90);await f.w.check();assert.equal(f.stalls(),0);f.w.dispose();});
test('repeated identical frame count does not count as progress',async()=>{const f=fixture();f.w.report('frames',1,10);f.advance(90);f.w.report('frames',1,10);f.advance(11);await f.w.check();assert.equal(f.stalls(),1);f.w.dispose();});
test('stall recovery fires once and cancels the old task context',async()=>{const f=fixture();f.advance(101);await f.w.check();await f.w.check();assert.equal(f.stalls(),1);assert.throws(()=>f.w.report('photos',2,3),/ULTIMATE_PROGRESS_STALLED/);f.w.dispose();});
test('a failed progress save does not poison subsequent saves',async()=>{
 let clock=20000,calls=0;
 const w=createCourseProgressWatch({now:()=>clock,schedule:()=>0,cancel:()=>{},onProgress:async()=>{if(++calls===1)throw Error('database timeout');}});
 w.report('photos',1,4);await new Promise(setImmediate);
 clock+=11000;w.report('photos',2,4);await new Promise(setImmediate);
 assert.equal(calls,2);w.dispose();
});
test('a hung progress save cannot delay stall cancellation or recovery',async()=>{
 let clock=20000,stalls=0;
 const w=createCourseProgressWatch({idleMs:100,now:()=>clock,schedule:()=>0,cancel:()=>{},onProgress:()=>new Promise(()=>{}),onStall:async()=>{stalls++;}});
 w.report('photos',1,4);await new Promise(setImmediate);clock+=101;
 await w.check();assert.equal(w.signal.aborted,true);assert.equal(stalls,1);
 await assert.rejects(w.race(new Promise(()=>{})),/ULTIMATE_PROGRESS_STALLED/);w.dispose();
});
test('a hung failure-state write cannot keep paid work running',async()=>{
 let clock=0;
 const w=createCourseProgressWatch({idleMs:100,now:()=>clock,schedule:()=>0,cancel:()=>{},onStall:()=>new Promise(()=>{})});
 clock=101;void w.check();assert.equal(w.signal.aborted,true);
 await assert.rejects(w.race(new Promise(()=>{})),/ULTIMATE_PROGRESS_STALLED/);w.dispose();
});
test('queued saves are discarded after disposal',async()=>{
 let clock=20000,release,calls=0;
 const pending=new Promise(r=>{release=r;});
 const w=createCourseProgressWatch({now:()=>clock,schedule:()=>0,cancel:()=>{},onProgress:async()=>{calls++;await pending;}});
 w.report('photos',1,4);await new Promise(setImmediate);clock+=11000;w.report('photos',2,4);
 w.dispose();release();await new Promise(setImmediate);assert.equal(calls,1);
});
