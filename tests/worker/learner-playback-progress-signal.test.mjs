import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {playbackProgressSignal} from '../../lib/lms/playback-progress-signal.mjs';

test('long-video percentages do not starve real server progress callbacks',()=>{
 const times=[0,1,2,3,4,5,6,7];
 let lastPct=-1,bucket=-1;
 const notified=[];
 for(const time of times) {
  const signal=playbackProgressSignal({timeSeconds:time,percent:0,lastPercent:lastPct,lastBucket:bucket});
  if(signal.notify){notified.push(time);bucket=signal.bucket;}
  if(signal.percentChanged)lastPct=0;
 }
 assert.deepEqual(notified,[0,3,6]);
});

test('short-video percent changes still notify without multiple same-second notifications',()=>{
 const first=playbackProgressSignal({timeSeconds:1,percent:5,lastPercent:4,lastBucket:0});
 assert.equal(first.notify,true);
 assert.equal(first.percentChanged,true);
 const redundant=playbackProgressSignal({timeSeconds:1.5,percent:5,lastPercent:5,lastBucket:0});
 assert.equal(redundant.notify,false);
});

test('invalid timeline samples never forge progress callbacks',()=>{
 for(const timeSeconds of [-1,Infinity,NaN]) {
  assert.equal(playbackProgressSignal({timeSeconds,percent:10,lastPercent:9,lastBucket:0}).notify,false);
 }
});

test('actual player calls elapsed-time policy; completed learner test waits for server readback',()=>{
 const player=readFileSync(new URL('../../components/lms/InteractiveVideoPlayer.tsx',import.meta.url),'utf8');
 const runner=readFileSync(new URL('../../services/studio-browser/learner-runthrough.mjs',import.meta.url),'utf8');
 assert.match(player,/const signal = playbackProgressSignal\(/);
 assert.match(player,/if \(!readOnly && signal\.notify\)/);
 assert.match(runner,/await waitForPersistedPlayback\(state\)/);
 assert.match(runner,/Number\(last\?\.watchedSeconds\) > 0/);
});
