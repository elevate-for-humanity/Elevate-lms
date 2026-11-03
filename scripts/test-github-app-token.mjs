import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { createHash, createPrivateKey, sign, generateKeyPairSync, verify } from 'node:crypto';

const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = pair.privateKey.export({ type: 'pkcs8', format: 'pem' });
const source = stripTypeScriptTypes(await readFile(new URL('../lib/devstudio/github-app-token.ts', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replaceAll('export ', '');
function fixture({ env = {}, stored = {}, status = 200, mismatch = false, invalidToken = false, network = false, mounted = false, permissions = { contents: 'write', actions: 'write', pull_requests: 'write' } } = {}) {
  let now = Date.now();
  const calls = [];
  const environment = { GITHUB_APP_ID: '5477907', GITHUB_APP_INSTALLATION_ID: '42',
    ...(mounted ? { GITHUB_APP_PRIVATE_KEY_FILE: '/mounted/key.pem' } : { GITHUB_APP_PRIVATE_KEY: pem }), ...env };
  const factory = new Function('createHash', 'createPrivateKey', 'sign', 'readFileSync', 'process', 'fetch', 'Date', 'getDecryptedPlatformSecret', 'getAdminGitHubAppSecret',
    source + '\nreturn getGitHubAppToken;');
  const get = factory(createHash, createPrivateKey, sign, () => pem, { env: environment }, async (url, init) => {
    calls.push({ url, init });
    if (network) throw new Error('network error containing sensitive upstream details');
    return new Response(JSON.stringify(url.endsWith('/installation')
      ? { id: mismatch ? 99 : 42, app_id: 5477907, suspended_at: null }
      : { token: 'ghs_fixture_installation_token', expires_at: invalidToken ? 'invalid' : new Date(now + 3600_000).toISOString(), permissions }), { status });
  }, { now: () => now, parse: Date.parse }, async key => stored[key], async key => stored[key]);
  return { get, calls, env: environment, advance: ms => { now += ms; } };
}
test('signs verifiable RSA JWT and scopes token to only Elevate-lms', async () => {
  const f = fixture();
  assert.equal(await f.get(), 'ghs_fixture_installation_token');
  const jwt = f.calls[0].init.headers.Authorization.slice(7);
  const parts = jwt.split('.');
  assert.ok(verify('RSA-SHA256', Buffer.from(parts.slice(0, 2).join('.')), pair.publicKey, Buffer.from(parts[2], 'base64url')));
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url'));
  assert.equal(claims.iss, '5477907');
  assert.equal(claims.exp - claims.iat, 600);
  assert.equal(f.calls[0].url, 'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/installation');
  assert.equal(f.calls[1].url, 'https://api.github.com/app/installations/42/access_tokens');
  assert.deepEqual(JSON.parse(f.calls[1].init.body), { repositories: ['Elevate-lms'] });
  assert.ok(f.calls.every(c => c.init.redirect === 'error' && c.init.cache === 'no-store'));
});
test('coalesces requests and renews before token expiration', async () => {
  const f = fixture();
  await Promise.all([f.get(), f.get(), f.get()]);
  assert.equal(f.calls.length, 2);
  await f.get();
  assert.equal(f.calls.length, 2);
  f.advance(3540_000);
  await f.get();
  assert.equal(f.calls.length, 4);
});
test('supports mounted Secret Manager PEM and literal newline PEM', async () => {
  assert.equal(await fixture({ mounted: true }).get(), 'ghs_fixture_installation_token');
  assert.equal(await fixture({ env: { GITHUB_APP_PRIVATE_KEY: pem.replaceAll('\n', '\\n') } }).get(), 'ghs_fixture_installation_token');
});
test('missing App config permits legacy auth; partial or ambiguous config fails closed', async () => {
  assert.equal(await fixture({ env: { GITHUB_APP_ID: '', GITHUB_APP_INSTALLATION_ID: '', GITHUB_APP_PRIVATE_KEY: '' } }).get(), null);
  for (const env of [{ GITHUB_APP_INSTALLATION_ID: '' }, { GITHUB_APP_ID: '../bad' }, { GITHUB_APP_PRIVATE_KEY_FILE: '/also-set' }]) {
    const f = fixture({ env });
    await assert.rejects(f.get(), /GITHUB_APP_CONFIGURATION_INVALID/);
    assert.equal(f.calls.length, 0);
  }
});
test('rotation and installation changes invalidate cached authorization', async () => {
  const f = fixture();
  await f.get();
  f.env.GITHUB_APP_PRIVATE_KEY = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' });
  await f.get();
  assert.equal(f.calls.length, 4);
  f.env.GITHUB_APP_INSTALLATION_ID = '99';
  await assert.rejects(f.get(), /GITHUB_APP_INSTALLATION_MISMATCH/);
});
test('rejects wrong installations and invalid token expiry', async () => {
  const f = fixture({ mismatch: true });
  await assert.rejects(f.get(), /GITHUB_APP_INSTALLATION_MISMATCH/);
  assert.equal(f.calls.length, 1);
  await assert.rejects(fixture({ invalidToken: true }).get(), /GITHUB_APP_TOKEN_RESPONSE_INVALID/);
});
test('errors omit PEMs, JWTs, network details and upstream payloads', async () => {
  await assert.rejects(fixture({ status: 401 }).get(), { message: 'GITHUB_APP_REQUEST_HTTP_401' });
  await assert.rejects(fixture({ network: true }).get(), { message: 'GITHUB_APP_REQUEST_UNAVAILABLE' });
  await assert.rejects(fixture({ env: { GITHUB_APP_PRIVATE_KEY: 'sensitive-invalid-key' } }).get(), { message: 'GITHUB_APP_PRIVATE_KEY_INVALID' });
});
test('failed issuance is not cached', async () => {
  const f = fixture({ status: 503 });
  await assert.rejects(f.get());
  await assert.rejects(f.get());
  assert.equal(f.calls.length, 2);
});

test('read-only or incomplete App permissions cannot authorize PARIS repairs', async () => {
  for (const permissions of [
    { contents: 'read', actions: 'write', pull_requests: 'write' },
    { contents: 'write', actions: 'read', pull_requests: 'write' },
    { contents: 'write', actions: 'write', pull_requests: 'read' },
    {},
  ]) {
    const f = fixture({ permissions });
    await assert.rejects(f.get(), { message: 'GITHUB_APP_WRITE_PERMISSIONS_REQUIRED' });
    assert.equal(f.calls.length, 2);
  }
});

test('uses exact encrypted Admin GitHub App fields when deployment has no App environment', async () => {
  const f = fixture({
    env: { GITHUB_APP_ID: '', GITHUB_APP_INSTALLATION_ID: '', GITHUB_APP_PRIVATE_KEY: '' },
    stored: { GITHUB_APP_ID: '5477907', GITHUB_APP_INSTALLATION_ID: '42', GITHUB_APP_PRIVATE_KEY: pem, GITHUB_TOKEN: 'not-a-private-key' },
  });
  assert.equal(await f.get(), 'ghs_fixture_installation_token');
  assert.equal(f.calls.length, 2);
});
test('does not promote dashboard PAT into the GitHub App signing key', async () => {
  const f = fixture({
    env: { GITHUB_APP_ID: '', GITHUB_APP_INSTALLATION_ID: '', GITHUB_APP_PRIVATE_KEY: '' },
    stored: { GITHUB_APP_ID: '5477907', GITHUB_APP_INSTALLATION_ID: '42', GITHUB_TOKEN: 'github_pat_old_token' },
  });
  await assert.rejects(f.get(), { message: 'GITHUB_APP_CONFIGURATION_INVALID' });
  assert.equal(f.calls.length, 0);
});
test('mounted App key does not load dashboard key or silently mix identities', async () => {
  const f = fixture({ mounted: true, stored: { GITHUB_APP_PRIVATE_KEY: 'not-a-key' } });
  assert.equal(await f.get(), 'ghs_fixture_installation_token');
});

test('dashboard-only mode ignores stale deployment App environment and rejects missing canonical key', async () => {
  const f = fixture({
    env: { PARIS_GITHUB_APP_SOURCE: 'dashboard', GITHUB_APP_PRIVATE_KEY: 'obsolete-runtime-key', GITHUB_APP_ID: '999', GITHUB_APP_INSTALLATION_ID: '888' },
    stored: { GITHUB_APP_ID: '5477907', GITHUB_APP_INSTALLATION_ID: '42', GITHUB_APP_PRIVATE_KEY: pem },
  });
  assert.equal(await f.get(), 'ghs_fixture_installation_token');
  assert.equal(f.calls.length, 2);
  const missing = fixture({
    env: { PARIS_GITHUB_APP_SOURCE: 'dashboard' },
    stored: { GITHUB_APP_ID: '5477907', GITHUB_APP_INSTALLATION_ID: '42' },
  });
  await assert.rejects(missing.get(), { message: 'GITHUB_APP_CONFIGURATION_INVALID' });
});
