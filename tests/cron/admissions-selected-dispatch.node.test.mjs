import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { load } from 'js-yaml';

const workflow = load(readFileSync('.github/workflows/cron-scheduler.yml', 'utf8'));
const selected = 'process-application-submissions';
const selectedJob = workflow.jobs['stabilization-cron'];
const invokeStep = selectedJob.steps.find(step => step.name === 'Invoke only the selected authorized route');

function admittedJobs(job) {
  const github = { event_name: 'workflow_dispatch', event: { inputs: { job } } };
  return Object.entries(workflow.jobs).filter(([, definition]) => {
    assert.equal(typeof definition.if, 'string', 'Every scheduler job must have an explicit event condition');
    // Evaluate the actual checked-in job selection expressions against a manual
    // dispatch event. This checks all jobs, including the payout/email groups.
    return Function('github', `"use strict"; return (${definition.if});`)(github);
  }).map(([name]) => name);
}

test('admissions dispatch admits only the selected-route job and preserves other isolated choices', () => {
  assert.ok(workflow.on.workflow_dispatch.inputs.job.options.includes(selected));
  for (const choice of [selected, 'qa-scan', 'morning-reminders', 'missed-checkins', 'expire-credentials']) {
    assert.deepEqual(admittedJobs(choice), ['stabilization-cron']);
  }
  assert.doesNotMatch(workflow.jobs['queue-processors'].if, /process-application-submissions/);
  assert.doesNotMatch(selectedJob.if, /github\.event_name == 'schedule'/);
});

async function runSelected(t, status) {
  const requests = [];
  const server = createServer((request, response) => {
    requests.push({ method: request.method, url: request.url, authorization: request.headers.authorization });
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ private: 'fixture-applicant@example.invalid', processed: status === 200 ? 1 : 0 }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const child = spawn('bash', ['-c', invokeStep.run], {
    env: { ...process.env, SELECTED_JOB: selected, ADMIN_URL: `http://127.0.0.1:${server.address().port}`, CRON_SECRET: 'fixture-only-cron-secret' },
  });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  const exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  return { exitCode, output, requests };
}

for (const status of [200, 503]) {
  test(`selected admissions shell makes one authenticated request and reports HTTP ${status} without response data`, async t => {
    const result = await runSelected(t, status);
    assert.equal(result.exitCode, status === 200 ? 0 : 1);
    assert.deepEqual(result.requests, [{ method: 'GET', url: '/api/cron/process-application-submissions', authorization: 'Bearer fixture-only-cron-secret' }]);
    assert.match(result.output, new RegExp(`Selected cron: ${selected}; HTTP ${status}`));
    assert.doesNotMatch(result.output, /fixture-applicant|fixture-only-cron-secret|program-holder-payouts|interoffice-mail|invoice/);
  });
}
