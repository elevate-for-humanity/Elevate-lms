import test from 'node:test';
import assert from 'node:assert/strict';
import {generateTeachingPhoto} from '../../lib/ultimate-course-builder/adapters/google-teaching-photo.mjs';
test('transient image timeout retries before discarding lesson progress',async()=>{
 let calls=0,retries=0;
 const result=await generateTeachingPhoto('prompt',{env:{},delay:async()=>{retries++;},request:async()=>{
  calls++;
  if(calls===1)return {ok:true,json:async()=>({access_token:'token'})};
  if(calls===2)throw new DOMException('timed out','TimeoutError');
  return {ok:true,json:async()=>({candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:Buffer.from('photo').toString('base64')}}]}}]})};
 }});
 assert.equal(result.bytes.toString(),'photo');assert.equal(calls,3);assert.equal(retries,1);
});
test('persistent image timeout exhausts six attempts without a substitute',async()=>{
 let calls=0;
 await assert.rejects(generateTeachingPhoto('prompt',{env:{},delay:async()=>{},request:async()=>{
  if(++calls===1)return {ok:true,json:async()=>({access_token:'token'})};
  throw new DOMException('timed out','TimeoutError');
 }}),/timed out/);
 assert.equal(calls,7);
});
test('Google identity generates PNG illustrations without an external API key',async()=>{
 const calls=[];
 const result=await generateTeachingPhoto('Show the complete clean comb',{env:{},request:async(url,options)=>{
  calls.push({url,options});
  return calls.length===1?{ok:true,json:async()=>({access_token:'test-token'})}:{ok:true,json:async()=>({candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:Buffer.from('image bytes').toString('base64')}}]}}]})};
 }});
 assert.equal(result.provider,'google');
 assert.equal(calls[0].options.headers['Metadata-Flavor'],'Google');
 assert.equal(calls[1].options.headers.Authorization,'Bearer test-token');
 assert.equal(JSON.parse(calls[1].options.body).generationConfig.imageConfig.aspectRatio,'16:9');
 assert.equal(result.bytes.toString(),'image bytes');
});
test('blocked or missing generation never substitutes a diagram or unrelated stock',async()=>{
 let calls=0;
 await assert.rejects(generateTeachingPhoto('prompt',{env:{},delay:async()=>{},request:async()=>++calls===1?{ok:true,json:async()=>({access_token:'token'})}:{ok:true,json:async()=>({predictions:[]})}}),/MISSING_OR_FILTERED/);
});

test('JPEG and WebP responses retain their actual format instead of being reported missing',async()=>{
 for(const mimeType of ['image/jpeg','image/webp']){
  let calls=0;
  const result=await generateTeachingPhoto('prompt',{env:{},delay:async()=>{},request:async()=>++calls===1?{ok:true,json:async()=>({access_token:'token'})}:{ok:true,json:async()=>({candidates:[{content:{parts:[{inlineData:{mimeType,data:Buffer.from('supported image').toString('base64')}}]}}]})}});
  assert.equal(result.mimeType,mimeType);assert.equal(result.bytes.toString(),'supported image');
 }
});
