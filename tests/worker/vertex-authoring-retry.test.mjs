import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {parseVertexLessonResponse,vertexLessonGenerationConfig} from '../../lib/ultimate-course-builder/instructional/vertex-response.mjs';
const file=readFileSync(new URL('../../lib/ultimate-course-builder/instructional/google-lesson-author.ts',import.meta.url),'utf8');
const source=stripTypeScriptTypes(file.slice(file.indexOf('export async function generateVertexLessonJson'))).replace('export async function','async function');
function fixture(reasons){
 const requests=[],progress=[];
 const fetch=async(url,options)=>{
  if(String(url).startsWith('http://metadata.'))return {ok:true,json:async()=>({access_token:'unit-test-identity'})};
  requests.push(JSON.parse(options.body));
  const finishReason=reasons.shift()??'STOP';
  return {ok:true,status:200,json:async()=>({candidates:[{finishReason,content:{parts:[{text:'{"complete":true}'}]}}]})};
 };
 const run=new Function('fetch','process','courseProgressSignal','reportCourseProgress','parseVertexLessonResponse','vertexLessonGenerationConfig',source+'\nreturn generateVertexLessonJson;')(
  fetch,{env:{GOOGLE_CLOUD_PROJECT:'test-project'}},()=>undefined,(...args)=>progress.push(args),parseVertexLessonResponse,vertexLessonGenerationConfig);
 return {requests,progress,run:()=>run('gemini-3.8-flash','Return complete JSON',{lesson:'test'},'us')};
}
test('truncated JSON gets a bounded larger output budget without accepting the truncated answer',async()=>{
 const f=fixture(['MAX_TOKENS','STOP']);assert.deepEqual(await f.run(),{complete:true});
 assert.deepEqual(f.requests.map(r=>r.generationConfig.maxOutputTokens),[16384,32768]);
 assert.ok(f.requests.every(r=>r.generationConfig.responseMimeType==='application/json'&&r.generationConfig.thinkingConfig.thinkingLevel==='MEDIUM'&&!('temperature' in r.generationConfig)));
 assert.ok(f.progress.some(([phase])=>phase==='authoring:google-incomplete:MAX_TOKENS'));
});
test('provider safety or other non-truncation stops are surfaced without an identical request loop',async()=>{
 for(const reason of ['SAFETY','RECITATION','OTHER']){
  const f=fixture([reason]);await assert.rejects(f.run(),new RegExp('INCOMPLETE:'+reason));assert.equal(f.requests.length,1);
 }
});
test('repeated truncation stays within the existing three-attempt bound',async()=>{
 const f=fixture(['MAX_TOKENS','MAX_TOKENS','MAX_TOKENS']);
 await assert.rejects(f.run(),/INCOMPLETE:MAX_TOKENS/);assert.equal(f.requests.length,3);
 assert.deepEqual(f.requests.map(r=>r.generationConfig.maxOutputTokens),[16384,32768,32768]);
 assert.equal(vertexLessonGenerationConfig('gemini-2.5-flash').temperature,0.2);
 assert.equal(vertexLessonGenerationConfig('gemini-2.5-flash').thinkingConfig,undefined);
});
