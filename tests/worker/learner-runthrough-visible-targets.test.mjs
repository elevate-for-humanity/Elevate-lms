import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../services/studio-browser/learner-runthrough.mjs', import.meta.url), 'utf8');
test('staged learner browser checks scope media and controls to visible elements', () => {
  assert.match(source, /page\.locator\('video:visible'\)\.first\(\)/);
  assert.match(source, /getByTestId\('staged-lesson'\)\.filter\(\{ visible: true \}\)\.first\(\)/);
  assert.match(source, /getByTestId\('scenario'\)\.filter\(\{ visible: true \}\)\.first\(\)/);
  assert.match(source, /\.getByTestId\(type\)\s*\.filter\(\{ visible: true \}\)/);
});
