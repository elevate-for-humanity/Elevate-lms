import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

async function resolver({deployed, canonical, statuses = [], storeError, workflow, canonicalReads, app, appError}) {
  const source = await readFile(new URL('../lib/devstudio/github-token.ts', import.meta.url), 'utf8');
  const calls = [];
  let storeReads = 0;
  const injected = source
    .replace("import { getDecryptedPlatformSecret } from '@/lib/secrets';", '')
    .replace("import { currentWorkflowGitHubToken } from './workflow-github-context';", '')
    .replace("import { getGitHubAppToken } from './github-app-token';", '')
    .replaceAll('process.env.GITHUB_TOKEN', 'environment.GITHUB_TOKEN');
  const factory = new Function('getDecryptedPlatformSecret', 'fetch', 'environment', 'currentWorkflowGitHubToken', 'getGitHubAppToken',
    stripTypeScriptTypes(injected).replaceAll('export ', '') + '\nreturn {getGitHubToken, getGitHubHeaders, getGitHubTokenCandidates};');
  const api = factory(async () => { storeReads++; if (storeError) throw storeError; return canonicalReads ? canonicalReads.shift() : canonical; },
    async (url, init) => { calls.push({url, init}); return new Response(null, {status: statuses.shift() ?? 200}); },
    {GITHUB_TOKEN: deployed}, () => workflow, async () => { if (appError) throw appError; return app ?? null; });
  return {...api, calls, storeReads: () => storeReads};
}

test('the selected canonical credential is checked without probing an expired duplicate', async () => {
  const r = await resolver({deployed:'expired-deployment-token', canonical:'accepted-stored-token', statuses:[200]});
  assert.equal(await r.getGitHubToken(), 'accepted-stored-token');
  assert.deepEqual(r.calls.map(c => c.init.headers.Authorization), ['Bearer accepted-stored-token']);
});
test('accepted deployment credential works when no canonical credential exists', async () => {
  const r = await resolver({deployed:'accepted-deployment-token'});
  assert.equal(await r.getGitHubToken(), 'accepted-deployment-token');
  assert.equal(r.storeReads(), 1);
  assert.equal(r.calls.length, 1);
});
test('missing credentials do not contact GitHub', async () => {
  const r = await resolver({});
  assert.equal(await r.getGitHubToken(), null);
  assert.equal(r.calls.length, 0);
});
test('duplicate rejected sources are probed once and never exposed in errors', async () => {
  const secret = 'rejected-fixture-credential';
  const r = await resolver({deployed:secret, canonical:secret, statuses:[401]});
  await assert.rejects(r.getGitHubToken(), error => /GITHUB_TOKEN_REJECTED/.test(error.message) && !error.message.includes(secret));
  assert.equal(r.calls.length, 1);
});
test('GitHub outage remains a service failure rather than a credential rejection', async () => {
  const r = await resolver({deployed:'accepted-deployment-token', statuses:[503]});
  await assert.rejects(r.getGitHubToken(), /GITHUB_CREDENTIAL_CHECK_UNAVAILABLE_HTTP_503/);
  assert.equal(r.storeReads(), 1);
});
test('credential validation stays on the exact repository and forbids redirects', async () => {
  const r = await resolver({deployed:'stored-token-fixture'});
  const headers = await r.getGitHubHeaders();
  assert.equal(headers.Authorization, 'Bearer stored-token-fixture');
  assert.equal(r.calls[0].url, 'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/ref/heads/main');
  assert.equal(r.calls[0].init.redirect, 'error');
  assert.equal(r.calls[0].init.cache, 'no-store');
});

// The runtime deliberately prefers rotating platform credentials over a pinned
// deployment environment value. The signed workflow context has narrower scope.
test('canonical rotating credential takes precedence without pinning deployment state', async () => {
  const r = await resolver({deployed:'old-deployment-token', canonical:'current-platform-token'});
  assert.equal(await r.getGitHubToken(), 'current-platform-token');
  assert.equal(r.storeReads(), 1);
  assert.equal(r.calls.length, 1);
});
test('verified workflow context does not read platform credentials or make a probe', async () => {
  const r = await resolver({workflow:'request-scoped-workflow-token', storeError:new Error('must not read')});
  assert.equal(await r.getGitHubToken(), 'request-scoped-workflow-token');
  assert.equal(r.storeReads(), 0);
  assert.equal(r.calls.length, 0);
});
test('canonical store failure fails closed instead of silently selecting a stale deployment token', async () => {
  const r = await resolver({deployed:'old-deployment-token', storeError:new Error('store unavailable')});
  await assert.rejects(r.getGitHubToken(), /store unavailable/);
  assert.equal(r.calls.length, 0);
});

test('App credentials precede legacy credentials for requests and dispatch', async () => {
  const r = await resolver({app:'installation-token-fixture', storeError:new Error('must not read')});
  assert.equal(await r.getGitHubToken(), 'installation-token-fixture');
  assert.deepEqual(await r.getGitHubTokenCandidates(), ['installation-token-fixture']);
  assert.equal(r.storeReads(), 0);
});
test('App failure never silently falls back to a personal credential', async () => {
  const r = await resolver({appError:new Error('GITHUB_APP_CONFIGURATION_INVALID'), canonical:'legacy-personal-token'});
  await assert.rejects(r.getGitHubToken(), /GITHUB_APP_CONFIGURATION_INVALID/);
  await assert.rejects(r.getGitHubTokenCandidates(), /GITHUB_APP_CONFIGURATION_INVALID/);
  assert.equal(r.storeReads(), 0);
});
test('workflow token remains authoritative even when App configuration fails', async () => {
  const r = await resolver({workflow:'workflow-token-fixture', appError:new Error('must not mint')});
  assert.equal(await r.getGitHubToken(), 'workflow-token-fixture');
  assert.deepEqual(await r.getGitHubTokenCandidates(), ['workflow-token-fixture']);
});

test('a rejected canonical credential never silently switches to a different stored identity',async()=>{const r=await resolver({canonical:'rejected-canonical-token',deployed:'other-identity-token',statuses:[401]});await assert.rejects(r.getGitHubToken(),/GITHUB_TOKEN_REJECTED/);assert.equal(r.calls.length,1);assert.equal(r.calls[0].init.headers.Authorization,'Bearer rejected-canonical-token');});
