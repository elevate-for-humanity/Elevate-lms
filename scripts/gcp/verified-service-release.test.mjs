import test from 'node:test';
import assert from 'node:assert/strict';
import { completedServiceReleaseVerified } from './verified-service-release.mjs';

const run = { id: 45412030039, status: 'completed', conclusion: 'success' };
const successfulJob = name => ({ name, status: 'completed', conclusion: 'success' });
const canonicalJobs = [
  ['deploy-admin.yml', 'Deploy and verify Admin on Google'],
  ['deploy-google-lms-trigger.yml', 'deploy / deploy (lms)'],
  ['deploy-google-marketing-trigger.yml', 'Deploy and verify Marketing on Google'],
  ['deploy-google-store-runtime.yml', 'Deploy and verify Store on Google'],
];

for (const [workflow, deployName] of canonicalJobs) {
  test(`${workflow} recognizes only its successful canonical deployment and acceptance jobs`, async () => {
    const jobs = [successfulJob('validate'), successfulJob(deployName), successfulJob('acceptance')];
    const calls = [];
    const api = async path => {
      calls.push(path);
      return { total_count: jobs.length, jobs };
    };
    assert.equal(await completedServiceReleaseVerified(run, workflow, api), true);
    assert.deepEqual(calls, [`actions/runs/${run.id}/jobs?per_page=100`]);

    for (const [, wrongComponent] of canonicalJobs.filter(([name]) => name !== workflow)) {
      assert.equal(await completedServiceReleaseVerified(run, workflow, async () => ({
        jobs: [successfulJob(wrongComponent), successfulJob('acceptance')],
      })), false, `a successful ${wrongComponent} job cannot attest ${workflow}`);
    }
  });
}

test('LMS requires the exact canonical reusable job name, not a suffix or another matrix component', async () => {
  for (const name of [
    'deploy', 'deploy / deploy', 'deploy / deploy (admin)', 'deploy / deploy (marketing)',
    'deploy / deploy (store)', 'unrelated / deploy / deploy (lms)',
    'deploy / deploy (lms) extra', 'Deploy / deploy (lms)',
  ]) {
    assert.equal(await completedServiceReleaseVerified(run, 'deploy-google-lms-trigger.yml', async () => ({
      jobs: [successfulJob(name), successfulJob('acceptance')],
    })), false, name);
  }
});

test('successful unrelated jobs cannot hide a failed, skipped, pending or absent required job', async () => {
  for (const [workflow, deployName] of canonicalJobs) {
    for (const requiredName of [deployName, 'acceptance']) {
      for (const state of [
        { status: 'completed', conclusion: 'failure' },
        { status: 'completed', conclusion: 'skipped' },
        { status: 'completed', conclusion: 'cancelled' },
        { status: 'in_progress', conclusion: null },
        { status: 'queued', conclusion: null },
        null,
      ]) {
        const jobs = [successfulJob(deployName), successfulJob('acceptance'), successfulJob('validate')]
          .filter(job => job.name !== requiredName);
        if (state) jobs.push({ name: requiredName, ...state });
        assert.equal(await completedServiceReleaseVerified(run, workflow, async () => ({ jobs })), false,
          `${workflow}: ${requiredName} ${state?.conclusion || state?.status || 'missing'}`);
      }
    }
  }
});

test('unrecognized workflows and unsuccessful or invalid runs never request job evidence', async () => {
  const api = async () => { assert.fail('invalid release cannot query job evidence'); };
  for (const workflow of ['deploy-google-repaired.yml', 'other.yml', '.github/workflows/deploy-google-lms-trigger.yml']) {
    assert.equal(await completedServiceReleaseVerified(run, workflow, api), false);
  }
  for (const candidate of [
    null, { ...run, status: 'in_progress' }, { ...run, conclusion: 'failure' },
    { ...run, conclusion: 'skipped' }, { ...run, id: 0 }, { ...run, id: '45412030039' },
    { ...run, id: Number.MAX_SAFE_INTEGER + 1 },
  ]) {
    assert.equal(await completedServiceReleaseVerified(candidate, 'deploy-google-lms-trigger.yml', api), false);
  }
});

test('missing or partial job evidence cannot attest a completed deployment', async () => {
  const jobs = [successfulJob('deploy / deploy (lms)'), successfulJob('acceptance')];
  for (const response of [null, {}, { jobs: {} }, { jobs: [] }, { total_count: jobs.length + 1, jobs }]) {
    assert.equal(await completedServiceReleaseVerified(run, 'deploy-google-lms-trigger.yml', async () => response), false);
  }
});
