import assert from 'node:assert/strict';
import test from 'node:test';

import { waitForStableMarketingVersion } from './verify-marketing-version.mjs';

const EXPECTED_SHA = '9ab228ca46abc6b920b24a12886f5addf789cc1d';
const STALE_SHA = '4355715d439e13210802f31947262ad8326038cc';

test('waits for consecutive exact-SHA responses while the public rollout converges', async () => {
  const samples = [STALE_SHA, EXPECTED_SHA, STALE_SHA, EXPECTED_SHA, EXPECTED_SHA, EXPECTED_SHA];
  const attempts = [];

  const result = await waitForStableMarketingVersion({
    expectedSha: EXPECTED_SHA,
    maxAttempts: samples.length,
    requiredConsecutiveMatches: 3,
    intervalMs: 0,
    sleep: async () => {},
    readVersion: async (attempt) => {
      attempts.push(attempt);
      return { ok: true, status: 200, commitSha: samples[attempt - 1] };
    },
  });

  assert.equal(result.attempts, 6);
  assert.equal(result.commitSha, EXPECTED_SHA);
  assert.deepEqual(attempts, [1, 2, 3, 4, 5, 6]);
});

test('reports the observed status and SHA when convergence never completes', async () => {
  await assert.rejects(
    waitForStableMarketingVersion({
      expectedSha: EXPECTED_SHA,
      maxAttempts: 2,
      requiredConsecutiveMatches: 2,
      intervalMs: 0,
      sleep: async () => {},
      readVersion: async (attempt) => ({
        ok: false,
        status: 503,
        commitSha: attempt === 1 ? STALE_SHA : '',
        error: 'upstream unavailable',
      }),
    }),
    /expected 9ab228ca.*HTTP 503.*upstream unavailable/s,
  );
});
