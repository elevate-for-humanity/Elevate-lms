import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalHash, credentialMatches, runLearnerTest, CHECKS, learnerSetupReady } from './learner-runthrough.mjs';
test('evidence hashes are stable across object ordering but change with lesson contents', () => {
  assert.equal(canonicalHash({b:2,a:[{z:1,x:3}]}), canonicalHash({a:[{x:3,z:1}],b:2}));
  assert.notEqual(canonicalHash({a:'old lesson'}),canonicalHash({a:'new lesson'}));
});
test('empty, absent, and mismatched runner credentials never authorize', () => {
  for(const [actual,expected] of [['',''],['abc',undefined],['wrong','secret'],['short','much-longer']]) assert.equal(credentialMatches(actual,expected),false);
  assert.equal(credentialMatches('same-secret','same-secret'),true);
});
test('runner rejects arbitrary target hosts before opening a browser or creating an account', async () => {
  await assert.rejects(runLearnerTest({}, {lmsUrl:'https://example.com',secret:'secret'}),/Canonical HTTPS LMS/);
  await assert.rejects(runLearnerTest({}, {lmsUrl:'http://app.elevateforhumanity.org',secret:'secret'}),/Canonical HTTPS LMS/);
});
test('runner rejects partial test contracts rather than returning fake passing observations', async () => {
  await assert.rejects(runLearnerTest({requiredChecks:['desktop']},{lmsUrl:'https://app.elevateforhumanity.org',secret:'secret'}),/Full learner contract/);
  await assert.rejects(runLearnerTest({requiredChecks:CHECKS},{lmsUrl:'https://app.elevateforhumanity.org',secret:'secret'}),/Missing lessonBuildId/);
});

test("learner readiness rejects a generic missing route and wrong credentials", () => {
 assert.equal(learnerSetupReady(404, null), false);
 assert.equal(learnerSetupReady(404, {error:"Not Found"}), false);
 assert.equal(learnerSetupReady(401, {error:"unauthorized"}), false);
 assert.equal(learnerSetupReady(404, {error:"Lesson not found"}), true);
});
