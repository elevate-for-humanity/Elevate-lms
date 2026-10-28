import test from 'node:test';
import assert from 'node:assert/strict';
import {sha,stable,validateReview} from './promote-reviewed-cosmetology-media.mjs';
import {SOURCE_SHA} from './repair-preserved-cosmetology-motion.mjs';
const courseId='a6b0b712-1cf0-475a-ba79-ee2023dea8ec',lessonId='0811f5b7-eeff-428e-bad1-bfa78a791998';
function inputs(){
 const sourceUrl='https://example.invalid/existing',candidateMediaSha256='c'.repeat(64),audioSha256='d'.repeat(64);
 const lesson={id:lessonId,course_id:courseId,status:'published',is_published:true,video_status:'complete',media_quality_status:'unverified',video_url:sourceUrl,content_json:{manualProduction:true,film:{url:sourceUrl}},quiz_questions:[{id:'existing-question',answerIndex:1}],learning_objectives:['existing-objective'],script_text:'existing recording reference'};
 const review={courseId,lessonId,sourceUrl,sourceMediaSha256:SOURCE_SHA,candidateMediaSha256,audioSha256,pass:true,learnerPlaybackVerified:false,reviewMode:'measured-bounded-manual-repair',assessmentSha256:sha(stable(lesson.quiz_questions)),objectivesSha256:sha(stable(lesson.learning_objectives)),canonicalScriptSha256:sha(lesson.script_text)};
 const report={sourceMediaSha256:SOURCE_SHA,candidateMediaSha256,identicalNarrationBytes:true,originalAudioSha:audioSha256,candidateAudioSha:audioSha256};
 return {review,report,speech:{mediaSha256:SOURCE_SHA},lesson};
}
test('review scope cannot promote a different lesson, source, candidate, or recording',()=>{
 const original=inputs();assert.equal(validateReview(original.review,original.report,original.speech,original.lesson),true);
 for(const [key,value]of Object.entries({courseId:'other',lessonId:'other',pass:false,learnerPlaybackVerified:true,sourceMediaSha256:'0'.repeat(64),candidateMediaSha256:'bad'})){
 const x=inputs();x.review={...x.review,[key]:value};assert.throws(()=>validateReview(x.review,x.report,x.speech,x.lesson));
 }
 const x=inputs();x.report.candidateAudioSha='0'.repeat(64);assert.throws(()=>validateReview(x.review,x.report,x.speech,x.lesson));
});
test('concurrent instruction, assessment, publication and source changes reject the repair',()=>{
 for(const change of [{quiz_questions:[{id:'changed'}]},{learning_objectives:['changed']},{script_text:'changed'},{video_url:'other'},{status:'draft'},{is_published:false},{media_quality_status:'approved'}]){
 const x=inputs();x.lesson={...x.lesson,...change};assert.throws(()=>validateReview(x.review,x.report,x.speech,x.lesson));
 }
});
