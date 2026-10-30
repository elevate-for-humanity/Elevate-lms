import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/registered-apprenticeship-e2e.yml', import.meta.url), 'utf8');
const job = workflow.slice(workflow.indexOf('\n  production-authenticated-e2e:'));
const condition = job.match(/^    if: (.+)$/m)?.[1];
const concurrency = workflow.match(/^concurrency:\n([\s\S]*?)(?=^\S)/m)?.[1]
  || job.match(/^    concurrency:\n([\s\S]*?)(?=^    \S)/m)?.[1];
const group = concurrency?.match(/^\s+group: (.+)$/m)?.[1];
// Exercise the actual boolean/string expressions in the checked-in workflow.
// These expressions use operators shared by JavaScript and GitHub Actions.
function evaluate(expression, {github, inputs}) {
  return Function('github', 'inputs', `return (${expression});`)(github, inputs);
}
function event(name, upstream = {}, inputs = {}) {
  return {github: {ref: 'refs/heads/main', event_name: name, event: {workflow_run: upstream}},
    inputs: {deployment_run_id: '', ...inputs}};
}
function reservation(context) {
  if (!/^concurrency:/m.test(workflow) && !evaluate(condition, context)) return null;
  return group.replace(/\$\{\{(.*?)\}\}/g, (_, expression) => evaluate(expression, context));
}

test('skipped deployment notifications cannot reserve the live acceptance lock', () => {
  const active = reservation(event('workflow_dispatch', {}, {deployment_run_id: '40954519648'}));
  assert.ok(active);
  for (const upstream of [
    {conclusion: 'success', event: 'push', head_branch: 'main'},
    {conclusion: 'failure', event: 'workflow_dispatch', head_branch: 'main'},
    {conclusion: 'cancelled', event: 'workflow_dispatch', head_branch: 'main'},
    {conclusion: 'success', event: 'workflow_dispatch', head_branch: 'feature'},
  ]) {
    assert.equal(reservation(event('workflow_run', upstream)), null,
      `ignored ${JSON.stringify(upstream)} must not cancel ${active}`);
  }
});

test('real deployment acceptance retains serialization and source checks remain independent', () => {
  const explicit = reservation(event('workflow_dispatch', {}, {deployment_run_id: '123'}));
  const completed = reservation(event('workflow_run',
    {conclusion: 'success', event: 'workflow_dispatch', head_branch: 'main'}));
  const source = reservation(event('push'));
  assert.equal(explicit, completed);
  assert.notEqual(explicit, source);
  assert.match(concurrency, /cancel-in-progress: true/);
});

test('only the admitted test job owns concurrency and runs this regression before provisioning', () => {
  assert.doesNotMatch(workflow, /^concurrency:/m);
  assert.match(job, /^    concurrency:/m);
  const check = job.indexOf('node --test scripts/qa/portal-acceptance-concurrency.test.mjs');
  assert.ok(check >= 0 && check < job.indexOf('Provision disposable Host Shop'));
});

const mediaJob = workflow.slice(workflow.indexOf('\n  hvac-public-playback:'), workflow.indexOf('\n  production-authenticated-e2e:'));
const mediaCondition = mediaJob.match(/^    if: (.+)$/m)?.[1];

test('unchanged full-film acceptance runs for PRs and real Marketing releases', () => {
  assert.equal(evaluate(mediaCondition, event('pull_request')), true);
  assert.equal(evaluate(mediaCondition, event('workflow_dispatch', {}, { component: 'marketing' })), true);
  assert.equal(evaluate(mediaCondition, event('workflow_run', {
    name: 'Deploy Google Marketing on trigger', conclusion: 'success', event: 'workflow_dispatch', head_branch: 'main',
  })), true);
  for (const upstream of [
    { name: 'Deploy Admin', conclusion: 'success', event: 'workflow_dispatch', head_branch: 'main' },
    { name: 'Deploy Google Marketing on trigger', conclusion: 'failure', event: 'workflow_dispatch', head_branch: 'main' },
    { name: 'Deploy Google Marketing on trigger', conclusion: 'success', event: 'push', head_branch: 'main' },
    { name: 'Deploy Google Marketing on trigger', conclusion: 'success', event: 'workflow_dispatch', head_branch: 'feature' },
  ]) assert.equal(evaluate(mediaCondition, event('workflow_run', upstream)), false);
  assert.equal(evaluate(mediaCondition, event('push')), false);
  assert.equal(evaluate(mediaCondition, event('workflow_dispatch')), false);
});
