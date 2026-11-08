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
