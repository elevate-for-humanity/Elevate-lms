import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publishApprovedCourses, startApprovedSuccessors } from './approved-course-publication.mjs';
const build = () => ({ id: 'build', status: 'built', profile: { title: 'Course', mediaAcquisitionOwnerId: 'owner',
  releaseAuthorization: { mode: 'publish-after-validation', actorId: 'owner', approvedAt: '2026-10-14T04:41:00Z' } } });
function harness(builds, overrides = {}) {
  const events = [];
  return { events, input: { builds, publish: async () => { events.push('publish'); },
    verify: async () => { events.push('verify'); return true; }, acknowledge: async () => { events.push('acknowledge'); }, ...overrides } };
}
test('only complete owner-authorized courses reach the canonical publisher', async () => {
  const h = harness(['running', 'failed', 'queued', 'published'].map(status => ({ ...build(), status })).concat([
    { ...build(), activeJob: true }, { ...build(), profile: {} }, { ...build(), profile: { ...build().profile, mediaAcquisitionOwnerId: 'someone-else' } }, build()]));
  assert.deepEqual(await publishApprovedCourses(h.input), [{ title: 'Course', status: 'published' }]);
  assert.deepEqual(h.events, ['publish', 'verify', 'acknowledge']);
});
test('canonical QA rejection never acknowledges completion', async () => {
  const h = harness([build()], { publish: async () => { throw Error('QA_FAILED'); } });
  await assert.rejects(publishApprovedCourses(h.input), /QA_FAILED/); assert.deepEqual(h.events, []);
});
test('failed publication readback leaves completion unacknowledged', async () => {
  const h = harness([build()], { verify: async () => false });
  await assert.rejects(publishApprovedCourses(h.input), /READBACK_FAILED/); assert.deepEqual(h.events, ['publish']);
});
test('invalid authorization time is rejected', async () => {
  const b = build(); b.profile.releaseAuthorization.approvedAt = 'invalid';
  const h = harness([b]); assert.deepEqual(await publishApprovedCourses(h.input), []); assert.deepEqual(h.events, []);
});
test('next course stays stopped until the preceding course is released', async () => {
  const b = build(); b.status = 'blocked'; b.profile.releaseAuthorization.startAfterCourseId = 'previous';
  b.job = { status: 'failed', last_error: 'WAITING_FOR_CORRECTED_COMPLETE_LESSON_WORKER' };
  let queued = 0;
  const input = { builds: [b], dependencyReleased: async () => false, enqueue: async () => { queued++; } };
  assert.deepEqual(await startApprovedSuccessors(input), []); assert.equal(queued, 0);
  input.dependencyReleased = async () => true;
  assert.deepEqual(await startApprovedSuccessors(input), [{ title: 'Course', status: 'queued' }]); assert.equal(queued, 1);
  b.job.last_error = 'MISSING_LICENSED_ASSET';
  assert.deepEqual(await startApprovedSuccessors(input), []); assert.equal(queued, 1);
});
