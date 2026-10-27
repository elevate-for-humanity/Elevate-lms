import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {checkpointPreviewArtifacts} from '../../lib/ultimate-course-builder/core/checkpoint-preview.mjs';
import {renderMediaUrl,renderPlaybackUrl} from '../../lib/ultimate-course-builder/media/playback-source.mjs';
const source=stripTypeScriptTypes(readFileSync(new URL('../../lib/ultimate-course-builder/core/lesson-preview.ts',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace('export function ','function ');
const preview=new Function('renderMediaUrl','renderPlaybackUrl',source+';return lessonPreview;')(renderMediaUrl,renderPlaybackUrl);
test('projected checkpoint retains lesson teaching, quiz, media and QA while dropping producer evidence',()=>{
 const row={preview_objectives:[{text:'Disinfect tools'}],preview_assessment:{questions:[{id:'q',prompt:'Which disinfectant?'}],passingScore:80},preview_script:{script:'Full teaching',segments:[{title:'Tools',text:'Actual instruction'}]},preview_scenes:[{title:'Example',dialogue:'Demonstration',visualRequirement:'Tools',recapText:'Summary'}],preview_video_url:'https://media.example/lesson.mp4',preview_media_approved:true,artifacts:{massiveCertificates:'discard'}};
 const projected=checkpointPreviewArtifacts(row);const actual=preview(projected);
 assert.equal(actual.videoUrl,row.preview_video_url);assert.equal(actual.mediaApproved,true);
 assert.deepEqual(actual.objectives,['Disinfect tools']);assert.equal(actual.assessment.questions.length,1);
 assert.equal(actual.script,'Full teaching');assert.equal(actual.segments[0].text,'Actual instruction');assert.equal(actual.scenes[0].recap,'Summary');
 assert.equal(JSON.stringify(projected).includes('discard'),false);
});
test('missing projected media never fabricates a completed lesson',()=>{
 const result=preview(checkpointPreviewArtifacts({}));assert.equal(result.videoUrl,null);assert.equal(result.mediaApproved,false);assert.equal(result.assessment,null);
});
