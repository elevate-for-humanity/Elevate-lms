import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APPROVED_LESSON_EXAMPLE, verifyNewCourseAssessmentContract,
  createLessonProductionRequest,
} from '../../lib/ultimate-course-builder/instructional/new-course-contract.mjs';

const q=(i)=>({question:'Question '+i,choices:['First','Second','Third','Fourth'],correctAnswer:1});
test('reference identifies the actual owner-approved cosmetology video, not barber',()=>{
  assert.equal(APPROVED_LESSON_EXAMPLE.sourceLessonId,'e1e53bfd-2504-46b0-a814-a31c74a0090a');
  assert.equal(APPROVED_LESSON_EXAMPLE.video.width,1920);
  assert.equal(APPROVED_LESSON_EXAMPLE.observedProduction.narrationSegments,13);
});
test('every chapter has multiple-choice recap and full course has a cumulative final',()=>{
  const course={chapters:[{id:'one',recapQuestions:Array.from({length:5},(_,i)=>q(i))},
    {id:'two',recapQuestions:Array.from({length:5},(_,i)=>q(i))}],
  finalExam:{position:'after-last-chapter',cumulative:true,
    questions:Array.from({length:25},(_,i)=>q(i))}};
  assert.deepEqual(verifyNewCourseAssessmentContract(course),{
    passed:true,chapters:2,recaps:2,finalQuestions:25,
  });
  assert.throws(()=>verifyNewCourseAssessmentContract({...course,
    chapters:[{id:'one',recapQuestions:[]}]}),/CHAPTER_MULTIPLE_CHOICE_RECAP_REQUIRED/);
  assert.throws(()=>verifyNewCourseAssessmentContract({...course,
    finalExam:{...course.finalExam,cumulative:false}}),/CUMULATIVE_FINAL_EXAM_REQUIRED/);
});
test('lesson production requires independent relevant assets and aligned narration',()=>{
  const req=createLessonProductionRequest({courseId:'new',lessonId:'chapter-1',
    scenes:[{assetId:'asset-1',relevanceReason:'Matches teaching'}],
    narration:[{text:'Narration',audioUrl:'https://example.com/audio.mp3'}],
    captionsUrl:'https://example.com/captions.vtt',transcriptUrl:'https://example.com/transcript.txt'});
  assert.equal(req.courseId,'new');
  assert.equal(req.imageLayout.fit,'contain');
  assert.throws(()=>createLessonProductionRequest({...req,scenes:[]}),/COURSE_PRODUCTION_INPUT_INCOMPLETE/);
});
