import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {describeWorkerError,optionalStorageCacheMiss} from '../lib/ultimate-course-builder/core/worker-error.mjs';
test('provider errors retain hidden messages across realms',()=>{
 const error=vm.runInNewContext('new Error("render provider timeout")');
 assert.equal(JSON.stringify(error),'{}');
 assert.match(describeWorkerError(error),/render provider timeout/);
});
test('plain provider details and nested causes survive',()=>{
 assert.match(describeWorkerError({code:'503',details:'temporarily unavailable'}),/503.*temporarily unavailable/);
 assert.match(describeWorkerError(new Error('render failed',{cause:new Error('connection reset')})),/connection reset/);
});
test('empty and circular errors remain diagnosable',()=>{
 assert.notEqual(describeWorkerError({}),'{}');
 const error={};error.cause=error;
 assert.match(describeWorkerError(error),/CIRCULAR_WORKER_ERROR/);
});
test('Supabase storage errors retain the nested HTTP failure behind an empty JSON message',()=>{
 const error = vm.runInNewContext('Object.assign(new Error("{}"), {originalError:{status:503,statusCode:503}})');
 assert.match(describeWorkerError(error),/originalError=status=503:statusCode=503/);
});
test('the original HTTP Response retains its status text without serializing headers',()=>{
 const detail=describeWorkerError({originalError:new Response('',{status:503,statusText:'Service Unavailable',headers:{Authorization:'private-fixture'}})});
 assert.match(detail,/status=503:statusText=Service Unavailable/);assert.doesNotMatch(detail,/private-fixture|Authorization/);
});
test('only optional deterministic photo cache misses accept nested storage 400/404 responses',()=>{
 assert.equal(optionalStorageCacheMiss({originalError:new Response('',{status:400,statusText:'Bad Request'})}),true);
 assert.equal(optionalStorageCacheMiss({statusCode:'404',message:'Object not found'}),true);
 assert.equal(optionalStorageCacheMiss({status:403,message:'Forbidden'}),false);
 assert.equal(optionalStorageCacheMiss({status:400,message:'JWT signature invalid'}),false);
 assert.equal(optionalStorageCacheMiss({status:503,message:'Service unavailable'}),false);
});
test('photo preparation records the failing scene and cue while retaining licensing error codes',async()=>{
 const source=stripTypeScriptTypes(readFileSync(new URL('../lib/ultimate-course-builder/adapters/teaching-photos.ts',import.meta.url),'utf8'),{mode:'transform'})
  .replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm,'').replaceAll('export ','');
 for(const licensing of [false,true]) {
  const original=licensing?new Error('LICENSE_APPROVAL_REQUIRED'):Object.assign(new Error('{}'),{originalError:{status:503}});
  const prepare=new Function('approvedReferencePhotoPicker','courseProgressSignal','courseSelectedStill','describeWorkerError',source+';return prepareTeachingPhotos;')(
   async()=>null,()=>null,async()=>{throw original;},describeWorkerError);
  const q={select(){return this;},eq(){return this;},limit:async()=>({data:[],error:null})};
  await assert.rejects(prepare({lessonPresentation:'approved-premium-v1',artifacts:{storyboard:{storyboard:{scenes:[{
   id:'scene-19',recapText:'Fresh recap',teachingVisual:{steps:[{narrationQuote:'Use clean tools'}]},
  }]}}}},{from:()=>q}),error=>{
   assert.match(error.message,/scene=scene-19:cue=0/);
   assert.match(error.message,licensing?/^LICENSE_APPROVAL_REQUIRED:/:/originalError=status=503/);
   assert.equal(error.cause,original);return true;
  });
 }
});
