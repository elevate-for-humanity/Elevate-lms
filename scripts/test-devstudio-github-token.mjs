import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

async function resolver({deployed, canonical, statuses = [], storeError, workflow, canonicalReads}) {
  const source = await readFile(new URL('../lib/devstudio/github-token.ts', import.meta.url), 'utf8');
  const calls = [];
  let storeReads = 0;
  const injected = source
    .replace("import { getDecryptedPlatformSecret } from '@/lib/secrets';", '')
    .replace("import { currentWorkflowGitHubToken } from './workflow-github-context';", '')
    .replaceAll('process.env.GITHUB_TOKEN', 'environment.GITHUB_TOKEN');
  const factory = new Function('getDecryptedPlatformSecret', 'fetch', 'environment', 'currentWorkflowGitHubToken',
    stripTypeScriptTypes(injected).replaceAll('export ', '') + '\nreturn {getGitHubToken, getGitHubHeaders};');
  const api = factory(async () => { storeReads++; if (storeError) throw storeError; return canonicalReads ? canonicalReads.shift() : canonical; },
    async (url, init) => { calls.push({url, init}); return new Response(null, {status: statuses.shift() ?? 200}); },
    {GITHUB_TOKEN: deployed}, () => workflow);
  return {...api, calls, storeReads: () => storeReads};
}

test('rejected deployment credential falls back to the authorized stored credential', async () => {
  const r = await resolver({deployed:'expired-deployment-token', canonicalReads:[null,'accepted-stored-token'], statuses:[401, 200]});
  assert.equal(await r.getGitHubToken(), 'accepted-stored-token');
  assert.deepEqual(r.calls.map(c => c.init.headers.Authorization), ['Bearer expired-deployment-token', 'Bearer accepted-stored-token']);
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
  const r = await resolver({deployed:secret, canonicalReads:[null,secret], statuses:[401]});
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
  assert.equal(r.calls.length, 0);
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
