import test from 'node:test';
import assert from 'node:assert/strict';
import { activateStudioBrowserCandidate } from './activate-studio-browser-candidate.mjs';

const revision = 'elevate-studio-browser-00045-wer';
const expectedRevision = 'elevate-studio-browser-00039-yuv';
const sha = '7'.repeat(40), expectedSha = '2'.repeat(40);
const image = 'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/studio-browser';
const digest = 'sha256:' + 'a'.repeat(64);
function fixture(options = {}) {
  let live = options.alreadyActive ? revision : expectedRevision;
  let sessions = options.sessions ?? 4, generation = 1, recycled = false, inventoryCount = 0, restartHealthReads = 0;
  const events = [], reports = [];
  const resource = () => ({ status: { url: 'https://studio.test.run.app', traffic: [
    { revisionName: live, percent: 100 },
    { revisionName: revision, percent: 0, tag: 'studio-verify', url: 'https://candidate.test.run.app' },
  ] } });
  const run = args => {
    events.push({ type: 'google', args });
    if (args[0] === 'secrets') return 'fixture-secret-not-production';
    if (args[0] === 'artifacts') return digest;
    if (args[1] === 'revisions') return JSON.stringify({
      metadata: { labels: { 'serving.knative.dev/service': 'elevate-studio-browser' } },
      status: { imageDigest: image + '@' + (options.wrongDigest ? 'sha256:wrong' : digest), conditions: [{ type: 'Ready', status: 'True' }] },
    });
    if (args[2] === 'describe') return JSON.stringify(resource());
    if (args[2] === 'update-traffic') {
      live = args.includes('--to-revisions=' + revision + '=100') ? revision : expectedRevision;
      if (live === revision && options.cliTimeout) throw Error('upstream secret-bearing CLI output');
      return '';
    }
    throw Error('Unexpected Google command');
  };
  const health = commit => ({ commit, ready: true, providerAuthStorage: { ready: true, persistent: true },
    activeSessions: sessions, browserGeneration: generation, recycling: false });
  const request = async (url, config = {}) => {
    url = String(url); events.push({ type: 'http', url, method: config.method || 'GET' });
    const candidate = url.includes('candidate.');
    let status = 200, payload;
    if (url.endsWith('/health')) {
      payload = health(candidate ? (options.wrongSha ? expectedSha : sha) : live === revision ? sha : expectedSha);
      if (!candidate && live === revision && options.publicFailure) payload.ready = false;
      if (!candidate && recycled && live === expectedRevision && options.restartUnavailable && restartHealthReads++ < 2) status = 503;
    } else if (url.endsWith('/workspace/files')) {
      status = config.headers ? 200 : options.publicWorkspace ? 200 : 401;
      payload = { entries: [] };
    } else if (url.endsWith('/foundation-test')) {
      payload = { commit: sha, passed: !options.foundationFailure,
        checks: Array.from({ length: 15 }, (_, i) => ({ name: 'check-' + i, passed: true })) };
    } else if (url.endsWith('/admin/recycle')) {
      assert.equal(config.headers['x-studio-browser-secret'], 'fixture-secret-not-production');
      assert.equal(config.method, 'POST');
      assert.equal(candidate, false);
      recycled = true;
      if (!options.recycleStuck) { sessions = options.fastReconnect ? 1 : 0; generation++; }
      payload = { status: 'queued' };
    } else throw Error('Unexpected request');
    return { status, ok: status >= 200 && status < 300, json: async () => payload };
  };
  const inventory = async () => {
    inventoryCount++;
    if (inventoryCount > 1 && options.newSession) sessions = options.newSessionCount ?? 1;
    const result = { commit: expectedSha, activeBrowserSessions: sessions,
      workspace: { files: 0, symlinks: 0 }, directChildShells: 0,
      directNonBrowserProcesses: 0, processInventoryReadable: true };
    if (options.files) result.workspace.files = 1;
    if (options.newFile && inventoryCount > 1) result.workspace.files = 1;
    if (options.shells) result.directChildShells = 1;
    if (options.unknownProcess) result.directNonBrowserProcesses = 1;
    if (options.unreadable) result.processInventoryReadable = false;
    if (options.sourceShaChanged) result.commit = 'f'.repeat(40);
    if (options.sourceTrafficChanged) live = 'elevate-studio-browser-00046-other';
    return result;
  };
  return { args: { revision, sha, expectedRevision, expectedSha, closeSessions: true, run, request, inventory,
    pause: async () => {}, report: value => reports.push(value) }, events, reports,
    state: () => ({ live, sessions, recycled }),
    writes: () => events.filter(e => e.type === 'google' && e.args[2] === 'update-traffic') };
}

test('verifies candidate before closing only approved sessions and activates the exact digest', async () => {
  const f = fixture();
  const result = await activateStudioBrowserCandidate(f.args);
  assert.equal(result.sessionsClosed, 4);
  assert.equal(result.commit, sha);
  assert.equal(result.digest, digest);
  assert.equal(result.oldRevisionRetained, true);
  assert.equal(result.adminConfigurationChanged, false);
  assert.deepEqual(f.state(), { live: revision, sessions: 0, recycled: true });
  assert.equal(f.writes().length, 1);
  assert.ok(f.events.findIndex(e => e.url?.endsWith('/foundation-test')) < f.events.findIndex(e => e.url?.endsWith('/admin/recycle')));
  assert.ok(!JSON.stringify(f.reports).includes('fixture-secret'));
});

for (const option of ['wrongDigest', 'wrongSha', 'publicWorkspace', 'foundationFailure', 'files', 'shells',
  'unknownProcess', 'unreadable', 'sourceShaChanged', 'sourceTrafficChanged']) {
  test('retains all sessions and traffic when ' + option, async () => {
    const f = fixture({ [option]: true });
    await assert.rejects(activateStudioBrowserCandidate(f.args));
    assert.equal(f.state().recycled, false);
    assert.equal(f.writes().length, 0);
  });
}

test('never closes sessions without explicit approval', async () => {
  const f = fixture();
  await assert.rejects(activateStudioBrowserCandidate({ ...f.args, closeSessions: false }), /CLOSURE_NOT_APPROVED/);
  assert.equal(f.state().recycled, false);
  assert.equal(f.writes().length, 0);
});
test('never expands the approved four-session limit', async () => {
  const f = fixture({ sessions: 5 });
  await assert.rejects(activateStudioBrowserCandidate(f.args), /SOURCE_STATE_CHANGED/);
  assert.equal(f.state().recycled, false);
});
for (const option of ['newFile', 'recycleStuck']) {
  test('does not switch traffic with unsafe post-recycle state: ' + option, async () => {
    const f = fixture({ [option]: true });
    await assert.rejects(activateStudioBrowserCandidate(f.args));
    assert.equal(f.writes().length, 0);
  });
}
test('approved automatic browser reconnects do not indefinitely block cutover', async () => {
  const f = fixture({ newSession: true });
  const result = await activateStudioBrowserCandidate(f.args);
  assert.equal(result.sessionsClosed, 4);
  assert.equal(result.reconnectedBrowserSessions, 1);
  assert.equal(f.state().live, revision);
});
test('a reconnect before the first health poll still proves old-session retirement by generation', async () => {
  const f = fixture({ fastReconnect: true });
  const result = await activateStudioBrowserCandidate(f.args);
  assert.equal(result.sessionsClosed, 4);
  assert.equal(result.reconnectedBrowserSessions, 1);
  assert.equal(f.state().live, revision);
});
test('automatic reconnects still require browser-session closure approval', async () => {
  const f = fixture({ sessions: 0, newSession: true });
  await assert.rejects(activateStudioBrowserCandidate({ ...f.args, closeSessions: false }), /REQUIRES_PRESERVATION/);
  assert.equal(f.writes().length, 0);
});
test('automatic reconnects never expand the four-session approval', async () => {
  const f = fixture({ newSession: true, newSessionCount: 5 });
  await assert.rejects(activateStudioBrowserCandidate(f.args), /REQUIRES_PRESERVATION/);
  assert.equal(f.writes().length, 0);
});
for (const option of ['publicFailure', 'cliTimeout']) {
  test('rolls back an unsuccessful activation: ' + option, async () => {
    const f = fixture({ [option]: true });
    await assert.rejects(activateStudioBrowserCandidate(f.args), /TRAFFIC_RESTORED/);
    assert.equal(f.writes().length, 2);
    assert.equal(f.state().live, expectedRevision);
  });
}
test('already-active retry leaves new sessions untouched', async () => {
  const f = fixture({ alreadyActive: true });
  const result = await activateStudioBrowserCandidate(f.args);
  assert.equal(result.alreadyActive, true);
  assert.equal(result.trafficChanged, false);
  assert.equal(f.state().sessions, 4);
  assert.equal(f.state().recycled, false);
  assert.equal(f.writes().length, 0);
});
test('empty source needs no recycle', async () => {
  const f = fixture({ sessions: 0 });
  const result = await activateStudioBrowserCandidate({ ...f.args, closeSessions: false });
  assert.equal(result.sessionsClosed, 0);
  assert.equal(f.state().recycled, false);
  assert.equal(result.trafficChanged, true);
});
test('waits through expected 503 responses during Chromium recycle', async () => {
  const f = fixture({ restartUnavailable: true });
  const result = await activateStudioBrowserCandidate(f.args);
  assert.equal(result.sessionsClosed, 4);
  assert.equal(result.trafficChanged, true);
});
