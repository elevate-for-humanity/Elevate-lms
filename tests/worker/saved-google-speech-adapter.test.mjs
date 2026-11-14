import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const audio=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(200,1)]);
const source=readFileSync(new URL('../../lib/ai/saved-google-speech.ts',import.meta.url),'utf8')
 .replace("import {requireAdminClient} from '@/lib/supabase/admin';","const requireAdminClient=async()=>globalThis.speechAdapterTest.db;")
 .replace("import {generateGoogleNaturalVoice} from './google-natural-voice';","const generateGoogleNaturalVoice=async()=>{globalThis.speechAdapterTest.calls++;return globalThis.speechAdapterTest.audio;};")
 .replace("import {WEBSITE_SPEAKERS} from '@/lib/website-builder/design-choices';","const WEBSITE_SPEAKERS=[{id:'warm',providerVoice:'en-US-Neural2-F'}];")
 .replace("import {savedSpeech} from './saved-speech.mjs';",`import {savedSpeech} from '${new URL('../../lib/ai/saved-speech.mjs',import.meta.url)}';`);
const {generateSavedGoogleSpeech}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
test('private storage adapter stores bytes and reuses them through the real cache',async()=>{
 let stored;globalThis.speechAdapterTest={calls:0,audio,db:{storage:{getBucket:async()=>({data:{public:false}}),from:()=>({
  info:async()=>stored?{data:{}}:{error:{statusCode:'404',message:'Object not found'}},
  download:async()=>stored?{data:new Blob([stored])}:{error:{statusCode:'404',message:'Object not found'}},
  upload:async(key,bytes,opts)=>{assert.equal(opts.upsert,false);assert.equal(opts.contentType,'audio/mpeg');stored=bytes;return {};},
 })}}};
 assert.equal((await generateSavedGoogleSpeech('Private adapter.')).cache,'stored');
 assert.equal((await generateSavedGoogleSpeech('Private adapter.')).cache,'hit');
 assert.equal(globalThis.speechAdapterTest.calls,1);
});
test('public or denied storage never incurs a synthesis request',async()=>{
 globalThis.speechAdapterTest={calls:0,audio,db:{storage:{getBucket:async()=>({data:{public:true}}),from:()=>assert.fail()}}};
 await assert.rejects(generateSavedGoogleSpeech('Public bucket.'),/PRIVATE_BUCKET_REQUIRED/);
 globalThis.speechAdapterTest.db.storage.getBucket=async()=>({error:{message:'denied'}});
 await assert.rejects(generateSavedGoogleSpeech('Denied bucket.'),/PRIVATE_BUCKET_REQUIRED/);
 assert.equal(globalThis.speechAdapterTest.calls,0);
});

test('a metadata denial or server failure cannot be mistaken for an absent object',async()=>{
 for(const statusCode of ['400','401','403','500']){
  globalThis.speechAdapterTest={calls:0,audio,db:{storage:{getBucket:async()=>({data:{public:false}}),from:()=>({info:async()=>({error:{statusCode,message:'unavailable'}}),download:()=>assert.fail('must not download after denied metadata')})}}};
  await assert.rejects(generateSavedGoogleSpeech('Denied metadata '+statusCode),/READ_UNAVAILABLE/);
  assert.equal(globalThis.speechAdapterTest.calls,0);
 }
});
