import test from 'node:test';
import assert from 'node:assert/strict';
import {assertGeneratedLessonAssessment} from './generated-lesson-assessment.mjs';
const questions = count => Array.from({length:count},(_,i)=>({id:'q'+i}));
test('lesson requires some multiple-choice recap questions, not exactly five',()=>{
 for(const count of [0,1])assert.throws(()=>assertGeneratedLessonAssessment({questions:questions(count),reassessment:questions(2)}),/MULTIPLE_QUESTIONS/);
 for(const count of [2,3,4,5,6])assert.doesNotThrow(()=>assertGeneratedLessonAssessment({questions:questions(count),reassessment:questions(2)}));
 for(const reassessment of [undefined,[],questions(1)])assert.throws(()=>assertGeneratedLessonAssessment({questions:questions(3),reassessment}),/REASSESSMENT/);
 assert.throws(()=>assertGeneratedLessonAssessment(null),/MULTIPLE_QUESTIONS/);
});
