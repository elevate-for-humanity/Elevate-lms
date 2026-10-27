import test from 'node:test';
import assert from 'node:assert/strict';
import { renderConcurrency } from './render-concurrency.mjs';

test('a large host cannot fan out an unbounded number of renderers', () => {
  assert.equal(renderConcurrency('', 64), 2);
  assert.equal(renderConcurrency('4', 64), 4);
  assert.equal(renderConcurrency('4', 1), 1);
});
test('invalid or oversized render configuration fails before rendering', () => {
  for (const value of ['0', '128', '-1', '2.5', 'auto']) {
    assert.throws(() => renderConcurrency(value, 64), /MUST_BE_1_TO_4/);
  }
});
