import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toQuizQuestion,
  collectCourseQuestions,
  assessmentLessonTitle,
  ensureCourseAssessmentLesson,
} from '../../lib/ultimate-course-builder/release/course-assessment-lesson.mjs';

const lesson = (checks, id = 'lesson-1') => ({
  id,
  lesson_type: 'lesson',
  content_json: { experience: { knowledgeChecks: checks } },
});

test('normalizes an authored knowledgeCheck into the QuizPlayer shape', () => {
  assert.deepEqual(
    toQuizQuestion({ id: 'q1', prompt: 'Pick one', choices: ['a', 'b', 'c'], correct: 1 }, 1),
    { id: 'q1', question: 'Pick one', options: ['a', 'b', 'c'], correctAnswer: 1 },
  );
  // Accepts the already-normalized question/options/correctAnswer shape too.
  assert.equal(
    toQuizQuestion({ question: 'Q', options: ['x', 'y'], correctAnswer: 0 }, 2).correctAnswer,
    0,
  );
  // Rejects unusable questions rather than defaulting the answer to index 0.
  assert.equal(toQuizQuestion({ prompt: 'no options', choices: [] }, 3), null);
  assert.equal(toQuizQuestion({ prompt: 'bad index', choices: ['a', 'b'], correct: 5 }, 4), null);
  assert.equal(toQuizQuestion(null, 5), null);
});

test('aggregates and de-duplicates questions across lessons', () => {
  const questions = collectCourseQuestions([
    lesson([{ id: 'q1', prompt: 'A', choices: ['1', '2'], correct: 0 }]),
    lesson(
      [
        { id: 'q1', prompt: 'A', choices: ['1', '2'], correct: 0 }, // duplicate id
        { id: 'q2', prompt: 'B', choices: ['1', '2'], correct: 1 },
      ],
      'lesson-2',
    ),
  ]);
  assert.equal(questions.length, 2);
  assert.deepEqual(questions.map((q) => q.id), ['q1', 'q2']);
});

test('creates one published final assessment lesson from the authored questions', async () => {
  const written = [];
  const db = {
    from(table) {
      const q = {
        select() { return q; },
        eq() { return q; },
        order() { return q; },
        limit() { return q; },
        then(resolve) {
          if (table === 'course_modules') return resolve({ data: [{ id: 'module-1', order_index: 1 }] });
          return resolve({
            data: [
              { id: 'l1', order_index: 1, lesson_type: 'lesson', content_json: { experience: { knowledgeChecks: [
                { id: 'q1', prompt: 'A', choices: ['1', '2'], correct: 0 },
                { id: 'q2', prompt: 'B', choices: ['1', '2'], correct: 1 },
                { id: 'q3', prompt: 'C', choices: ['1', '2'], correct: 0 },
                { id: 'q4', prompt: 'D', choices: ['1', '2'], correct: 1 },
                { id: 'q5', prompt: 'E', choices: ['1', '2'], correct: 0 },
              ] } } },
            ],
          });
        },
        maybeSingle() { return Promise.resolve({ data: null }); },
        upsert(row) { written.push(row); return Promise.resolve({ error: null }); },
      };
      return q;
    },
  };
  const result = await ensureCourseAssessmentLesson(db, { courseId: 'course-1', courseTitle: 'HVAC Basics' });
  assert.equal(result.created, true);
  assert.equal(result.questionCount, 5);
  assert.equal(written.length, 1);
  assert.equal(written[0].lesson_type, "exam");
  assert.equal(written[0].module_id, 'module-1');
  assert.equal(written[0].is_published, true);
  assert.equal(written[0].passing_score, 70);
  assert.equal(written[0].slug, 'course-assessment');
  assert.equal(written[0].order_index, 2);
  assert.equal(written[0].quiz_questions.length, 5);
  assert.equal(written[0].title, assessmentLessonTitle('HVAC Basics'));
});

test('skips a course that already has a graded assessment', async () => {
  let upserted = false;
  const db = {
    from(table) {
      const q = {
        select() { return q; },
        eq() { return q; },
        order() { return q; },
        limit() { return q; },
        then(resolve) {
          if (table === 'course_modules') return resolve({ data: [{ id: 'module-1' }] });
          return resolve({ data: [{ id: 'q1', lesson_type: 'exam', order_index: 9 }] });
        },
        upsert() { upserted = true; return Promise.resolve({ error: null }); },
      };
      return q;
    },
  };
  const result = await ensureCourseAssessmentLesson(db, { courseId: 'c', courseTitle: 'T' });
  assert.equal(result.skipped, true);
  assert.equal(upserted, false);
});

test('skips when there are too few authored questions to grade', async () => {
  const db = {
    from(table) {
      const q = {
        select() { return q; },
        eq() { return q; },
        order() { return q; },
        limit() { return q; },
        then(resolve) {
          if (table === 'course_modules') return resolve({ data: [{ id: 'module-1' }] });
          return resolve({ data: [lesson([
            { id: 'q1', prompt: 'A', choices: ['1', '2'], correct: 0 },
          ])] });
        },
        upsert() { throw new Error('must not write'); },
      };
      return q;
    },
  };
  const result = await ensureCourseAssessmentLesson(db, { courseId: 'c', courseTitle: 'T' });
  assert.equal(result.skipped, true);
  assert.equal(result.questionCount, 1);
});
