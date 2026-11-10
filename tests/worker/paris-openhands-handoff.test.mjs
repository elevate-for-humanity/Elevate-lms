import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {prepareOpenHandsRepair, parisRepairEngine, assertOpenHandsRepairDiff, assertOpenHandsBlobReadback} from '../../lib/devstudio/paris-openhands-repair.mjs';
import {classifyParisPhaseError} from '../../lib/devstudio/paris-phase-error.mjs';

const input = {repairId: '11111111-1111-4111-8111-111111111111', actorId: 'owner', attempt: 1, runId: 12, goal: 'Correct the confirmed layout bug.'};
const base = 'a'.repeat(40), head = 'b'.repeat(40);
const engineer = readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts', import.meta.url), 'utf8');
const compiledEngineer = stripTypeScriptTypes(engineer).replace(/^import[\s\S]*?;\n/gm, '').replaceAll('export ', '');
const blockedPath = new Function('REPAIR_INFERENCE_TIMEOUT_MS', 'REPAIR_MODEL_PROBE_TIMEOUT_MS', compiledEngineer + '\nreturn blockedPath;')(210000, 55000);
function file(filename, status, content = 'real committed source bytes') {
  const bytes = Buffer.from(content);
  const sha = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  return {filename, status, sha, observed: {type: 'file', encoding: 'base64', sha, size: bytes.length, content: bytes.toString('base64')}};
}
const sourceFile = file('components/RepairablePanel.tsx', 'modified');
const testFile = file('tests/unit/panel-repair.test.ts', 'added', 'independent regression test');
const comparison = {status: 'ahead', behind_by: 0, total_commits: 2, files: [sourceFile, testFile]};

function harness(overrides = {}) {
  const h = {cp: null, task: null, dispatches: 0, refreshes: 0, now: 1000, lifecycle: {status: 'running'}, ...overrides};
  h.deps = {
    now: () => h.now, mainSha: async () => base, ensureBranch: async () => {},
    save: async cp => {h.cp = structuredClone(cp);}, findTask: async () => h.task,
    dispatch: async request => {
      h.dispatches++;
      assert.equal(h.cp.dispatchRequested, true, 'intent must be durable before external start');
      assert.equal(request.maxAttempts, 1, 'PARIS must not launch automatic replacement conversations');
      h.task = {id: 'tracked-task', user_id: input.actorId, tenant_id: null, tool_name: 'openhands.execute',
        tool_input: {repository: request.repository, branch: request.branch}, command: request.task, correlation_id: request.correlationId,
        tool_output: {start_task_id: 'provider-start'}, status: 'running', requires_approval: false, approval_status: 'not_required'};
      return {taskId: h.task.id, startTaskId: 'provider-start'};
    },
    refresh: async () => {h.refreshes++; return {task: h.task, lifecycle: h.lifecycle};},
    readCandidate: async cp => ({branch: {name: cp.branch, sha: head}, base_sha: cp.baseSha,
      release: {status: 'pending-validation', verifiedLive: false}}),
  };
  h.run = extra => prepareOpenHandsRepair({...input, checkpoint: h.cp, ...extra}, h.deps);
  return h;
}

test('new PARIS repairs select OpenHands while an internal checkpoint retains its engine', () => {
  assert.equal(parisRepairEngine(null), 'openhands');
  assert.equal(parisRepairEngine({kind: 'openhands-checkpoint'}), 'openhands');
  assert.equal(parisRepairEngine({kind: 'planner-checkpoint', checkpoint: {writes: 2}}), 'internal');
});
test('OpenHands failures expose only exact safe state codes and retain approval and ambiguous-start distinctions', () => {
  for (const [message, status] of [['PARIS_OPENHANDS_APPROVAL_REQUIRED',403], ['PARIS_OPENHANDS_START_UNCONFIRMED',409],
    ['PARIS_OPENHANDS_SOURCE_AND_NEW_TEST_REQUIRED',422], ['PARIS_OPENHANDS_NOT_CONFIGURED',503], ['PARIS_OPENHANDS_WAIT_DEADLINE',504]]) {
    assert.deepEqual(classifyParisPhaseError(Error(message)), {errorCode: message, status});
  }
  assert.deepEqual(classifyParisPhaseError(Error('OpenHands provider detail secret-token-value')), {errorCode:'PARIS_REPAIR_PHASE_FAILED', status:502});
});
test('starts exactly one tracked task, persists before start, then polls that same task', async () => {
  const h = harness();
  assert.deepEqual(await h.run(), {pending: true, provider: 'openhands', taskId: 'tracked-task', retryAfterSeconds: 30});
  assert.equal((await h.run()).pending, true);
  assert.equal((await h.run()).pending, true);
  assert.equal(h.dispatches, 1); assert.equal(h.refreshes, 2);
  assert.match(h.task.command, /Push only that branch/);
  assert.match(h.task.command, /Do not merge, deploy/);
});
test('a failed checkpoint save prevents provider dispatch', async () => {
  const h = harness(); h.deps.save = async () => {throw Error('checkpoint unavailable');};
  await assert.rejects(h.run(), /checkpoint unavailable/); assert.equal(h.dispatches, 0);
});
test('an ambiguous start without a ledger receipt is not replayed', async () => {
  const h = harness(); h.deps.dispatch = async () => {h.dispatches++; throw Error('transport lost');};
  await assert.rejects(h.run(), /transport lost/);
  await assert.rejects(h.run(), /START_UNCONFIRMED/); assert.equal(h.dispatches, 1);
});
test('a persisted canonical receipt resumes after the start response is lost', async () => {
  const h = harness(); const dispatch = h.deps.dispatch;
  h.deps.dispatch = async r => {await dispatch(r); throw Error('response lost');};
  await assert.rejects(h.run(), /response lost/);
  assert.equal((await h.run()).pending, true); assert.equal(h.dispatches, 1);
});
test('a terminal provider failure is retained without starting a replacement', async () => {
  const h = harness(); await h.run(); h.lifecycle = {status: 'failed'};
  await assert.rejects(h.run(), /EXECUTION_FAILED/); assert.equal(h.dispatches, 1);
});
test('approval gates are preserved before and after provider polling', async () => {
  const h = harness(); await h.run(); h.task.requires_approval = true; h.task.approval_status = 'pending';
  await assert.rejects(h.run(), /APPROVAL_REQUIRED/); assert.equal(h.refreshes, 0);
  h.task.requires_approval = false; h.task.approval_status = 'not_required';
  h.deps.refresh = async () => ({task: {...h.task, requires_approval: true, approval_status: 'pending'}, lifecycle: {status: 'completed'}});
  await assert.rejects(h.run(), /APPROVAL_REQUIRED/); assert.equal(h.dispatches, 1);
});
test('checkpoint owner, attempt, workflow, and immutable goal cannot be substituted', async () => {
  for (const replacement of [{actorId: 'someone-else'}, {attempt: 2}, {runId: 13}, {goal: 'Different authority'}]) {
    const h = harness(); await h.run(); await assert.rejects(h.run(replacement), /CHECKPOINT_OWNERSHIP_MISMATCH/);
    assert.equal(h.dispatches, 1); assert.equal(h.refreshes, 0);
  }
});
test('canonical task ownership and command cannot be substituted', async () => {
  for (const replacement of [{user_id: 'other'}, {command: 'other'}, {tenant_id: 'other'}, {correlation_id: 'other'}, {id: 'other'}]) {
    const h = harness(); await h.run(); Object.assign(h.task, replacement);
    await assert.rejects(h.run(), /TASK_OWNERSHIP_MISMATCH/); assert.equal(h.refreshes, 0);
  }
});
test('expired waiting stops without deleting the receipt or restarting the external job', async () => {
  const h = harness(); await h.run(); const taskId = h.cp.taskId; h.now += 36 * 60_000;
  await assert.rejects(h.run(), /WAIT_DEADLINE/); assert.equal(h.cp.taskId, taskId); assert.equal(h.dispatches, 1);
});
test('provider completion on main, another branch or repository cannot become a PARIS candidate', async () => {
  for (const replacement of [{branch: 'main'}, {branch: 'studio/other'}, {repository: 'other/repo'}]) {
    const h = harness(); await h.run(); h.lifecycle = {status: 'completed', repository: 'elevate-for-humanity/Elevate-lms', branch: h.cp.branch, ...replacement};
    await assert.rejects(h.run(), /BRANCH_MISMATCH/);
  }
});
test('completion only yields an independently read candidate awaiting validation, never live success', async () => {
  const h = harness(); await h.run(); h.lifecycle = {status: 'completed', repository: 'elevate-for-humanity/Elevate-lms', branch: h.cp.branch};
  const result = await h.run(); assert.equal(result.branch.sha, head); assert.equal(result.release.verifiedLive, false);
  assert.equal(result.release.status, 'pending-validation'); assert.equal(h.dispatches, 1);
});
test('diff gate requires a source correction and an added regression test on a descendant commit', () => {
  assert.deepEqual(assertOpenHandsRepairDiff(comparison, blockedPath), [sourceFile.filename, testFile.filename]);
  for (const replacement of [{files: []}, {files: [testFile]}, {files: [sourceFile]}, {status: 'diverged'}, {behind_by: 1}, {total_commits: 0}, {files: Array(7).fill(sourceFile)}]) {
    assert.throws(() => assertOpenHandsRepairDiff({...comparison, ...replacement}, blockedPath));
  }
});
test('protected scope and all existing tests remain blocked, including the new handoff controller', () => {
  for (const path of ['lib/auth/access.ts', 'lib/devstudio/paris-openhands-adapter.ts', 'lib/devstudio/paris-openhands-repair.mjs', '.github/workflows/paris-code-repair.yml', 'AGENTS.md', '.env', 'lib/payments/charge.ts', 'lib/secret.ts', 'scripts/gcp/../escape.mjs']) {
    assert.throws(() => assertOpenHandsRepairDiff({...comparison, files: [file(path, 'modified'), testFile]}, blockedPath), /PROTECTED_REPAIR_BOUNDARY/);
  }
  assert.throws(() => assertOpenHandsRepairDiff({...comparison, files: [sourceFile, {...testFile, status: 'modified'}]}, blockedPath), /EXISTING_TEST_CHANGED/);
  for (const status of ['removed', 'renamed', 'copied']) assert.throws(() => assertOpenHandsRepairDiff({...comparison, files: [{...sourceFile, status}, testFile]}, blockedPath));
});
test('exact-byte blob readback rejects wrong hashes, content and truncated bytes', () => {
  assert.equal(assertOpenHandsBlobReadback(sourceFile, sourceFile.observed).sha, sourceFile.sha);
  for (const patch of [{sha: head}, {content: Buffer.from('different bytes').toString('base64')}, {size: 0}, {encoding: 'none'}, {type: 'symlink'}]) {
    assert.throws(() => assertOpenHandsBlobReadback(sourceFile, {...sourceFile.observed, ...patch}), /BLOB_READBACK_MISMATCH/);
  }
});

test('actual server adapter reads the assigned GitHub branch and hashes all committed bytes before validation', async () => {
  const adapter = readFileSync(new URL('../../lib/devstudio/paris-openhands-adapter.ts', import.meta.url), 'utf8');
  const compiled = stripTypeScriptTypes(adapter).replace(/^import[\s\S]*?;\n/gm, '').replaceAll('export ', '');
  const h = harness({now: Date.now()}); await h.run(); h.lifecycle = {status: 'completed', repository: 'elevate-for-humanity/Elevate-lms', branch: h.cp.branch};
  const db = {from(table) {
    const q = {select() {return q;}, eq() {return q;}, maybeSingle: async () => ({data: {role: h.role ?? 'admin'}}), limit: async () => ({data: [h.task]})};
    assert.ok(['profiles', 'ai_tasks'].includes(table)); return q;
  }};
  let refReads = 0;
  const request = async url => {
    if (url.includes('/compare/')) return Response.json(comparison);
    if (url.includes('/contents/')) {
      assert.ok(url.endsWith(`?ref=${head}`));
      const f = url.includes(sourceFile.filename) ? sourceFile : testFile;
      return Response.json(h.tamper ? {...f.observed, content: Buffer.from('tampered').toString('base64')} : f.observed);
    }
    refReads++;
    return Response.json({object: {sha: h.moved && refReads > 1 ? 'c'.repeat(40) : head}});
  };
  const stage = new Function('requireAdminClient', 'getGitHubHeaders', 'dispatchOpenHandsTask', 'refreshOpenHandsTask',
    'getHydratedOpenHandsConfig', 'blockedPath', 'prepareOpenHandsRepair', 'assertOpenHandsRepairDiff', 'assertOpenHandsBlobReadback', 'fetch',
    compiled + '\nreturn stageParisOpenHandsRepair;')(
    async () => db, async () => ({}), h.deps.dispatch, async () => h.lifecycle,
    async () => ({configured: h.configured !== false, configuredRepository: 'elevate-for-humanity/Elevate-lms'}), blockedPath,
    prepareOpenHandsRepair, assertOpenHandsRepairDiff, assertOpenHandsBlobReadback, request);
  const result = await stage({...input, checkpoint: h.cp, save: h.deps.save});
  assert.equal(result.branch.sha, head); assert.equal(result.committed_readbacks.length, 2); assert.equal(result.release.verifiedLive, false);
  h.moved = true; refReads = 0;
  await assert.rejects(stage({...input, checkpoint: h.cp, save: h.deps.save}), /CHANGED_DURING_READBACK/);
  h.moved = false; h.tamper = true;
  await assert.rejects(stage({...input, checkpoint: h.cp, save: h.deps.save}), /BLOB_READBACK_MISMATCH/);
  h.tamper = false; h.role = 'student';
  await assert.rejects(stage({...input, checkpoint: h.cp, save: h.deps.save}), /OWNER_AUTHORITY_REQUIRED/);
  h.role = 'admin'; h.configured = false;
  await assert.rejects(stage({...input, checkpoint: h.cp, save: h.deps.save}), /NOT_CONFIGURED/);
  assert.equal(h.dispatches, 1);
});

test('actual Cloud client selects the assigned repair branch and rejects invalid branch input before calling the provider', async () => {
  const source = readFileSync(new URL('../../lib/devstudio/openhands/client.ts', import.meta.url), 'utf8');
  const compiled = stripTypeScriptTypes(source).replace(/^import[\s\S]*?;\n/gm, '').replaceAll('export ', '');
  const calls = [];
  const request = async (url, init) => {calls.push({url, init}); return Response.json({id: 'start', status: 'WORKING'});};
  const start = new Function('hydrateProcessEnv', 'fetch', 'process', compiled + '\nreturn startOpenHandsTask;')(
    async () => {}, request, {env: {OPENHANDS_API_KEY: 'isolated-fixture'}});
  await start({message: 'Authorized repair', branch: 'studio/repair-assigned'});
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.selected_branch, 'studio/repair-assigned');
  assert.equal(body.selected_repository, 'elevate-for-humanity/Elevate-lms');
  for (const branch of ['../main', 'a//b', 'a.lock', 'a/', 'a\nmain']) await assert.rejects(start({message: 'Repair', branch}), /branch is invalid/);
  assert.equal(calls.length, 1);
});
