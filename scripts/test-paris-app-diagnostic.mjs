import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const source = stripTypeScriptTypes(await readFile(new URL('../apps/admin/app/api/cron/paris-code-repair/route.ts', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replaceAll('export ', '');
function route({ authorized = true, token = 'ghs_fixture_app_installation', error } = {}) {
  let appCalls = 0, contextCalls = 0, headers;
  const factory = new Function('authorizeParisWorkflow', 'getGitHubAppToken', 'diagnoseParisGitHubCredential', 'withWorkflowGitHubToken', 'NextResponse', source + '\nreturn POST;');
  const post = factory(async () => authorized, async () => { appCalls++; if (error) throw error; return token; },
    async h => { headers = h; return { diagnosticVersion: 2, repository: { ok: true } }; },
    () => { contextCalls++; throw Error('must not use workflow token'); },
    { json: (body, options = {}) => ({ body, status: options.status ?? 200, headers: options.headers }) });
  return { post: () => post({ headers: new Headers({ authorization: 'Bearer identity', 'x-paris-github-token': 'different-workflow-token' }), json: async () => ({ phase: 'app-auth-diagnostic' }) }),
    calls: () => ({ appCalls, contextCalls, headers }) };
}
test('App diagnostic ignores workflow override and returns only safe source/status metadata', async () => {
  const r = route();
  const response = await r.post();
  assert.equal(response.status, 200);
  assert.equal(response.body.credentialSource, 'github-app-installation');
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.equal(r.calls().headers.Authorization, 'Bearer ghs_fixture_app_installation');
  assert.equal(r.calls().contextCalls, 0);
  assert.ok(!JSON.stringify(response).includes('ghs_'));
});
test('unauthorized diagnostic cannot access App credentials', async () => {
  const r = route({ authorized: false });
  assert.equal((await r.post()).status, 401);
  assert.equal(r.calls().appCalls, 0);
});
test('missing App configuration never passes via a legacy token', async () => {
  const r = route({ token: null });
  assert.equal((await r.post()).status, 503);
  assert.equal(r.calls().contextCalls, 0);
});
test('credential failure stays redacted in response and log', async () => {
  const r = route({ error: Error('sensitive upstream details') });
  const response = await r.post();
  assert.equal(response.status, 502);
  assert.equal(response.body.errorCode, 'PARIS_REPAIR_PHASE_FAILED');
  assert.ok(!JSON.stringify(response).includes('sensitive'));
});
