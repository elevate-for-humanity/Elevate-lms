import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveLmsHost } from '../../lib/routing/lms-host.ts';
import { lessonKeyTerms } from '../../lib/lms/lesson-key-terms.ts';

test('LMS menus prefer the deployed owner and repair the retired production alias', () => {
  assert.equal(resolveLmsHost(), 'https://lms.elevateforhumanity.org');
  assert.equal(resolveLmsHost(undefined, 'https://app.elevateforhumanity.org/'), 'https://lms.elevateforhumanity.org');
  assert.equal(resolveLmsHost('https://lms.elevateforhumanity.org/', 'https://app.elevateforhumanity.org'), 'https://lms.elevateforhumanity.org');
  assert.equal(resolveLmsHost('http://localhost:3002/'), 'http://localhost:3002');
  assert.equal(resolveLmsHost(undefined, 'https://preview.example.org/'), 'https://preview.example.org');
});

test('structured definitions remain readable and plain terms remain supported', () => {
  assert.deepEqual(lessonKeyTerms([
    { term: ' Clipper guard ', definition: ' Controls retained length. ', internal: 'not learner content' },
    ' Sanitation ', null, 42, {}, { definition: 'No term' }, ['unexpected'], '',
  ]), [
    { term: 'Clipper guard', definition: 'Controls retained length.' },
    { term: 'Sanitation', definition: '' },
  ]);
  assert.deepEqual(lessonKeyTerms(null), []);
});
