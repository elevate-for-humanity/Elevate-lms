import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/persistence/fenced-persistence.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import .*;\n/gm,'').replace('export class ','class ');
const Persistence=new Function('UltimateSupabasePersistence','setTimeout',source+';return UltimateFencedPersistence;')(class{},fn=>{fn();return 0;});
function fixture(errors){const calls=[];return {calls,persistence:new Persistence({rpc:async(name,args)=>{calls.push({name,args:structuredClone(args)});return {data:{ok:true,id:'lesson'},error:errors.shift()??null};}},'job','worker',7)};}
test('transient metadata update retries identical input under the same database fence',async()=>{
 const f=fixture([{message:'AbortError: operation aborted'},{code:'57014',message:'canceling statement due to statement timeout'}]);
 await f.persistence.updateBuild({buildId:'build',status:'running',currentStep:'lesson_film_render'});
 assert.equal(f.calls.length,3);for(const call of f.calls)assert.deepEqual(call,f.calls[0]);
 assert.equal(f.calls[0].args.p_generation,7);
});
test('metadata retry budget is bounded and retains the final database error',async()=>{
 const f=fixture(Array(4).fill({message:'fetch failed'}));
 await assert.rejects(f.persistence.updateBuild({buildId:'build',status:'running'}),/ULTIMATE_FENCED_WRITE_FAILED:update_build:fetch failed/);
 assert.equal(f.calls.length,3);
});
test('lease rejection or non-transient errors never retry metadata writes',async()=>{
 for(const error of [{code:'42501',message:'ULTIMATE_JOB_LEASE_LOST'},{message:'permission denied'},{message:'invalid status'}]){
  const f=fixture([error]);await assert.rejects(f.persistence.updateBuild({buildId:'build'}));assert.equal(f.calls.length,1);
 }
});
test('creation, findings, artifacts and lesson completion are never replayed after ambiguous timeout',async()=>{
 for(const method of ['createLesson','recordStep','saveArtifact','recordFinding','finishLesson']){
  const f=fixture([{message:'AbortError: operation aborted'}]);
  await assert.rejects(f.persistence[method]({buildId:'build',lessonBuildId:'lesson'}),/ULTIMATE_FENCED_WRITE_FAILED/);assert.equal(f.calls.length,1);
 }
});
