import test from 'node:test';
import assert from 'node:assert/strict';
import {savedSpeech,speechCacheKey} from '../../lib/ai/saved-speech.mjs';
const audio=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(200,7)]);
test('reuses durable speech after a completed call without resynthesis',async()=>{
 const objects=new Map();let calls=0;
 const args={text:'Welcome.',voice:'en-US-Neural2-F',read:async k=>objects.get(k),write:async(k,b)=>objects.set(k,b),synthesize:async()=>{calls++;return audio;}};
 assert.equal((await savedSpeech(args)).cache,'stored');
 assert.equal((await savedSpeech(args)).cache,'hit');assert.equal(calls,1);
 assert.notEqual(speechCacheKey(args.text,args.voice),speechCacheKey(args.text,'en-US-Neural2-J'));
 assert.notEqual(speechCacheKey(args.text,args.voice),speechCacheKey('New text.',args.voice));
 assert.ok(!speechCacheKey(args.text,args.voice).includes('Welcome'));
});
test('coalesces simultaneous requests for the same text and voice',async()=>{
 let calls=0;let value;const args={text:'Concurrent.',voice:'F',read:async()=>value,write:async(k,b)=>{value=b;},synthesize:async()=>{calls++;await new Promise(r=>setTimeout(r,10));return audio;}};
 const [a,b]=await Promise.all([savedSpeech(args),savedSpeech(args)]);
 assert.deepEqual(a.audio,b.audio);assert.equal(calls,1);
});
test('storage failure prevents a charge; invalid audio is not saved',async()=>{
 await assert.rejects(savedSpeech({text:'Unavailable.',voice:'F',read:async()=>{throw Error('storage denied');},write:()=>assert.fail(),synthesize:()=>assert.fail('must not bill')}),/storage denied/);
 await assert.rejects(savedSpeech({text:'Invalid.',voice:'F',read:async()=>null,write:()=>assert.fail(),synthesize:async()=>Buffer.from('<html>error</html>')}),/AUDIO_INVALID/);
});
test('failed durable write/readback is never reported as saved speech',async()=>{
 await assert.rejects(savedSpeech({text:'Failed write.',voice:'F',read:async()=>null,write:async()=>{throw Error('write failed');},synthesize:async()=>audio}),/write failed/);
 let reads=0;await assert.rejects(savedSpeech({text:'Mismatch.',voice:'F',read:async()=>++reads===1?null:Buffer.concat([Buffer.from('ID3'),Buffer.alloc(200,8)]),write:async()=>{},synthesize:async()=>audio}),/READBACK_MISMATCH/);
});
test('a different instance winning an immutable write returns its durable audio',async()=>{
 let reads=0;const winner=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(200,9)]);
 const result=await savedSpeech({text:'Cross instance.',voice:'F',read:async()=>++reads===1?null:winner,write:async()=>({existing:true}),synthesize:async()=>audio});
 assert.equal(result.cache,'hit');assert.deepEqual(result.audio,winner);
});
