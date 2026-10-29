import assert from 'node:assert/strict';
import {generateEdgeTTS} from '../../lib/video/edge-tts.ts';
// Run only inside the immutable image containing the approved native model.
// The queue request deadline is five seconds. Inference must leave enough
// event-loop time for a real heartbeat request; extended leases hide the fault.
const text="Before cutting hair, wash your hands and clean the tools. Check the client's scalp and explain the next step. Place a clean cape around the shoulders and adjust the chair. Choose the correct guard before starting the first section. Keep the clipper moving with steady pressure. Stop immediately if the skin becomes irritated. After the haircut, brush away loose hair, show the finished shape in a mirror, and disinfect every reusable tool.";
let previous=performance.now(),maxLagMs=0,ticks=0;
const sample=()=>{const now=performance.now();maxLagMs=Math.max(maxLagMs,now-previous);previous=now;ticks++;};
const timer=setInterval(sample,100);
try {
 const audio=await generateEdgeTTS(text,{voice:'en-US-DavisNeural',rate:'0%'});
 sample();
 assert.ok(audio.length>1000,'NATIVE_NARRATION_AUDIO_REQUIRED');
 assert.ok(ticks>2,'NATIVE_NARRATION_HEARTBEAT_TIMER_REQUIRED');
 assert.ok(maxLagMs<2000,'NATIVE_NARRATION_BLOCKED_HEARTBEAT:'+Math.round(maxLagMs));
 console.log(JSON.stringify({nativeNarration:true,heartbeatTicks:ticks,maxEventLoopGapMs:Math.round(maxLagMs),audioBytes:audio.length}));
} catch(error) {
 console.error('COURSE_NATIVE_NARRATION_LIVENESS_FAILED: '+(error instanceof Error?error.message:String(error)));
 process.exitCode=1;
} finally {clearInterval(timer);}
