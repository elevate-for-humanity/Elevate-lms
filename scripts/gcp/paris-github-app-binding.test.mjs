import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { parisGitHubAppBinding } from './paris-github-app-binding.mjs';

const pem = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' });
function fixture({ appId = 5477907, suspended = false, permissions = { contents: 'write', actions: 'write', pull_requests: 'write' }, status = 200 } = {}) {
  const googleCalls = [], requests = [];
  return { googleCalls, requests, dependencies: {
    run: args => { googleCalls.push(args); if (args[2] !== 'access') throw Object.assign(Error('metadata permission denied'), {code:'permission_denied'}); return JSON.stringify({name:'projects/484736877039/secrets/paris-engineer-github-private-key/versions/3',payload:{data:Buffer.from(pem).toString('base64')}}); },
    request: async (url, init) => {
      requests.push({ url, init });
      if (url.endsWith('/dispatches')) return new Response(null, { status: 204 });
      const body = url.endsWith('/installation') ? { id: 42, app_id: appId, suspended_at: suspended ? 'today' : null }
        : url.endsWith('/access_tokens') ? { token: 'ghs_fixture_installation_token', expires_at: new Date(Date.now() + 3600_000).toISOString(), permissions }
        : url.endsWith('/main') ? { object: { sha: 'a'.repeat(40) } } : { state: 'active' };
      return new Response(JSON.stringify(body), { status });
    },
  } };
}
test('checks key, installation, permissions and repository before emitting immutable secret mount flags', async () => {
  const f = fixture();
  const flags = await parisGitHubAppBinding(f.dependencies);
  assert.equal(flags.length, 3);
  assert.match(flags[0], /GITHUB_APP_INSTALLATION_ID=42/);
  assert.match(flags[2], /key.pem=paris-engineer-github-private-key:3$/);
  assert.ok(!flags.join('\n').includes(pem));
  assert.ok(!flags.join('\n').includes('ghs_'));
  assert.equal(f.googleCalls.length, 1);
  assert.equal(f.googleCalls[0][2], 'access');
  assert.equal(f.googleCalls[0][3], 'latest');
  assert.ok(f.googleCalls[0].includes('--format=json(name,payload.data)'));
  assert.ok(f.googleCalls.every(args => args[0] === 'secrets' && args[1] === 'versions'));
  assert.deepEqual(JSON.parse(f.requests[1].init.body), { repositories: ['Elevate-lms'] });
  assert.ok(f.requests.every(r => r.init.redirect === 'error' && r.init.cache === 'no-store'));
});
test('rejects wrong/suspended App installation before issuing a token', async () => {
  for (const options of [{ appId: 99 }, { suspended: true }]) {
    const f = fixture(options);
    await assert.rejects(parisGitHubAppBinding(f.dependencies), /PARIS_APP_INSTALLATION_INVALID/);
    assert.equal(f.requests.length, 1);
  }
});
test('does not silently enable repair with missing write permissions', async () => {
  const f = fixture({ permissions: { contents: 'read', actions: 'read' } });
  await assert.rejects(parisGitHubAppBinding(f.dependencies), /PARIS_APP_WRITE_PERMISSIONS_REQUIRED/);
  assert.equal(f.requests.length, 2);
});
test('missing key and upstream authorization failures prevent any rollout flags', async () => {
  const f = fixture({ status: 401 });
  await assert.rejects(parisGitHubAppBinding(f.dependencies), { message: 'PARIS_APP_GITHUB_HTTP_401' });
  await assert.rejects(parisGitHubAppBinding({ run: () => { throw Error('secret unavailable'); } }));
});
test('post-release dispatch uses the App token and only the read-only verification workflow', async () => {
  const f = fixture();
  await parisGitHubAppBinding({ ...f.dependencies, dispatchSha: 'a'.repeat(40) });
  const dispatch = f.requests.at(-1);
  assert.equal(dispatch.url, 'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/actions/workflows/verify-paris-production-authorization.yml/dispatches');
  assert.equal(dispatch.init.headers.Authorization, 'Bearer ghs_fixture_installation_token');
  assert.deepEqual(JSON.parse(dispatch.init.body), { ref: 'main', inputs: { expected_sha: 'a'.repeat(40), credential_source: 'github-app-installation' } });
});
test('invalid release SHA or secret reference is rejected before secret access', async () => {
  const f = fixture();
  await assert.rejects(parisGitHubAppBinding({ ...f.dependencies, dispatchSha: 'untrusted-ref' }), /RELEASE_SHA_INVALID/);
  await assert.rejects(parisGitHubAppBinding({ ...f.dependencies, secret: '../other/key' }), /SECRET_NAME_INVALID/);
  assert.equal(f.googleCalls.length, 0);
});

test('secret access failures retain safe categories and never expose upstream details', async () => {
  for (const [code, expected] of [
    ['permission_denied','PARIS_APP_SECRET_ACCESS_DENIED'],
    ['not_found','PARIS_APP_SECRET_NOT_FOUND'],
    ['authentication_failed','PARIS_APP_GOOGLE_AUTHENTICATION_FAILED'],
    ['api_disabled','PARIS_APP_SECRET_API_DISABLED'],
    ['quota_exceeded','PARIS_APP_SECRET_QUOTA_EXCEEDED'],
    ['unexpected','PARIS_APP_GOOGLE_SECRET_UNAVAILABLE'],
  ]) {
    const f=fixture();
    await assert.rejects(parisGitHubAppBinding({...f.dependencies,run:()=>{
      throw Object.assign(Error('sensitive upstream response '+pem),{code});
    }}),{message:expected});
    assert.equal(f.requests.length,0);
  }
});
test('malformed, unpinned or mismatched access responses cannot produce rollout flags',async()=>{
  for (const raw of [
    pem,
    '{}',
    JSON.stringify({name:'projects/484736877039/secrets/other/versions/3',payload:{data:Buffer.from(pem).toString('base64')}}),
    JSON.stringify({name:'projects/484736877039/secrets/paris-engineer-github-private-key/versions/latest',payload:{data:Buffer.from(pem).toString('base64')}}),
    JSON.stringify({name:'projects/484736877039/secrets/paris-engineer-github-private-key/versions/3',payload:{data:'%%%'}}),
  ]) {
    const f=fixture();
    await assert.rejects(parisGitHubAppBinding({...f.dependencies,run:()=>raw}),/PARIS_APP_SECRET_(RESPONSE|VERSION)_INVALID/);
    assert.equal(f.requests.length,0);
  }
});
