import test from 'node:test';
import assert from 'node:assert/strict';
import {createCheckpointFallback,privateCheckpointStorage} from '../../lib/video/checkpoint-fallback.mjs';
test('bandwidth cap switches once, resumes existing private checkpoint and stores later chunks there',async()=>{
 let primary=0;const writes=[];const c=createCheckpointFallback({readPrimary:async()=>{primary++;throw Error('download bandwidth or transaction (Class B) cap exceeded');},writePrimary:()=>assert.fail('must avoid capped backend'),readFallback:async()=>Buffer.from('saved lesson segment'),writeFallback:async(...args)=>writes.push(args)});
 assert.equal((await c.read('lesson/fingerprint/0-899.mp4')).toString(),'saved lesson segment');
 await c.read('lesson/fingerprint/900-1799.mp4');await c.write('next',Buffer.from('rendered'));
 assert.equal(primary,1);assert.equal(c.usingFallback(),true);assert.equal(writes.length,1);
});
test('permission and corrupt storage errors are not hidden by fallback',async()=>{
 const c=createCheckpointFallback({readPrimary:async()=>{throw Error('AccessDenied');},readFallback:()=>assert.fail('unexpected fallback')});
 await assert.rejects(c.read('lesson'),/AccessDenied/);
});
test('private checkpoint uploads require exact readback and use authenticated private bucket',async()=>{
 let stored;const p=privateCheckpointStorage({env:{NEXT_PUBLIC_SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only'},request:async(url,opts)=>{
  assert.match(url,/object\/course_videos\//);assert.equal(opts.headers.Authorization,'Bearer test-only');
  if(opts.method==='POST'){stored=opts.body;return new Response('{}');}return new Response(stored);
 }});
 await p.write('checkpoints/lesson.mp4',Buffer.from('actual rendered bytes'));
});
