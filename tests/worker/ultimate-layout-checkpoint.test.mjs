import {deriveSavedErrors} from '../../lib/ultimate-course-builder/persistence/saved-errors.mjs';
import test from 'node:test';
import {deriveSavedErrors} from '../../lib/ultimate-course-builder/persistence/saved-errors.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {measuredNarrationRepair} from '../../lib/ultimate-course-builder/instructional/narration-checkpoint-repair.mjs';
import {recoverCaptionCoverageInspection} from '../../lib/ultimate-course-builder/instructional/caption-coverage-repair.mjs';
import {instructionView,recoverTeachingVisibilityRepair} from '../../lib/ultimate-course-builder/core/repair-policy.mjs';
import {inheritCourseProductionPolicy} from '../../lib/ultimate-course-builder/core/production-policy.mjs';
const text=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/persistence/supabase-persistence.ts',import.meta.url),'utf8'),{mode:'transform'})
 .replace(/^import .*;\n/gm,'').replace('export class ','class ');
const Persistence=new Function('currentEvidence','ULTIMATE_BUILD_STEPS','MIN_LESSON_VIDEO_SCENES','measuredNarrationRepair','recoverCaptionCoverageInspection','instructionView','recoverTeachingVisibilityRepair','inheritCourseProductionPolicy','deriveSavedErrors',text+'\nreturn UltimateSupabasePersistence;')(
 ()=>true,['standards_lock','lesson_film_render','finished_media_qa'],1,measuredNarrationRepair,recoverCaptionCoverageInspection,instructionView,recoverTeachingVisibilityRepair,inheritCourseProductionPolicy,deriveSavedErrors);
function db(layoutVersion){return {from:table=>{
 const value=table==='ultimate_lesson_builds'?{artifacts:{lesson_film_render:{render:{layoutVersion}}},findings:[]}:
  ['standards_lock','lesson_film_render','finished_media_qa'].map(step=>({step,state:'passed',artifacts:step==='lesson_film_render'?{render:{layoutVersion}}:{}}));
 const query={select:()=>query,eq:()=>query,single:async()=>({data:value}),then:resolve=>resolve({data:value})};return query;
}};}
test('current premium and legacy layouts retain accepted render checkpoints',async()=>{
 for(const version of [2,4]){const result=await new Persistence(db(version)).loadLessonCheckpoint({lessonBuildId:'lesson'});
  assert.deepEqual(result.passedSteps,['standards_lock','lesson_film_render','finished_media_qa']);}
});
test('obsolete layouts still invalidate rendered media and later checks',async()=>{
 const result=await new Persistence(db(1)).loadLessonCheckpoint({lessonBuildId:'lesson'}); assert.deepEqual(result.passedSteps,['standards_lock']);
});
