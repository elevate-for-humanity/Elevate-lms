import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalHash,
  credentialMatches,
  runLearnerTest,
  CHECKS,
  learnerSetupReady,
} from './learner-runthrough.mjs';
test('evidence hashes are stable across object ordering but change with lesson contents', () => {
  assert.equal(
    canonicalHash({ b: 2, a: [{ z: 1, x: 3 }] }),
    canonicalHash({ a: [{ x: 3, z: 1 }], b: 2 }),
  );
  assert.notEqual(canonicalHash({ a: 'old lesson' }), canonicalHash({ a: 'new lesson' }));
});
test('empty, absent, and mismatched runner credentials never authorize', () => {
  for (const [actual, expected] of [
    ['', ''],
    ['abc', undefined],
    ['wrong', 'secret'],
    ['short', 'much-longer'],
  ])
    assert.equal(credentialMatches(actual, expected), false);
  assert.equal(credentialMatches('same-secret', 'same-secret'), true);
});
test('runner rejects arbitrary target hosts before opening a browser or creating an account', async () => {
  await assert.rejects(
    runLearnerTest({}, { lmsUrl: 'https://example.com', secret: 'secret' }),
    /Canonical HTTPS LMS/,
  );
  await assert.rejects(
    runLearnerTest({}, { lmsUrl: 'http://app.elevateforhumanity.org', secret: 'secret' }),
    /Canonical HTTPS LMS/,
  );
});
test('runner rejects partial test contracts rather than returning fake passing observations', async () => {
  await assert.rejects(
    runLearnerTest(
      { requiredChecks: ['desktop'] },
      { lmsUrl: 'https://app.elevateforhumanity.org', secret: 'secret' },
    ),
    /Full learner contract/,
  );
  await assert.rejects(
    runLearnerTest(
      { requiredChecks: CHECKS },
      { lmsUrl: 'https://app.elevateforhumanity.org', secret: 'secret' },
    ),
    /Missing lessonBuildId/,
  );
});

test('learner readiness rejects a generic missing route and wrong credentials', () => {
  assert.equal(learnerSetupReady(404, null), false);
  assert.equal(learnerSetupReady(404, { error: 'Not Found' }), false);
  assert.equal(learnerSetupReady(401, { error: 'unauthorized' }), false);
  assert.equal(learnerSetupReady(404, { error: 'Lesson not found' }), true);
});

import { runStagedPracticalWorkflow } from './learner-runthrough.mjs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

async function practicalHarness(t, { completionStatus = 409, rejectReview = false } = {}) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qa-practical-runner-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const events = [],
    progress = { practical: null, practicalHistory: [] };
  let uploaded = false,
    attested = false;
  const response = (status, body = {}) => ({
    status: () => status,
    ok: () => status < 300,
    json: async () => body,
  });
  const node = {
    waitFor: async () => {},
    count: async () => 1,
    locator: (selector) => ({
      click: async () => {
        assert.equal(selector, 'input[type=file]');
        events.push('file-picker');
      },
      check: async () => {
        assert.equal(selector, 'input[type=checkbox]');
        attested = true;
        events.push('attest');
      },
    }),
    getByRole: (role, options = {}) =>
      role === 'status'
        ? {
            filter: ({ hasText }) => ({
              waitFor: async () => assert.equal(progress.practical.status, hasText),
            }),
          }
        : {
            click: async () => {
              if (options.name === 'Refresh QA review') {
                events.push('refresh');
                return;
              }
              assert.equal(options.name, 'Submit QA practical evidence');
              assert.equal(uploaded, true);
              assert.equal(attested, true);
              if (progress.practical) progress.practicalHistory.push(progress.practical);
              progress.practical = {
                id: 'submission-' + (progress.practicalHistory.length + 1),
                revision: progress.practicalHistory.length + 1,
                status: 'submitted',
                competency_keys: ['skill'],
                artifact: { sha256: 'fixture-sha', syntheticQA: true },
              };
              uploaded = false;
              attested = false;
              events.push('submit:' + progress.practical.revision);
            },
          },
  };
  const page = {
    getByTestId: () => node,
    screenshot: async ({ path: filename }) => {
      await fs.writeFile(filename, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      events.push('screenshot');
    },
    waitForEvent: async (event) => {
      assert.equal(event, 'filechooser');
      return {
        setFiles: async (files) => {
          assert.equal(files.length, 1);
          assert.equal((await fs.readFile(files[0])).subarray(1, 4).toString(), 'PNG');
          uploaded = true;
          events.push('file-selected');
        },
      };
    },
    request: {
      post: async (_url, options) => {
        assert.deepEqual(options.data, { action: 'complete' });
        events.push('completion:' + progress.practical.status);
        return response(completionStatus);
      },
      patch: async (url, options) => {
        assert.equal(url, 'https://app.elevateforhumanity.org/api/learner-testing/runs/run');
        assert.deepEqual(options.headers, { authorization: 'Bearer test-secret' });
        const data = options.data;
        assert.equal(data.artifactHash, 'snapshot');
        assert.equal(data.lessonBuildId, 'build');
        assert.equal(data.submissionId, progress.practical.id);
        assert.equal(data.revision, progress.practical.revision);
        events.push('review:' + data.decision);
        if (rejectReview) return response(403);
        progress.practical.status = data.decision;
        return response(200, { syntheticQA: true, realCompetencyAwarded: false });
      },
    },
  };
  const args = {
    setup: { runId: 'run', snapshot: { qaOnly: true, practicalRequired: true } },
    input: { lessonBuildId: 'build', artifactHash: 'snapshot' },
    page,
    state: async () => structuredClone(progress),
    base: new URL('https://app.elevateforhumanity.org'),
    secret: 'test-secret',
    directory,
  };
  return { args, events, progress };
}
test('practical runner harness uses uploaded artifacts, blocks completion and exercises versioned reviewer lifecycle', async (t) => {
  const { args, events } = await practicalHarness(t);
  assert.equal(
    await runStagedPracticalWorkflow(args),
    'QA submission/review workflow verified; no real competency awarded',
  );
  assert.deepEqual(
    events.filter((event) => /^(submit|review|completion):/.test(event)),
    [
      'submit:1',
      'completion:submitted',
      'review:rejected',
      'completion:rejected',
      'submit:2',
      'review:revision_required',
      'submit:3',
      'review:approved',
    ],
  );
  assert.equal(events.filter((event) => event === 'file-selected').length, 3);
  assert.equal(events[0], 'screenshot');
});
test('practical runner fails if pending evidence wrongly awards completion', async (t) => {
  const { args, events } = await practicalHarness(t, { completionStatus: 200 });
  await assert.rejects(runStagedPracticalWorkflow(args), /Unreviewed practical awarded completion/);
  assert.equal(
    events.some((event) => event.startsWith('review:')),
    false,
  );
});
test('practical runner stops when scoped reviewer authentication fails', async (t) => {
  const { args, events } = await practicalHarness(t, { rejectReview: true });
  await assert.rejects(
    runStagedPracticalWorkflow(args),
    /QA reviewer rejected workflow request \(403\)/,
  );
  assert.equal(events.filter((event) => event.startsWith('submit:')).length, 1);
});
test('practical runner refuses an unmarked staged snapshot', async (t) => {
  const { args, events } = await practicalHarness(t);
  args.setup.snapshot.qaOnly = false;
  await assert.rejects(runStagedPracticalWorkflow(args), /marked QA snapshot/);
  assert.deepEqual(events, []);
});
