import {assertCommittedWriteReadback} from '../../lib/devstudio/paris-action-loop.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { spawnSync } from 'node:child_process';
import { infrastructureRepairPath, openInfrastructureRepair, infrastructureMergeEvidence, STORE_REPAIR_DEPLOYMENT, assertDeploymentInvariants } from '../../lib/devstudio/infrastructure-repair.mjs';
import { REPAIR_DEPLOYMENTS, repairDeploymentState, nextRepairDeployment } from '../../lib/ai/runtime/code-repair-policy.mjs';
import {REPAIR_INFERENCE_TIMEOUT_MS,REPAIR_MODEL_PROBE_TIMEOUT_MS} from '../../lib/devstudio/repair-inference-budget.mjs';

const engineer = readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts', import.meta.url), 'utf8');
const compiled = `const REPAIR_INFERENCE_TIMEOUT_MS=${REPAIR_INFERENCE_TIMEOUT_MS}; const REPAIR_MODEL_PROBE_TIMEOUT_MS=${REPAIR_MODEL_PROBE_TIMEOUT_MS};\n` + stripTypeScriptTypes(engineer).replace(/^import[\s\S]*?;\n/gm, '').replaceAll('export ', '');
const blockedPath = new Function(compiled + '\nreturn blockedPath;')();
const workflow = readFileSync(new URL('../../.github/workflows/paris-code-repair.yml', import.meta.url), 'utf8');
const validator = workflow.split('      - name: Require an application patch and a new regression test')[1].split("          python - <<'PY'\n")[1].split('\n          PY')[0].split('\n').map(line => line.slice(10)).join('\n');

function validatePath(path) {
  const directory = mkdtempSync(join(tmpdir(), 'paris-deployment-test-'));
  const changes = `M\t${path}\nA\ttests/worker/deployment-regression.test.mjs\n`;
  try {
    const prefix = `import subprocess\nsubprocess.check_output=lambda *a,**k:${JSON.stringify(changes)}\n`;
    return spawnSync('python3', ['-c', prefix + validator.replace("'/tmp/paris-tests.json'", JSON.stringify(join(directory, 'tests.json')))], {
      encoding: 'utf8', env: { ...process.env, BASE_SHA: 'a'.repeat(40), PATCH_SHA: 'b'.repeat(40) },
    });
  } finally { rmSync(directory, { recursive: true }); }
}

test('PARIS editor and independent validator both accept deployment corrections', () => {
  for (const path of ['.github/workflows/ci.yml', '.github/workflows/deploy-google-store-runtime.yml', '.github/workflows/deploy-google-marketing-trigger.yml', '.github/workflows/deploy-admin.yml', 'Dockerfile.marketing', 'scripts/gcp/activate-tested-public-revision.mjs']) {
    assert.equal(infrastructureRepairPath(path), true);
    assert.equal(blockedPath(path), false, path);
    const result = validatePath(path);
    assert.equal(result.status, 0, result.stderr);
  }
});

test('deployment repair does not admit its own validator or access-control edits', () => {
  for (const path of ['.github/workflows/paris-code-repair.yml', '.env.production', 'lib/devstudio/infrastructure-repair.mjs', 'lib/devstudio/github-app-token.ts', 'scripts/gcp/secret-export.mjs', 'scripts/gcp/../credentials.mjs']) {
    assert.equal(blockedPath(path), true, path);
    assert.notEqual(validatePath(path).status, 0, path);
  }
});

test('a workflow file is actually written with App authority and cannot fall back to a job token', async () => {
  const calls = [];
  const factory = new Function('fetch', 'getGitHubHeaders', 'getGitHubAppToken', 'assertCommittedWriteReadback', compiled + '\nreturn writeFile;');
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    if (init?.method === 'PUT') return Response.json({ content: { sha: 'c'.repeat(40) }, commit: { sha: 'b'.repeat(40) } });
    if (url.includes('/git/ref/heads/')) return Response.json({ object: { sha: 'b'.repeat(40) } });
    return Response.json({ sha: 'c'.repeat(40), content: Buffer.from('owner-authorized fixture').toString('base64') });
  };
  const input = { path: '.github/workflows/deploy-google-store-runtime.yml', content: 'owner-authorized fixture', branch: 'studio/repair', message: 'Correct disk capacity' };
  const write = factory(fetcher, async () => ({ Authorization: 'Bearer job-fixture' }), async () => 'app-fixture', assertCommittedWriteReadback);
  assert.equal((await write(input)).commitSha, 'b'.repeat(40));
  assert.equal(calls[0].init.headers.Authorization, 'Bearer app-fixture');
  assert.equal(JSON.parse(calls[0].init.body).branch, 'studio/repair');
  const denied = factory(fetcher, async () => ({ Authorization: 'Bearer job-fixture' }), async () => null, assertCommittedWriteReadback);
  await assert.rejects(denied(input), /WORKFLOW_APP_AUTHORITY_REQUIRED/);
  assert.equal(calls.length, 3);
  assert.match(calls[1].url, /ref=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/);
  assert.match(calls[2].url, /git\/ref\/heads\/studio%2Frepair/);
});

const candidate = { branch: { name: 'studio/repair-abc', sha: 'b'.repeat(40) }, summary: 'Correct Store disk capacity.' };
test('independently validated infrastructure edits create a PR and enable protected auto-merge', async () => {
  const calls = [];
  const github = async (path, init) => {
    calls.push([path, init]);
    if (path.startsWith('/git/ref/')) return { object: { sha: candidate.branch.sha } };
    if (path.startsWith('/pulls?')) return [];
    return { number: 7, node_id: 'PR_7', state: 'open', html_url: 'https://github.com/example/pull/7' };
  };
  const mutations = [];
  const result = await openInfrastructureRepair({ candidate, repairId: 'repair-id', github, graphql: async body => mutations.push(body) });
  assert.equal(result.number, 7);
  assert.equal(result.headSha, candidate.branch.sha);
  assert.ok(calls.some(([path, init]) => path === '/pulls' && JSON.parse(init.body).base === 'main'));
  assert.equal(calls.some(([path]) => path === '/git/refs/heads/main'), false);
  assert.match(mutations[0].query, /enablePullRequestAutoMerge/);
});

test('a changed candidate cannot be published and a pending PR cannot be reported as merged', async () => {
  await assert.rejects(openInfrastructureRepair({ candidate, repairId: 'id', github: async () => ({ object: { sha: 'c'.repeat(40) } }) }), /CHANGED_AFTER_VALIDATION/);
  const pr = { head: { sha: candidate.branch.sha }, base: { ref: 'main' }, state: 'open', merged: false };
  assert.equal(infrastructureMergeEvidence(pr, candidate.branch.sha), null);
  assert.equal(infrastructureMergeEvidence({ ...pr, merged: true, merge_commit_sha: 'c'.repeat(40) }, candidate.branch.sha), 'c'.repeat(40));
  assert.throws(() => infrastructureMergeEvidence({ ...pr, head: { sha: 'd'.repeat(40) } }, candidate.branch.sha), /PULL_REQUEST_CHANGED/);
});

test('publication reuses the same PR and propagates a protected auto-merge rejection', async () => {
  const existing = { number: 7, node_id: 'PR_7', state: 'open', base: { ref: 'main' }, head: { sha: candidate.branch.sha }, html_url: 'https://github.com/example/pull/7' };
  const github = async (path, init) => {
    assert.equal(init, undefined, 'existing PR must not be duplicated');
    return path.startsWith('/git/ref/') ? { object: { sha: candidate.branch.sha } } : [existing];
  };
  await assert.rejects(openInfrastructureRepair({ candidate, repairId: 'id', github, graphql: async () => { throw Error('Protected merge rejected'); } }), /Protected merge rejected/);
});

test('infrastructure completion also requires the Store release workflow', () => {
  const sha = 'c'.repeat(40);
  const runs = REPAIR_DEPLOYMENTS.map((d, i) => ({ id: i, head_sha: sha, name: d.name, path: '.github/workflows/' + d.workflow, event: 'workflow_dispatch', status: 'completed', conclusion: 'success' }));
  const deployments = [...REPAIR_DEPLOYMENTS, STORE_REPAIR_DEPLOYMENT];
  assert.equal(repairDeploymentState(runs, sha, deployments), 'pending');
  assert.equal(nextRepairDeployment(runs, sha, [], deployments), STORE_REPAIR_DEPLOYMENT.workflow);
  assert.equal(repairDeploymentState([...runs, { ...runs[0], name: STORE_REPAIR_DEPLOYMENT.name, path: '.github/workflows/' + STORE_REPAIR_DEPLOYMENT.workflow }], sha, deployments), 'passed');
});

test('deployment repairs can isolate build checks but must retain release authority and prerequisites', () => {
  const before = { on: { push: { branches: ['main'] } }, permissions: { contents: 'read' }, jobs: { build: { needs: 'validate', environment: 'production', steps: [{ name: 'Smoke', run: 'node scripts/gcp/smoke-marketing-container.mjs' }] } } };
  const after = structuredClone(before);
  after.jobs.preflight = { steps: after.jobs.build.steps };
  after.jobs.build.steps = [];
  after.jobs.build.needs = ['validate', 'preflight'];
  assert.doesNotThrow(() => assertDeploymentInvariants(before, after));
  for (const mutate of [
    value => { value.permissions.contents = 'write'; },
    value => { value.jobs.build.needs = []; },
    value => { value.jobs.preflight.steps = []; },
    value => { value.jobs.build.environment = 'unprotected'; },
  ]) {
    const rejected = structuredClone(after);
    mutate(rejected);
    assert.throws(() => assertDeploymentInvariants(before, rejected));
  }
});
