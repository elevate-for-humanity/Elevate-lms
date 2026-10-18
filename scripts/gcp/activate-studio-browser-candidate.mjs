import { pathToFileURL } from 'node:url';
import { google, PROJECT } from './runtime-config.mjs';
import { inventoryStudioLiveState } from './inventory-studio-live-state.mjs';

const service = 'elevate-studio-browser';
const scope = ['--project=' + PROJECT, '--region=us-central1'];
const revisionPattern = /^elevate-studio-browser-[a-z0-9-]+$/;
const shaPattern = /^[a-f0-9]{40}$/;
function endpoint(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.run.app') || url.username || url.password)
    throw Error('STUDIO_ENDPOINT_UNVERIFIED');
  return url.origin;
}
function serving(resource) {
  return (resource.status?.traffic || []).filter(t => t.percent > 0).map(t => ({ revision: t.revisionName, percent: t.percent }));
}
function emptyWorkspace(state) {
  if (state.workspace?.files !== 0 || state.workspace?.symlinks !== 0 ||
      state.directChildShells !== 0 || state.directNonBrowserProcesses !== 0 || state.processInventoryReadable !== true)
    throw Error('STUDIO_LIVE_STATE_REQUIRES_PRESERVATION');
}

// This operation uses an already-built revision. It never rebuilds a service,
// changes credentials/IAM, deletes workspace files, or touches course workers.
export async function activateStudioBrowserCandidate({
  revision, sha, expectedRevision, expectedSha, closeSessions = false,
  run = google, request = fetch, inventory = inventoryStudioLiveState,
  pause = ms => new Promise(resolve => setTimeout(resolve, ms)), report = value => console.log(JSON.stringify(value)),
} = {}) {
  if (![revision, expectedRevision].every(v => revisionPattern.test(v || '')) ||
      ![sha, expectedSha].every(v => shaPattern.test(v || '')) || revision === expectedRevision)
    throw Error('STUDIO_EXACT_REVISIONS_REQUIRED');
  const describe = () => JSON.parse(run(['run', 'services', 'describe', service, ...scope, '--format=json']));
  const initial = describe();
  const base = endpoint(initial.status?.url);
  const json = async (url, options = {}) => {
    const response = await request(url, { redirect: 'error', signal: AbortSignal.timeout(120000), ...options });
    if (!response.ok) throw Error('STUDIO_HTTP_' + response.status);
    return response.json();
  };
  const healthy = (health, commit) => health?.commit === commit && health.ready === true &&
    health.providerAuthStorage?.ready === true && health.providerAuthStorage?.persistent === true;
  if (JSON.stringify(serving(initial)) === JSON.stringify([{ revision, percent: 100 }])) {
    if (!healthy(await json(base + '/health'), sha)) throw Error('STUDIO_LIVE_REVISION_UNVERIFIED');
    return { revision, commit: sha, alreadyActive: true, sessionsClosed: 0, trafficChanged: false };
  }
  const expectedTraffic = [{ revision: expectedRevision, percent: 100 }];
  const assertSource = resource => {
    if (JSON.stringify(serving(resource)) !== JSON.stringify(expectedTraffic)) throw Error('STUDIO_SERVING_REVISION_CHANGED');
  };
  assertSource(initial);
  const candidate = initial.status?.traffic?.find(t => t.revisionName === revision && t.tag && t.url);
  if (!candidate) throw Error('STUDIO_EXISTING_CANDIDATE_TAG_REQUIRED');
  const candidateUrl = endpoint(candidate.url);
  const details = JSON.parse(run(['run', 'revisions', 'describe', revision, ...scope, '--format=json']));
  if (details.metadata?.labels?.['serving.knative.dev/service'] !== service ||
      !details.status?.conditions?.some(c => c.type === 'Ready' && c.status === 'True'))
    throw Error('STUDIO_CANDIDATE_REVISION_NOT_READY');
  const image = 'us-central1-docker.pkg.dev/' + PROJECT + '/elevate/studio-browser';
  const digest = run(['artifacts', 'docker', 'images', 'describe', image + ':' + sha,
    '--project=' + PROJECT, '--format=value(image_summary.digest)']);
  if (!/^sha256:[a-f0-9]{64}$/.test(digest) || details.status?.imageDigest !== image + '@' + digest)
    throw Error('STUDIO_CANDIDATE_IMAGE_UNVERIFIED');
  const secret = run(['secrets', 'versions', 'access', 'latest', '--secret=studio-browser-shared-secret', '--project=' + PROJECT]);
  if (!secret || secret.length < 16) throw Error('STUDIO_CANONICAL_SECRET_UNAVAILABLE');
  const headers = { 'content-type': 'application/json', 'x-studio-browser-secret': secret };
  if (!healthy(await json(candidateUrl + '/health'), sha)) throw Error('STUDIO_CANDIDATE_HEALTH_UNVERIFIED');
  const anonymous = await request(candidateUrl + '/workspace/files', { redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (anonymous.status !== 401) throw Error('STUDIO_AUTH_BOUNDARY_UNVERIFIED');
  await json(candidateUrl + '/workspace/files', { headers });
  const foundation = await json(candidateUrl + '/foundation-test', { method: 'POST', headers });
  if (foundation.passed !== true || foundation.commit !== sha || !Array.isArray(foundation.checks) ||
      foundation.checks.length < 15 || foundation.checks.some(c => c.passed !== true))
    throw Error('STUDIO_FOUNDATION_UNVERIFIED');
  report({ revision, commit: sha, digest, foundationPassed: true, checks: foundation.checks.map(c => ({ name: c.name, passed: c.passed })) });
  const before = await inventory({ run, request });
  emptyWorkspace(before);
  if (before.commit !== expectedSha || !Number.isInteger(before.activeBrowserSessions) ||
      before.activeBrowserSessions < 0 || before.activeBrowserSessions > 4)
    throw Error('STUDIO_APPROVED_SOURCE_STATE_CHANGED');
  assertSource(describe());
  if (before.activeBrowserSessions > 0) {
    if (closeSessions !== true) throw Error('STUDIO_SESSION_CLOSURE_NOT_APPROVED');
    const previous = await json(base + '/health');
    if (!healthy(previous, expectedSha) || previous.activeSessions !== before.activeBrowserSessions || previous.recycling)
      throw Error('STUDIO_APPROVED_SOURCE_STATE_CHANGED');
    const recycled = await json(base + '/admin/recycle', { method: 'POST', headers,
      body: JSON.stringify({ reason: 'owner_approved_browser_replacement' }) });
    if (recycled.status !== 'queued') throw Error('STUDIO_RECYCLE_NOT_QUEUED');
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        const health = await json(base + '/health');
        if (healthy(health, expectedSha) && health.browserGeneration > previous.browserGeneration &&
            health.activeSessions === 0 && !health.recycling) { ready = true; break; }
      } catch { /* The old service returns 503 while Chromium restarts. */ }
      await pause(1000);
    }
    if (!ready) throw Error('STUDIO_SESSION_CLOSURE_UNVERIFIED');
  }
  const after = await inventory({ run, request });
  emptyWorkspace(after);
  if (after.commit !== expectedSha || after.activeBrowserSessions !== 0)
    throw Error('STUDIO_LIVE_STATE_REQUIRES_PRESERVATION');
  assertSource(describe());
  report({ sourceRevision: expectedRevision, sessionsClosed: before.activeBrowserSessions, activeSessions: 0, workspaceFiles: 0, terminalProcesses: 0 });
  // Roll back even if the CLI times out after the server accepted the update.
  try {
    run(['run', 'services', 'update-traffic', service, ...scope, '--to-revisions=' + revision + '=100', '--quiet']);
    let accepted = false;
    for (let attempt = 0; attempt < 18; attempt++) {
      try {
        if (healthy(await json(base + '/health'), sha)) { accepted = true; break; }
      } catch { /* Allow the traffic update to propagate. */ }
      await pause(3000);
    }
    if (!accepted || JSON.stringify(serving(describe())) !== JSON.stringify([{ revision, percent: 100 }]))
      throw Error('STUDIO_LIVE_REVISION_UNVERIFIED');
  } catch {
    run(['run', 'services', 'update-traffic', service, ...scope, '--to-revisions=' + expectedRevision + '=100', '--quiet']);
    throw Error('STUDIO_ACTIVATION_FAILED_TRAFFIC_RESTORED');
  }
  return { revision, commit: sha, digest, ready: true, persistent: true, sessionsClosed: before.activeBrowserSessions,
    trafficChanged: true, oldRevisionRetained: true, adminConfigurationChanged: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await activateStudioBrowserCandidate({
      revision: process.env.STUDIO_CANDIDATE_REVISION, sha: process.env.IMAGE_SHA,
      expectedRevision: process.env.STUDIO_SOURCE_REVISION, expectedSha: process.env.STUDIO_SOURCE_SHA,
      closeSessions: process.env.STUDIO_CLOSE_APPROVED_SESSIONS === 'true',
    })));
  } catch (error) {
    // Never print upstream response bodies or credentials.
    const message = String(error?.message || '');
    console.error(JSON.stringify({ error: /^STUDIO_[A-Z_0-9]+$/.test(message) ? message : 'STUDIO_CANDIDATE_ACTIVATION_FAILED' }));
    process.exitCode = 1;
  }
}
