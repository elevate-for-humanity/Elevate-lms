import { test } from 'node:test';
import assert from 'node:assert/strict';
import { programImageAssignments, sharedProgramImages } from './program-image-assignments.mjs';
test('same program identity photo is allowed; separate program duplication is detected', () => {
  const source = "export const PROGRAM_IMAGES = { a: {card:'/images/a.webp',hero:'/images/a.webp'}, b:{card:'/images/b.webp',hero:'/images/a.webp'} };";
  const assignments = programImageAssignments(source);
  assert.deepEqual(sharedProgramImages(assignments.filter(x => x.owner === 'a')), []);
  assert.deepEqual(sharedProgramImages(assignments), [{path:'/images/a.webp',owners:['a','b']}]);
});
