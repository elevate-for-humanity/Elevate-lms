import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/registered-apprenticeship-e2e.yml', import.meta.url), 'utf8');
const job = workflow.slice(workflow.indexOf('\n  production-authenticated-e2e:'));
const condition = job.match(/^    if: (.+)$/m)?.[1];
const concurrency = workflow.match(/^concurrency:\n([\s\S]*?)(?=^\S)/m)?.[1]
  || job.match(/^    concurrency:\n([\s\S]*?)(?=^    \S)/m)?.[1];
const group = concurrency?.match(/^\s+group: (.+)$/m)?.[1];
const queue = concurrency?.match(/^\s+queue: (.+)$/m)?.[1];
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
  const active = reservation(event('workflow_dispatch', {}, {deployment_run_id: '40954519648', deployed_sha: 'a'.repeat(40), component: 'lms'}));
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

test('live checks are serialized and require an explicit deployment receipt', () => {
  const receipt = {deployment_run_id: '123', deployed_sha: 'a'.repeat(40), component: 'admin'};
  assert.equal(reservation(event('workflow_dispatch', {}, receipt)), 'registered-apprenticeship-e2e-deployment');
  assert.equal(reservation(event('workflow_run', {conclusion: 'success', event: 'workflow_dispatch', head_branch: 'main'})), null);
  assert.equal(reservation(event('push')), null);
  assert.equal(reservation(event('workflow_dispatch')), null);
  assert.equal(queue, 'max');
  assert.doesNotMatch(workflow, /^concurrency:/m);
  assert.doesNotMatch(concurrency, /^\s+cancel-in-progress:/m);
  assert.match(job, /Require the attested release to remain live through acceptance/);
});

test('live checks use dedicated accounts and never provision database fixtures', () => {
  assert.doesNotMatch(job, /SUPABASE_SERVICE_ROLE_KEY|provision-(?:remaining|learner|apprenticeship)/);
  assert.match(job, /E2E_EMPLOYER_EMAIL: \$\{\{ secrets\.PRODUCTION_E2E_EMPLOYER_EMAIL \}\}/);
  assert.match(job, /E2E_ADMIN_PASSWORD: \$\{\{ secrets\.PRODUCTION_E2E_ADMIN_PASSWORD \}\}/);
  const receipt = job.indexOf('node scripts/gcp/production-acceptance.mjs verify');
  const identity = job.indexOf('node scripts/qa/require-portal-e2e-identities.mjs');
  assert.ok(receipt >= 0 && receipt < identity && identity < job.indexOf('Verify employer onboarding persistence'));
  const desktop = readFileSync(new URL('../../.github/workflows/e2e-desktop-chrome.yml', import.meta.url), 'utf8');
  assert.match(desktop, /NEXT_PUBLIC_SUPABASE_URL: \$\{\{ secrets\.E2E_SUPABASE_URL \}\}/);
  const provisionAdmin = desktop.indexOf('provision-remaining-portal-e2e.mjs provision');
  const provisionLearner = desktop.indexOf('provision-learner-program-holder-e2e.mjs provision');
  assert.ok(provisionAdmin >= 0 && provisionAdmin < provisionLearner);
  const cleanLearner = desktop.indexOf('provision-learner-program-holder-e2e.mjs cleanup');
  const cleanAdmin = desktop.indexOf('provision-remaining-portal-e2e.mjs cleanup');
  assert.ok(provisionLearner < cleanLearner && cleanLearner < cleanAdmin);
});

const mediaJob = workflow.slice(workflow.indexOf('\n  hvac-public-playback:'), workflow.indexOf('\n  production-authenticated-e2e:'));
const mediaCondition = mediaJob.match(/^    if: (.+)$/m)?.[1];

test('full-film acceptance follows attested Marketing workflow path even with a dynamic run-name', () => {
  const realMarketing = {
    path: '.github/workflows/deploy-google-marketing-trigger.yml',
    name: 'Execute Marketing release · ' + 'a'.repeat(40),
    conclusion: 'success', event: 'workflow_dispatch', head_branch: 'main',
  };
  assert.match(mediaCondition, /workflow_run\.path/);
  assert.doesNotMatch(mediaCondition, /workflow_run\.name/);
  assert.equal(evaluate(mediaCondition, event('pull_request')), true);
  assert.equal(evaluate(mediaCondition, event('workflow_dispatch', {}, { component: 'marketing' })), true);
  assert.equal(evaluate(mediaCondition, event('workflow_run', realMarketing)), true);
  for (const upstream of [
    {...realMarketing, name: 'Deploy Google Marketing on trigger', path: '.github/workflows/deploy-admin.yml'},
    {...realMarketing, conclusion: 'failure'},
    {...realMarketing, event: 'push'},
    {...realMarketing, head_branch: 'feature'},
    {...realMarketing, path: '.github/workflows/deploy-google-lms-trigger.yml'},
  ]) assert.equal(evaluate(mediaCondition, event('workflow_run', upstream)), false, JSON.stringify(upstream));
  assert.equal(evaluate(mediaCondition, event('workflow_dispatch', {}, {component:'marketing',employer_only:true})), false);
  assert.equal(evaluate(mediaCondition, event('push')), false);
  assert.equal(evaluate(mediaCondition, event('workflow_dispatch')), false);
});

test('focused employer acceptance shares the lock for the dedicated live employer fixture', () => {
  const inputs = {employer_only:true, deployment_run_id:'123', deployed_sha:'a'.repeat(40), component:'lms'};
  const focused = reservation(event('workflow_dispatch', {}, inputs));
  assert.ok(focused);
  assert.equal(focused, reservation(event('workflow_dispatch', {}, {...inputs, employer_only:false})));
  assert.equal(queue, 'max');
  for (const key of ['deployment_run_id','deployed_sha','component']) {
    assert.equal(reservation(event('workflow_dispatch', {}, {...inputs,[key]:''})), null);
  }
  for (const name of ['Verify public hydration', 'Certify Studio sign-in', 'Run authenticated production functional', 'Run authenticated cross-device']) {
    const step = job.slice(job.indexOf('- name: '+name)).split('\n      - name:')[0];
    assert.match(step, /!cancelled\(\) && steps\.portal-identities\.outcome == 'success' && !inputs.employer_only/);
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

test('Admin release is the unique employer regression dispatcher after verified deployment', () => {
  // An independent push/workflow_run dispatcher duplicated the attested
  // deploy-admin acceptance job, consuming GitHub Actions runner capacity.
  assert.doesNotMatch(workflow, /^  request-employer-regression:/m);
  const admin = readFileSync(new URL('../../.github/workflows/deploy-admin.yml', import.meta.url), 'utf8');
  const acceptance = admin.slice(admin.indexOf('\n  acceptance:'), admin.indexOf('\n  release-result:'));
  assert.match(acceptance, /needs: deploy-admin/);
  assert.match(acceptance, /needs\.deploy-admin\.result == 'success'/);
  assert.match(acceptance, /node scripts\/gcp\/production-acceptance\.mjs dispatch/);
  assert.match(acceptance, /employer_only: 'true'/);
  assert.match(acceptance, /deployment_run_id: String\(context\.runId\)/);
  assert.match(acceptance, /deployed_sha: context\.sha/);
  assert.match(acceptance, /workflow_id: 'registered-apprenticeship-e2e\.yml'/);
});
test('LMS course playback is not skipped by the Marketing-film admission gate', () => {
  const marker = '- name: Verify authenticated HVAC course video playback and full-screen layout on devices';
  const section = job.split(marker)[1]?.split('\n      - name:')[0];
  assert.ok(section, 'Missing independent LMS playback step');
  const condition = section.match(/^        if: \$\{\{ (.+) \}\}$/m)?.[1];
  assert.ok(condition, 'Missing signed-release admission condition');
  const check = (inputs, passed = true) => Function('inputs', 'github', 'steps', 'cancelled', 'return (' + condition.replaceAll('steps.portal-identities', "steps['portal-identities']") + ');')({deployment_run_id:'123', deployed_sha:'a'.repeat(40), ...inputs}, {event_name:'workflow_dispatch'}, {'portal-identities': {outcome: passed ? 'success' : 'failure'}}, () => false);
  assert.equal(check({component: 'lms'}), true);
  assert.equal(check({component: 'lms', employer_only: true}), false);
  assert.equal(check({component: 'marketing'}), false);
  assert.equal(check({component: 'lms'}, false), false);
  assert.match(section,/EXPECTED_LMS_SHA:/);
  assert.match(section,/hvac-live-lesson-playback\.spec\.ts/);
  const learnerTest = readFileSync(new URL('../../tests/e2e/hvac-live-lesson-playback.spec.ts',import.meta.url),'utf8');
  assert.doesNotMatch(learnerTest,/test\.skip\(/);
  assert.match(learnerTest,/currentTime/);
  assert.match(learnerTest,/videoWidth/);
  assert.match(learnerTest,/data-expanded/);
});

test('main pushes that change live acceptance automatically request each production release', () => {
  for (const file of ['deploy-admin.yml', 'deploy-google-marketing-trigger.yml', 'deploy-google-lms-trigger.yml']) {
    const source = readFileSync(new URL('../../.github/workflows/' + file, import.meta.url), 'utf8');
    const push = source.split('\n  push:\n')[1]?.split('\n  workflow_dispatch:')[0];
    assert.ok(push?.includes('branches: [main]'), file);
    assert.ok(push.includes("'.github/workflows/registered-apprenticeship-e2e.yml'"), file);
    assert.ok(push.includes("'scripts/qa/require-portal-e2e-identities.mjs'"), file);
  }
});

test('Marketing deployment-triggered HVAC playback is pinned to its exact release SHA', () => {
  const expression = mediaJob.split('\n').find(line => line.includes('EXPECTED_MARKETING_SHA: ${{ '))
    ?.split('EXPECTED_MARKETING_SHA: ${{ ')[1]?.split(' }}')[0];
  assert.ok(expression, 'Missing deployed Marketing SHA binding');
  const released = 'b'.repeat(40);
  assert.equal(evaluate(expression, event('workflow_run', {head_sha: released})), released);
  assert.equal(evaluate(expression, event('workflow_dispatch', {}, {deployed_sha: released})), released);
  // A PR runs against existing live Marketing, not an unmerged PR commit.
  assert.equal(evaluate(expression, event('pull_request')), '');
});

test('production authenticated acceptance never uploads request-body traces with persistent passwords', () => {
  // Browser traces include request payloads, including login passwords. Keep
  // all functional checks and separate screenshot/HTML evidence intact.
  const commands = job.match(/^\s*run: pnpm exec playwright test .*$/gm) || [];
  assert.equal(commands.length, 6, 'Every production authenticated browser step must be guarded');
  for (const command of commands) {
    assert.match(command, /--trace off(?:\s|$)/, 'Production test must opt out of request-body tracing');
    assert.doesNotMatch(command, /--trace retain-on-failure/);
  }
  assert.match(job, /- name: Upload QA evidence/);
  assert.match(job, /- name: Preserve authenticated LMS playback and full-screen acceptance evidence/);
});


test('main auto-merge handles retarget edits and fails closed on stale PR details', () => {
  const source = readFileSync(new URL('../../.github/workflows/auto-merge-main.yml', import.meta.url), 'utf8');
  const trigger = source.slice(0, source.indexOf('\npermissions:'));
  assert.match(trigger, /pull_request_target:/);
  assert.match(trigger, /types: \[[^\]]*edited[^\]]*converted_to_draft/);
  assert.doesNotMatch(trigger, /branches:\s*\[main\]/, 'Retargeting away from main must emit a disabling event');
  const disable = source.split('- name: Disable only after transition out of automatic main eligibility')[1]
    ?.split('\n      - name: Request squash auto-merge')[0];
  const enable = source.split('- name: Request squash auto-merge through the existing branch rules')[1];
  assert.ok(disable && enable, 'Both disable and enable paths must be present');
  const decision = section => {
    const expression = section.match(/\$\{\{([\s\S]+?)\}\}/)?.[1];
    assert.ok(expression, 'Each auto-merge path needs an eligibility condition');
    return expression.trim().replace(/\n\s*/g, ' ');
  };
  const context = (action, base, previousBase, draft, head) => ({
    github: {event: {action, changes: {base: {ref: {from: previousBase}}}, pull_request: {base:{ref:base}, draft, head:{ref:head}}}}, inputs:{},
  });
  for (const [action, base, previousBase, draft, head, shouldEnable, shouldDisable] of [
    ['synchronize', 'main', '', false, 'feature', true, false],
    ['edited', 'staging', 'main', false, 'feature', false, true],
    ['edited', 'staging', '', false, 'feature', false, false],
    ['converted_to_draft', 'main', '', true, 'feature', false, true],
    ['edited', 'main', '', false, 'staging', false, false],
  ]) {
    const pr = context(action, base, previousBase, draft, head);
    assert.equal(evaluate(decision(enable), pr), shouldEnable);
    assert.equal(evaluate(decision(disable), pr), shouldDisable);
  }
  assert.match(disable, /--json baseRefName,headRefName,isDraft,autoMergeRequest/);
  assert.match(disable, /--disable-auto/);
  assert.match(enable, /--json baseRefName,headRefOid,isDraft/);
  assert.match(enable, /--match-head-commit "\$PR_HEAD"/);
});

test('isolated QA cleanup deletes and verifies disposable career resumes before profiles', () => {
  const source = readFileSync(new URL('./provision-learner-program-holder-e2e.mjs', import.meta.url), 'utf8');
  assert.ok(source.includes("qaHostname !== 'isdgjcdabhxxozarmxta.supabase.co'"));
  const cleanup = source.slice(source.indexOf('async function cleanup()'));
  const remove = cleanup.indexOf("db.from('resumes').delete().eq('user_id', state.learner.id)");
  const verify = cleanup.indexOf("db.from('resumes').select('id').eq('user_id', state.learner.id)");
  const removeProfile = cleanup.indexOf("db.from('profiles').delete().eq('id', userId)");
  assert.ok(remove > 0 && verify > remove && removeProfile > verify,
    'QA resumes must be deleted and read back before disposable profile cleanup');
  assert.ok(cleanup.includes('if (remainingResumes?.length) {'));
  assert.ok(cleanup.includes("throw new Error('QA learner resume cleanup left disposable learner rows')"));
});


test('production browsers require successful identity preflight and never run after missing setup', () => {
  const sections = job.split(/(?=^      - name: )/m).filter(section => /^        run: pnpm exec playwright test /m.test(section));
  assert.equal(sections.length, 6);
  assert.match(job, /- name: Require all nine roles so authenticated tests cannot silently skip\n        id: portal-identities/);
  for (const section of sections) {
    const expression = section.match(/^        if: \$\{\{ (.+) \}\}$/m)?.[1];
    assert.ok(expression);
    const evaluate = Function('inputs', 'github', 'steps', 'cancelled', 'return (' + expression.replaceAll('steps.portal-identities', "steps['portal-identities']") + ');');
    const inputs = {component:'lms', deployed_sha:'a'.repeat(40), deployment_run_id:'123', employer_only:false};
    const github = {event_name:'workflow_dispatch', event:{workflow_run:{}}};
    for (const outcome of ['skipped', 'failure', 'cancelled', 'success']) {
      assert.equal(Boolean(evaluate(inputs, github, {'portal-identities':{outcome}}, () => false)), outcome === 'success');
    }
    assert.equal(Boolean(evaluate(inputs, github, {'portal-identities':{outcome:'success'}}, () => true)), false);
  }
});
