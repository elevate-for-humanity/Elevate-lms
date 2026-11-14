import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {ProviderSessionStore} from './provider-session-store.mjs';
import {retireBrowserSession} from './session-retirement.mjs';

test('ordinary close preserves the live session when real persistence becomes unavailable',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'studio-retire-'));
 const store=new ProviderSessionStore({secret:'test-only',directory});
 const session={providerScope:'envato:owner-a',context:{storageState:async()=>({cookies:[{name:'session',value:'fixture',domain:'.envato.com'}],origins:[]})}};
 let closed=false;
 try {
  await store.save(session.providerScope,session.context);
  await fs.rename(directory,directory+'-saved');await fs.writeFile(directory,'unavailable');
  await assert.rejects(retireBrowserSession(session,{saveState:(...args)=>store.save(...args),retire:async()=>{closed=true;}}),/SESSION_CHECKPOINT_FAILED/);
  assert.equal(closed,false);
  await fs.unlink(directory);await fs.rename(directory+'-saved',directory);
  await retireBrowserSession(session,{saveState:(...args)=>store.save(...args),retire:async()=>{closed=true;}});
  assert.equal(closed,true);
  assert.equal((await new ProviderSessionStore({secret:'test-only',directory}).load(session.providerScope)).cookies[0].value,'fixture');
 } finally {await fs.rm(directory,{recursive:true,force:true});await fs.rm(directory+'-saved',{recursive:true,force:true});}
});
test('close drains pending writes and completes a final checkpoint before retirement',async()=>{
 const events=[];
 await retireBrowserSession({checkpointProviderState:async()=>events.push('drained'),providerScope:'owner',context:{}},{saveState:async()=>events.push('durable'),retire:async()=>events.push('retired')});
 assert.deepEqual(events,['drained','durable','retired']);
});
test('forced process shutdown reports failed persistence before releasing its context',async()=>{
 const events=[];
 await retireBrowserSession({}, {force:true,saveState:async()=>{throw Error('private storage detail');},onForcedFailure:()=>events.push('reported'),retire:async()=>events.push('retired')});
 assert.deepEqual(events,['reported','retired']);
});
