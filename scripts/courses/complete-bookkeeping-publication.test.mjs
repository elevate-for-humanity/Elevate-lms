import test from 'node:test';
import assert from 'node:assert/strict';
import {publicationReady,TARGET} from './complete-bookkeeping-publication.mjs';
import {finalQuestions} from '../../data/courses/intuit-bookkeeping-assessment.mjs';
function fixture(){
 const keys=[...Array.from({length:16},(_,i)=>'competency-'+i),'icbp-capstone'];
 const canonicalLessonIds=Object.fromEntries(keys.map((k,i)=>[k,'lesson-'+i]));
 const course={id:TARGET.course,status:'published',is_active:true,metadata:{sourceVersion:TARGET.version,finalAssessmentLessonId:'final'}};
 const build={id:TARGET.build,course_id:TARGET.course,status:'published',profile:{canonicalLessonIds}};
 const lessons=keys.map((k,i)=>({id:'lesson-'+i,status:'published',is_published:true,video_status:'complete',media_quality_status:'approved',video_url:'https://media.example/lesson-'+i,source_build:TARGET.build,contract_version:'contract-v1',practical_required:k==='icbp-capstone',requires_instructor_signoff:k==='icbp-capstone'}));
 lessons.push({id:'final',lesson_type:'quiz',order_index:18,passing_score:80,quiz_questions:structuredClone(finalQuestions)});
 return {course,build,lessons};
}
test('verified instructional release unlocks the original cumulative final',()=>assert.equal(publicationReady(fixture()).id,'final'));
test('a running build or any unfinished video cannot unlock publication',()=>{
 const f=fixture();f.build.status='running';assert.equal(publicationReady(f),null);
 f.build.status='published';f.lessons[0].media_quality_status='unverified';assert.equal(publicationReady(f),null);
});
test('another build cannot supply the media publication evidence',()=>{const f=fixture();f.lessons[0].source_build='other';assert.equal(publicationReady(f),null);});
test('a missing practical signoff gate is rejected rather than waived',()=>{const f=fixture();f.lessons[16].requires_instructor_signoff=false;assert.throws(()=>publicationReady(f),/PRACTICAL_EVIDENCE_GATE_MISSING/);});
test('invalid final answers or missing exam domains cannot publish',()=>{
 const f=fixture();f.lessons[17].quiz_questions[0].correctAnswer=4;assert.throws(()=>publicationReady(f),/FINAL_QUESTION_INVALID/);
 f.lessons[17].quiz_questions=structuredClone(finalQuestions).map(q=>({...q,domain:'1'}));assert.throws(()=>publicationReady(f),/FINAL_NOT_CUMULATIVE/);
});
test('unknown courses and a mismatched lesson structure cannot publish',()=>{
 const f=fixture();f.course.id='other';assert.throws(()=>publicationReady(f),/UNEXPECTED_COURSE_SOURCE/);
 f.course.id=TARGET.course;f.lessons.pop();assert.throws(()=>publicationReady(f),/COURSE_STRUCTURE_INVALID/);
});
