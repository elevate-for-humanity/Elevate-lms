import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/registered-apprenticeship-e2e.yml', import.meta.url), 'utf8');
const job = workflow.slice(workflow.indexOf('\n  production-authenticated-e2e:'));
const condition = job.match(/^    if: (.+)$/m)?.[1];
const concurrency = workflow.match(/^concurrency:\n([\s\S]*?)(?=^\S)/m)?.[1]
  || job.match(/^    concurrency:\n([\s\S]*?)(?=^    \S)/m)?.[1];
const group = concurrency?.match(/^\s+group: (.+)$/m)?.[1];
const cancel = concurrency?.match(/^\s+cancel-in-progress: \$\{\{ (.*?) \}\}$/m)?.[1];
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
  for (const component of ['marketing', 'admin', 'lms', 'store']) {
    assert.equal(evaluate(cancel, event('workflow_dispatch', {}, {component, deployment_run_id:'123'})), false);
  }
  assert.equal(evaluate(cancel, event('workflow_run', {conclusion:'success', event:'workflow_dispatch', head_branch:'main'})), false);
  assert.equal(evaluate(cancel, event('push')), true);
  assert.equal(evaluate(cancel, event('workflow_dispatch')), true);
  assert.match(job, /Require the attested release to remain live through acceptance/);
});

test('only the admitted test job owns concurrency and runs this regression before provisioning', () => {
  assert.doesNotMatch(workflow, /^concurrency:/m);
  assert.match(job, /^    concurrency:/m);
  const check = job.indexOf('node --test scripts/qa/portal-acceptance-concurrency.test.mjs');
  assert.ok(check >= 0 && check < job.indexOf('Provision disposable Host Shop'));
});

test('cleanup cannot run before the dependency boundary that makes it executable', () => {
  const install = job.slice(job.indexOf('- name: Install dependencies'), job.indexOf('- name: Require Supabase QA provisioning authority'));
  assert.match(install, /id: install-dependencies/);
  for (const name of [
    'Clean Employer + Instructor + Staff + Case Manager + Admin identities',
    'Clean isolated Learner + Program Holder identities',
    'Clean disposable Host Shop + Apprentice identities',
  ]) {
    const step = job.slice(job.indexOf('- name: '+name)).split('\n      - name:')[0];
    assert.match(step, /if: \$\{\{ always\(\) && steps\.install-dependencies\.outcome == 'success' \}\}/);
  }
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
  assert.equal(evaluate(mediaCondition, event('workflow_dispatch', {}, {component:'marketing',employer_only:true})), false);
  assert.equal(evaluate(mediaCondition, event('push')), false);
  assert.equal(evaluate(mediaCondition, event('workflow_dispatch')), false);
});


test('focused employer acceptance needs an attested release and cannot displace full acceptance', () => {
  const inputs = {employer_only:true, deployment_run_id:'123', deployed_sha:'a'.repeat(40), component:'lms'};
  const focused = reservation(event('workflow_dispatch', {}, inputs));
  assert.ok(focused);
  assert.notEqual(focused, reservation(event('workflow_dispatch', {}, {...inputs, employer_only:false})));
  assert.equal(evaluate(cancel, event('workflow_dispatch', {}, inputs)), false);
  for (const key of ['deployment_run_id','deployed_sha','component']) {
    assert.equal(reservation(event('workflow_dispatch', {}, {...inputs,[key]:''})), null);
  }
  for (const name of ['Verify public hydration', 'Certify Studio sign-in', 'Run authenticated production functional', 'Run authenticated cross-device']) {
    const step = job.slice(job.indexOf('- name: '+name)).split('\n      - name:')[0];
    assert.match(step, /!cancelled\(\) && !inputs.employer_only/);
  }
});

test('Admin release requests both full and isolated employer acceptance only after deployment', () => {
  const admin = readFileSync(new URL('../../.github/workflows/deploy-admin.yml', import.meta.url), 'utf8');
  const acceptance = admin.slice(admin.indexOf('\n  acceptance:'), admin.indexOf('\n  release-result:'));
  assert.match(acceptance, /needs: deploy-admin/);
  assert.match(acceptance, /needs.deploy-admin.result == 'success'/);
  assert.match(acceptance, /node scripts\/gcp\/production-acceptance.mjs dispatch/);
  assert.match(acceptance, /employer_only: 'true'/);
  assert.match(acceptance, /deployed_sha: context.sha/);
  assert.match(acceptance, /deployment_run_id: String\(context.runId\)/);
});

test('focused regression reports current tests separately from the attested deployed source', () => {
  const expression = job.match(/^          ref: \$\{\{ (.*?) \}\}$/m)?.[1];
  assert.ok(expression);
  const focused = event('workflow_dispatch', {}, {employer_only:true,deployed_sha:'deployed',deployment_run_id:'123',component:'admin'});
  focused.github.sha = 'current-trusted-main';
  assert.equal(evaluate(expression, focused), 'current-trusted-main');
  assert.equal(evaluate(expression, {...focused,inputs:{...focused.inputs,employer_only:false}}), 'deployed');
  assert.match(job, /Attested deployed commit:/);
  assert.match(job, /Require the attested release to remain live through acceptance/);
});

test('the push dispatcher requires a healthy live version and a matching successful Admin deployment', async () => {
  const section = workflow.slice(workflow.indexOf('\n  request-employer-regression:'), workflow.indexOf('\n  hvac-public-playback:'));
  assert.match(section, /if: github.event_name == 'push' && github.ref == 'refs\/heads\/main'/);
  const script = section.split('          script: |\n')[1].split('\n').map(line=>line.startsWith('            ')?line.slice(12):line).join('\n');
  const execute = new (Object.getPrototypeOf(async function(){}).constructor)('github','context','fetch',script);
  const sha='a'.repeat(40);const calls=[];
  const run={id:123,head_branch:'main',head_sha:sha,conclusion:'success'};
  const github={rest:{actions:{listWorkflowRuns:async()=>({data:{workflow_runs:[run]}}),createWorkflowDispatch:async value=>calls.push(value)}}};
  const context={repo:{owner:'owner',repo:'repo'}};
  const health={service:'admin',commit:sha,ready:true,healthy:true,dependencies:{supabase:{ok:true}}};
  await execute(github,context,async()=>Response.json(health));
  assert.deepEqual(calls[0].inputs,{employer_only:'true',deployed_sha:sha,deployment_run_id:'123',component:'admin'});
  assert.equal(calls[0].ref,'main');calls.length=0;
  await assert.rejects(execute(github,context,async()=>Response.json({...health,ready:false})),/must be healthy/);
  run.head_sha='b'.repeat(40);
  await assert.rejects(execute(github,context,async()=>Response.json(health)),/must attest/);
  assert.equal(calls.length,0);
});

test('LMS course playback is not skipped by the Marketing-film admission gate', () => {
  const marker = '- name: Verify authenticated HVAC course video playback and full-screen layout on devices';
  const section = job.split(marker)[1]?.split('\n      - name:')[0];
  assert.ok(section, 'Missing independent LMS playback step');
  const condition = section.match(/^        if: \$\{\{ (.+) \}\}$/m)?.[1];
  assert.ok(condition, 'Missing signed-release admission condition');
  const check = context => Function('github','inputs','cancelled',
    'return (' + condition + ');')(context.github, context.inputs, () => false);
  const run = {
    name:'Deploy LMS automatically on Google',
    conclusion:'success',event:'workflow_dispatch',head_branch:'main',
  };
  assert.equal(check(event('workflow_run',run)),true);
  assert.equal(check(event('workflow_dispatch',{},{
    component:'lms',deployed_sha:'a'.repeat(40),deployment_run_id:'123',
  })),true);
  assert.equal(check(event('workflow_run',{...run,conclusion:'failure'})),false);
  assert.equal(check(event('workflow_run',{...run,name:'Deploy Google Marketing on trigger'})),false);
  assert.equal(check(event('workflow_dispatch',{},{
    component:'marketing',deployed_sha:'a'.repeat(40),deployment_run_id:'123',
  })),false);
  assert.equal(check(event('workflow_dispatch',{},{
    component:'lms',deployed_sha:'',deployment_run_id:'',
  })),false);
  assert.match(section,/EXPECTED_LMS_SHA:/);
  assert.match(section,/hvac-live-lesson-playback\.spec\.ts/);
  const learnerTest = readFileSync(new URL('../../tests/e2e/hvac-live-lesson-playback.spec.ts',import.meta.url),'utf8');
  assert.doesNotMatch(learnerTest,/test\.skip\(/);
  assert.match(learnerTest,/currentTime/);
  assert.match(learnerTest,/videoWidth/);
  assert.match(learnerTest,/data-expanded/);
});
