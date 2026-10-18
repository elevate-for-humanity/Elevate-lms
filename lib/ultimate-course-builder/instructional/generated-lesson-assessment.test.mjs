import test from 'node:test';
import assert from 'node:assert/strict';
import {assertGeneratedLessonAssessment} from './generated-lesson-assessment.mjs';
const questions = count => Array.from({length:count},(_,i)=>({id:'q'+i}));
test('new lesson acceptance requires five recap questions and a separate reassessment',()=>{
 for(const count of [0,3,4,6])assert.throws(()=>assertGeneratedLessonAssessment({questions:questions(count),reassessment:questions(2)}),/FIVE_QUESTION/);
 for(const reassessment of [undefined,[],questions(1)])assert.throws(()=>assertGeneratedLessonAssessment({questions:questions(5),reassessment}),/REASSESSMENT/);
 assert.doesNotThrow(()=>assertGeneratedLessonAssessment({questions:questions(5),reassessment:questions(2)}));
 assert.throws(()=>assertGeneratedLessonAssessment(null),/FIVE_QUESTION/);
});
