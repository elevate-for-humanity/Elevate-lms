import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

async function resolver({deployed, canonical, workflow, statuses = [], storeError}) {
  const source = await readFile(new URL('../lib/devstudio/github-token.ts', import.meta.url), 'utf8');
  const calls = [];
  let storeReads = 0;
  const injected = source
    .replace("import { getDecryptedPlatformSecret } from '@/lib/secrets';", '')
    .replace("import { currentWorkflowGitHubToken } from './workflow-github-context';", '')
    .replaceAll('process.env.GITHUB_TOKEN', 'environment.GITHUB_TOKEN');
  const factory = new Function('getDecryptedPlatformSecret', 'fetch', 'environment', 'currentWorkflowGitHubToken',
    stripTypeScriptTypes(injected).replaceAll('export ', '') + '\nreturn {getGitHubToken, getGitHubHeaders};');
  const api = factory(async () => { storeReads++; if (storeError) throw storeError; return canonical; },
    async (url, init) => { calls.push({url, init}); return new Response(null, {status: statuses.shift() ?? 200}); },
    {GITHUB_TOKEN: deployed}, () => workflow);
  return {...api, calls, storeReads: () => storeReads};
}

test('rejected canonical credential falls back to an authorized deployment credential', async () => {
  const r = await resolver({deployed:'accepted-deployment-token', canonical:'expired-stored-token', statuses:[401, 200]});
  assert.equal(await r.getGitHubToken(), 'accepted-deployment-token');
  assert.deepEqual(r.calls.map(c => c.init.headers.Authorization), ['Bearer expired-stored-token', 'Bearer accepted-deployment-token']);
});
test('accepted deployment credential works while the canonical store is unavailable', async () => {
  const r = await resolver({deployed:'accepted-deployment-token', storeError:new Error('store unavailable')});
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
  const r = await resolver({deployed:'accepted-deployment-token', canonical:'stored-token-fixture', statuses:[503]});
  await assert.rejects(r.getGitHubToken(), /GITHUB_CREDENTIAL_CHECK_UNAVAILABLE_HTTP_503/);
  assert.equal(r.storeReads(), 1);
});
test('workflow-scoped credential keeps its existing isolated execution path', async () => {
  const r = await resolver({workflow:'scoped-workflow-token',storeError:new Error('store unavailable')});
  assert.equal(await r.getGitHubToken(),'scoped-workflow-token');
  assert.equal(r.storeReads(),0);
  assert.equal(r.calls.length,0);
});
test('the canonical rotating credential is read and validated on every request', async () => {
  const r = await resolver({canonical:'accepted-stored-token',deployed:'older-deployment-token'});
  assert.equal(await r.getGitHubToken(),'accepted-stored-token');
  assert.equal(await r.getGitHubToken(),'accepted-stored-token');
  assert.equal(r.storeReads(),2);
  assert.deepEqual(r.calls.map(c=>c.init.headers.Authorization),['Bearer accepted-stored-token','Bearer accepted-stored-token']);
});
test('storage outage without a deployment credential remains an infrastructure failure', async () => {
  const r=await resolver({storeError:new Error('private-storage-details')});
  await assert.rejects(r.getGitHubToken(),error=>/GITHUB_SECRET_STORE_UNAVAILABLE/.test(error.message)&&!error.message.includes('private-storage-details'));
  assert.equal(r.calls.length,0);
});
test('credential validation stays on the exact repository and forbids redirects', async () => {
  const r = await resolver({canonical:'stored-token-fixture'});
  const headers = await r.getGitHubHeaders();
  assert.equal(headers.Authorization, 'Bearer stored-token-fixture');
  assert.equal(r.calls[0].url, 'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/ref/heads/main');
  assert.equal(r.calls[0].init.redirect, 'error');
  assert.equal(r.calls[0].init.cache, 'no-store');
});
