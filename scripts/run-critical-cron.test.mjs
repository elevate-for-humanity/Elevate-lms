import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';

async function invoke(t, name, method, status, body) {
  const requests = [];
  const server = createServer((req, res) => {
    requests.push({ method: req.method, url: req.url, auth: req.headers.authorization });
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(body);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const child = spawn(process.execPath, ['scripts/run-critical-cron.mjs', name, method], {
    env: { ...process.env, CRON_SECRET: 'test-only-secret', ADMIN_URL: `http://127.0.0.1:${server.address().port}` },
  });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  const code = await new Promise(resolve => child.on('close', resolve));
  return { code, output, requests };
}

test('attendance uses authenticated POST and validates the processed response', async t => {
  const result = await invoke(t, 'daily-attendance-alerts', 'POST', 200,
    JSON.stringify({ ok: true, processed: 0, alerts_created: 0, critical_alerts: 0 }));
  assert.equal(result.code, 0);
  assert.deepEqual(result.requests, [{ method: 'POST', url: '/api/cron/daily-attendance-alerts', auth: 'Bearer test-only-secret' }]);
});
for (const [label, status, body] of [
  ['method rejection', 405, '{}'], ['server failure', 500, '{}'],
  ['logical failure', 200, '{"ok":false}'], ['malformed JSON', 200, 'not-json'],
  ['missing processing evidence', 200, '{"ok":true}'],
]) {
  test(`attendance fails visibly on ${label}`, async t => {
    const result = await invoke(t, 'daily-attendance-alerts', 'POST', status, body);
    assert.equal(result.code, 1);
  });
}
test('autopilot reports failure without exposing the response or credentials', async t => {
  const result = await invoke(t, 'autopilot-tick', 'GET', 200,
    JSON.stringify({ ok: false, success: false, errors: ['private-provider-details', 'test-only-secret'] }));
  assert.equal(result.code, 1);
  assert.doesNotMatch(result.output, /private-provider-details|test-only-secret/);
});
test('autopilot succeeds only with explicit clean processing evidence', async t => {
  const result = await invoke(t, 'autopilot-tick', 'GET', 200, '{"ok":true,"success":true,"errors":[]}');
  assert.equal(result.code, 0);
});
test('scheduler continues independent scans and aggregates failures at the end', () => {
  const workflow = load(readFileSync('.github/workflows/cron-scheduler.yml', 'utf8'));
  const steps = workflow.jobs['daily-morning'].steps;
  assert.ok(steps.some(step => step.uses === 'actions/checkout@v4'));
  for (const id of ['attendance_alerts', 'autopilot_tick']) {
    const step = steps.find(step => step.id === id);
    assert.equal(step['continue-on-error'], true);
    assert.match(step.run, /node scripts\/run-critical-cron.mjs/);
  }
  const gate = steps.at(-1);
  assert.equal(gate.if, 'always()');
  assert.match(gate.run, /exit 1/);
  assert.match(gate.env.ATTENDANCE_RESULT, /steps.attendance_alerts.outcome/);
  assert.match(gate.env.AUTOPILOT_RESULT, /steps.autopilot_tick.outcome/);
});
