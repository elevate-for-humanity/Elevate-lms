import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveSavedErrors } from '../../lib/ultimate-course-builder/persistence/saved-errors.mjs';

const captionFinding = {
  step: 'synchronization',
  severity: 'error',
  code: 'REPAIR_PRODUCER_UNCHANGED',
  message: 'REPAIR_PRODUCER_UNCHANGED:synchronization',
};

test('reads the failing-step finding, not only the (empty) lesson findings', () => {
  // Production shape: the lesson row has no findings; the failure lives on the
  // synchronization step. Before the fix this returned [], so the caption
  // recovery never fired and the media role exhausted its attempts.
  const steps = [
    { step: 'lesson_film_render', state: 'passed', findings: [] },
    { step: 'synchronization', state: 'failed', findings: [captionFinding] },
  ];
  const errors = deriveSavedErrors(steps, { findings: [] });
  assert.deepEqual(errors, [captionFinding]);
});

test('keeps lesson-level errors and de-duplicates overlapping findings', () => {
  const lessonLevel = { step: 'finished_media_qa', severity: 'error', code: 'X', message: 'X' };
  const steps = [
    { step: 'synchronization', state: 'failed', findings: [captionFinding] },
    { step: 'finished_media_qa', state: 'passed', findings: [] },
  ];
  const errors = deriveSavedErrors(steps, { findings: [captionFinding, lessonLevel] });
  // captionFinding appears once even though it is on both the step and the lesson.
  assert.equal(errors.length, 2);
  assert.ok(errors.some((f) => f.code === 'X'));
  assert.equal(errors.filter((f) => f.code === 'REPAIR_PRODUCER_UNCHANGED').length, 1);
});

test('ignores non-error findings and missing inputs', () => {
  const steps = [
    { step: 'a', state: 'failed', findings: [{ severity: 'warning', code: 'W' }] },
    { step: 'b', state: 'passed', findings: [{ severity: 'error', code: 'IGNORED_NOT_FAILED' }] },
  ];
  assert.deepEqual(deriveSavedErrors(steps, null), []);
  assert.deepEqual(deriveSavedErrors(null, null), []);
});
