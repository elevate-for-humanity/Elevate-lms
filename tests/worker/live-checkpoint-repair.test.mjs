import {renderMediaUrl,renderPlaybackUrl} from '../../lib/ultimate-course-builder/media/playback-source.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const steps=['standards_lock','instructor_script','lesson_film_render','finished_media_qa','credential_release'];
const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/worker/live-checkpoint-repair.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import .*;\n/gm,'').replace(/export /g,'');
const {checkpointRepairPayload,liveCheckpointRepairReader}=new Function('ULTIMATE_BUILD_STEPS',source+';return {checkpointRepairPayload,liveCheckpointRepairReader};')(steps);
test('separate repairs survive and repeated requests preserve the earliest dependent producer',()=>{
 const first=checkpointRepairPayload({payload:{nextCompetencyIndex:4,kept:true}},{competencyId:'a',fromStep:'instructor_script'},2);
 const next=checkpointRepairPayload({pending_dependency_resume:first},{competencyId:'a',fromStep:'finished_media_qa'},2);
 const last=checkpointRepairPayload({pending_dependency_resume:next},{competencyId:'b',fromStep:'lesson_film_render'},3);
 assert.equal(last.nextCompetencyIndex,2);assert.equal(last.kept,true);assert.equal(last.pendingCheckpointRepairs.a.fromStep,'instructor_script');assert.ok(last.pendingCheckpointRepairs.b);
});
test('a future checkpoint repair is consumed only when reached; no active stage is interrupted',async()=>{
 let pending={pendingCheckpointRepairs:{a:{competencyId:'a',fromStep:'finished_media_qa'}}};let mutations=0;const filters=[];
 const db={from:()=>{let mutation;const q={select:()=>q,eq:(...args)=>{filters.push(args);return q;},single:async()=>({data:{pending_dependency_resume:pending}}),update:v=>{mutation=v;return q;},then:resolve=>{if(mutation){mutations++;pending=mutation.pending_dependency_resume;}resolve({data:[{id:'j'}]});}};return q;}};
 const reader=liveCheckpointRepairReader(db,{id:'j'},'worker',7,{},'a');
 assert.equal(await reader('lesson_film_render'),null);assert.equal(mutations,0);
 assert.equal(await reader('finished_media_qa'),'finished_media_qa');assert.equal(mutations,1);assert.equal(pending,null);
 assert.equal(await reader('credential_release'),null);assert.ok(filters.some(([k,v])=>k==='execution_generation'&&v===7));
});
test('preview exposes instruction without returning internal media credentials or QA assertions',()=>{
 const previewSource=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/core/lesson-preview.ts',import.meta.url),'utf8'),{mode:'transform'}).replace(/^import .*;\n/gm,'').replace(/export /g,'');
 const preview=new Function('renderMediaUrl','renderPlaybackUrl',previewSource+';return lessonPreview;')(renderMediaUrl,renderPlaybackUrl)({learning_objectives:{objectives:[{text:'Learn sanitation'}]},instructor_script:{script:{segments:[{id:'s',text:'Wash hands'}]}},storyboard:{storyboard:{scenes:[{id:'s',dialogue:'Demonstrate sanitation',visualRequirement:'Clean workstation'}]}},secret:'never',finished_media_qa:{pass:true}});
 assert.equal(preview.segments[0].text,'Wash hands');assert.equal(preview.scenes[0].narration,'Demonstrate sanitation');assert.equal(preview.secret,undefined);assert.equal(preview.pass,undefined);
});
