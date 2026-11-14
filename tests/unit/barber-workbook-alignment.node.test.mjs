import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { workbookLessonHref, workbookInstructions, workbookInstructionAnchor } from '../../lib/lms/workbook-lesson-links.ts';

const data = JSON.parse(readFileSync(new URL('../../data/curriculum/barber-workbook-alignment.json', import.meta.url)));

test('all 50 workbook sections have distinct instructional destinations, including the 32 former gaps', () => {
  assert.equal(data.sections.length, 50);
  assert.equal(data.sections.filter((s) => !s.previous_lesson_id).length, 32);
  assert.equal(new Set(data.sections.map((s) => s.section_id)).size, 50);
  const urls = data.sections.map((s) => workbookLessonHref({ id: s.section_id, course_id: data.course_id, lesson_id: s.lesson_id }, data.workbook_slug));
  assert.equal(new Set(urls).size, 50);
  assert.ok(urls.every((url) => url?.includes('#workbook-instruction-')));
  assert.deepEqual(data.sections.map((s) => s.section_number), Array.from({ length: 50 }, (_, i) => i + 1));
  assert.ok(data.sections.filter((s) => s.previous_lesson_id).every((s) => s.previous_lesson_id === s.lesson_id));
});

test('each destination includes specific teaching, a worked example, three prompts and a recap', () => {
  assert.equal(workbookInstructions(data.sections).length, 50);
  assert.equal(new Set(data.sections.map((s) => s.teaching)).size, 50);
  assert.equal(new Set(data.sections.map((s) => s.example)).size, 50);
  for (const s of data.sections) {
    assert.ok(s.teaching.split(/\s+/).length >= 50, `Section ${s.section_number}: teaching too short`);
    assert.ok(s.example.split(/\s+/).length >= 15);
    assert.equal(s.prompts.length, 3);
    assert.ok(s.prompts.every((p) => p.length >= 40));
    assert.ok(s.recap.length > 20);
  }
  assert.deepEqual(workbookInstructions([{type:'workbook_instruction', section_id:'invalid'}]), []);
});

test('non-barber and unlinked sections retain their established link behavior', () => {
  const section = { id:'abc', course_id:'course', lesson_id:'lesson' };
  assert.equal(workbookLessonHref(section, 'another-workbook'), '/lms/courses/course/lessons/lesson');
  assert.equal(workbookLessonHref({ ...section, lesson_id:null }, data.workbook_slug), null);
  assert.equal(workbookInstructionAnchor('abc'), 'workbook-instruction-abc');
});
