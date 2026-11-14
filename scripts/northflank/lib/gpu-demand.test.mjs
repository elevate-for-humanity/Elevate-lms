import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizedVideoJobIds,
  eligibleAuthorizedVideoJobs,
  generationIsPaused,
} from './gpu-demand.mjs';

const now = Date.parse('2026-09-14T04:00:00.000Z');

test('old queue rows cannot authorize GPU capacity', () => {
  const ids = authorizedVideoJobIds([], { nowMs: now });
  const jobs = eligibleAuthorizedVideoJobs(
    [{ id: 'old', status: 'queued', dead_lettered_at: null }],
    ids,
  );
  assert.equal(jobs.length, 0);
});

test('a recent explicit lesson-video approval authorizes only its job', () => {
  const ids = authorizedVideoJobIds(
    [
      {
        job_id: 'approved',
        operation: 'lesson-video',
        status: 'approved',
        approved_at: '2026-09-14T03:55:00.000Z',
      },
      {
        job_id: 'wrong-operation',
        operation: 'course-blueprint',
        status: 'approved',
        approved_at: '2026-09-14T03:55:00.000Z',
      },
    ],
    { nowMs: now },
  );
  const jobs = eligibleAuthorizedVideoJobs(
    [
      { id: 'approved', status: 'queued', dead_lettered_at: null },
      { id: 'wrong-operation', status: 'queued', dead_lettered_at: null },
    ],
    ids,
  );
  assert.deepEqual(
    jobs.map((job) => job.id),
    ['approved'],
  );
});

test('expired approvals and terminal jobs cannot keep GPU awake', () => {
  const ids = authorizedVideoJobIds(
    [
      {
        job_id: 'expired',
        operation: 'lesson-video',
        status: 'approved',
        approved_at: '2026-09-14T01:00:00.000Z',
      },
      {
        job_id: 'complete',
        operation: 'lesson-video',
        status: 'processing',
        updated_at: '2026-09-14T03:59:00.000Z',
      },
    ],
    { nowMs: now, ttlMs: 90 * 60 * 1000 },
  );
  const jobs = eligibleAuthorizedVideoJobs(
    [
      { id: 'expired', status: 'queued', dead_lettered_at: null },
      { id: 'complete', status: 'complete', dead_lettered_at: null },
    ],
    ids,
  );
  assert.equal(jobs.length, 0);
});

test('dead-lettered jobs cannot keep GPU awake', () => {
  const ids = new Set(['dead']);
  const jobs = eligibleAuthorizedVideoJobs(
    [{ id: 'dead', status: 'rendering', dead_lettered_at: '2026-09-14T03:00:00.000Z' }],
    ids,
  );
  assert.equal(jobs.length, 0);
});

test('global and per-course generation controls fail closed', () => {
  assert.equal(generationIsPaused(true), true);
  assert.equal(generationIsPaused({ paused: true }), true);
  assert.equal(generationIsPaused(false), false);

  const jobs = eligibleAuthorizedVideoJobs(
    [{ id: 'approved', course_id: 'paused-course', status: 'queued', dead_lettered_at: null }],
    new Set(['approved']),
    new Set(['different-enabled-course']),
  );
  assert.equal(jobs.length, 0);
});
