import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCourseAssessments } from '../../lib/ultimate-course-builder/instructional/owner-approved-reference.mjs';

const question = (i) => ({ prompt: 'Question ' + i, options: ['Yes', 'No'], correctAnswer: 0 });
const chapter = (i) => ({ id: 'chapter-' + i, recap: { questions: Array.from({ length: 5 }, (_, n) => question(n)) } });
const finalExam = { cumulative: true, questions: Array.from({ length: 25 }, (_, n) => question(n)) };

test('each chapter requires a multiple-choice recap and the course has a final exam', () => {
  assert.deepEqual(validateCourseAssessments({ chapters: [chapter(1), chapter(2)], finalExam }), {
    chapterRecaps: 2, finalExamQuestions: 25, finalExamPosition: 'after-last-chapter',
  });
});

test('rejects missing chapter recap', () => {
  assert.throws(() => validateCourseAssessments({ chapters: [{ id: 'chapter-1' }], finalExam }), /CHAPTER_RECAP_REQUIRED/);
});

test('rejects incomplete cumulative final', () => {
  assert.throws(() => validateCourseAssessments({ chapters: [chapter(1)], finalExam: { ...finalExam, cumulative: false } }), /FULL_COURSE_CUMULATIVE_FINAL_REQUIRED/);
});
