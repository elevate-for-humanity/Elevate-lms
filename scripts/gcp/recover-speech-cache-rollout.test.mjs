import test from 'node:test';import assert from 'node:assert/strict';import {recoverSpeech} from './recover-speech-cache-rollout.mjs';
const revision='elevate-marketing-migration-r4e32ccff-1';const previous='elevate-marketing-migration-r38fa72ef-1';
test('never reverts a newer release',async()=>{const r=await recoverSpeech({run:()=>JSON.stringify({status:{traffic:[{percent:100,revisionName:'elevate-marketing-migration-r8a8aca5e-1'}]}}),request:()=>assert.fail(),activate:()=>assert.fail()});assert.equal(r.changed,false);});
test('requires decoded candidate speech before promoting the known-good rollback',async()=>{
 let activated=false;const audio=Buffer.alloc(2000,1);
 const run=args=>JSON.stringify(args[2]==='list'?[{metadata:{name:previous},status:{conditions:[{type:'Ready',status:'True'}]}}]:{status:{url:'https://canonical.run.app',traffic:[{percent:100,revisionName:revision}]}});
 const request=async(url)=>url.endsWith('/api/health')?Response.json({commit:'4e32ccff1b09d020c9eaed3a9bc5bec525082de2'}):new Response(activated||url.includes('candidate')?audio:'unavailable',{status:activated||url.includes('candidate')?200:503,headers:{'Content-Type':activated||url.includes('candidate')?'audio/mpeg':'application/json'}});
 const r=await recoverSpeech({run,request,decode:()=>true,activate:async options=>{await options.fetcher('https://candidate.run.app/api/health',{});activated=true;return {revision:previous,traffic:100};}});
 assert.equal(r.publicAudioVerified,true);assert.equal(r.cacheReuseVerified,false);
});

test('consumes health before a longer audio probe can invalidate the original response',async()=>{
 let activated=false,health;
 const run=args=>JSON.stringify(args[2]==='list'?[{metadata:{name:previous},status:{conditions:[{type:'Ready',status:'True'}]}}]:{status:{url:'https://canonical.run.app',traffic:[{percent:100,revisionName:revision}]}});
 const request=async url=>{
  if(url.endsWith('/api/health')){const r=Response.json({commit:url.includes('candidate')?'38fa72efea936554e964b10849ac4f66e5942964':'4e32ccff1b09d020c9eaed3a9bc5bec525082de2'});if(url.includes('candidate'))health=r;return r;}
  if(url.includes('candidate')&&!health.bodyUsed)await health.body.cancel();
  return new Response(activated||url.includes('candidate')?Buffer.alloc(2000):'unavailable',{status:activated||url.includes('candidate')?200:503,headers:{'Content-Type':'audio/mpeg'}});
 };
 await recoverSpeech({run,request,decode:()=>true,activate:async options=>{
  assert.equal(options.attempts,undefined,'use the existing bounded standard activation retry window');
  const r=await options.fetcher('https://candidate.run.app/api/health',{});
  assert.equal((await r.json()).commit,'38fa72efea936554e964b10849ac4f66e5942964');activated=true;return {revision:previous,traffic:100};
 }});
});
