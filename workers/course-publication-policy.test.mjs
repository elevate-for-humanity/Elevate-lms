import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {createHash} from 'node:crypto';
const source=stripTypeScriptTypes(readFileSync(new URL('../lib/ultimate-course-builder/core/lesson-contract.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import[\s\S]*?;\n/gm,'').replace(/export /g,'');
const steps=['learning_objectives','natural_narration','lesson_film_render','finished_media_qa','credential_release'];
const {stepInputHash}=new Function('createHash','ULTIMATE_BUILD_STEPS','STORYBOARD_RENDER_PRODUCER',source+';return {stepInputHash};')(createHash,steps,'same-render-producer');
test('automatic publication preserves every legacy checkpoint input hash',()=>{
 const profile={id:'course:existing',publicationPolicy:'owner-review-required',title:'Saved course'};
 const automatic={...profile,publicationPolicy:'automatic-quality-verified'};
 const artifacts={learning_objectives:{objectives:['saved']}};
 for(const step of steps){
  assert.equal(stepInputHash(step,automatic,artifacts),stepInputHash(step,profile,artifacts));
 }
});
