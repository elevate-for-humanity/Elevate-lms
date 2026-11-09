import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

let serial=0;
async function fixture({broken=false}={}) {
 const originals={window:globalThis.window,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval};
 const pending=[],tones=[],timers=new Map(),listeners=new Map();
 let nextTimer=0;
 class Context {
  state='suspended';currentTime=0;destination={};
  constructor(){if(broken)throw Error('Audio unavailable');}
  resume(){return new Promise(resolve=>pending.push(()=>{this.state='running';resolve();}));}
  createOscillator(){const tone={type:'',frequency:{value:0},starts:0,stops:[],disconnected:false,onended:null,
   connect(){return {connect(){}};},start(){this.starts++;},stop(at){this.stops.push(at);},disconnect(){this.disconnected=true;}};tones.push(tone);return tone;}
  createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){return this;},disconnect(){}};}
 }
 globalThis.window={AudioContext:Context,addEventListener:(name,handler)=>listeners.set(name,handler),removeEventListener:name=>listeners.delete(name)};
 globalThis.setInterval=fn=>{const id=++nextTimer;timers.set(id,fn);return id;};
 globalThis.clearInterval=id=>timers.delete(id);
 const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/notifications/audio-unlock.ts',import.meta.url),'utf8'),{mode:'transform'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(source+'\n// isolated module '+serial++).toString('base64'));
 const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
 return {api,pending,tones,timers,listeners,flush,restore(){api.stopRingtone();Object.assign(globalThis,originals);}};
}

test('answer or hangup cancels a ringtone whose audio resume is still pending',async()=>{
 const f=await fixture();try {
  f.api.startRingtone();f.api.stopRingtone();f.pending.shift()();await f.flush();
  assert.equal(f.tones.length,0);assert.equal(f.timers.size,0);
 }finally{f.restore();}
});

test('only the newest pending incoming ringtone may start',async()=>{
 const f=await fixture();try {
  f.api.startRingtone();f.api.startRingtone();
  for(const resolve of f.pending)resolve();await f.flush();
  assert.equal(f.tones.length,1);assert.equal(f.timers.size,1);
 }finally{f.restore();}
});

test('stopping a ringing call clears repeats and immediately stops its active tone',async()=>{
 const f=await fixture();try {
  f.api.startRingtone();f.pending.shift()();await f.flush();
  assert.equal(f.tones[0].starts,1);assert.equal(f.timers.size,1);
  const queuedTick=[...f.timers.values()][0];
  f.api.stopRingtone();queuedTick();
  assert.equal(f.timers.size,0);assert.equal(f.tones.length,1);
  assert.equal(f.tones[0].stops.at(-1),undefined);
  assert.equal(f.tones[0].disconnected,true);
 }finally{f.restore();}
});

test('unavailable browser audio returns false without an unhandled ringtone failure',async()=>{
 const f=await fixture({broken:true});try {
  assert.equal(await f.api.unlockAudio(),false);
  f.api.startRingtone();await f.flush();assert.equal(f.timers.size,0);
 }finally{f.restore();}
});

test('phone mount registers gesture unlock and unmount removes its listeners',async()=>{
 const f=await fixture();try {
  const remove=f.api.installAudioUnlock();
  assert.deepEqual([...f.listeners.keys()],['pointerdown','keydown','touchstart']);
  f.listeners.get('pointerdown')();f.pending.shift()();await f.flush();
  assert.equal(await f.api.unlockAudio(),true);
  remove();assert.equal(f.listeners.size,0);
 }finally{f.restore();}
});
