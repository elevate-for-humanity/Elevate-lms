import { createPrivateKey, sign } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { google, PROJECT } from './runtime-config.mjs';

const APP_ID = '5477907';
const REPO = 'elevate-for-humanity/Elevate-lms';
const KEY_PATH = '/var/run/secrets/paris-github-app/key.pem';

/** Verify the existing Google key and installation before creating any revision.
 * Returns only non-secret gcloud flags; callers own protected rollout/acceptance.
 */
export async function parisGitHubAppBinding({ run = google, request = fetch, dispatchSha,
  secret = process.env.PARIS_GITHUB_APP_SECRET || 'paris-engineer-github-private-key' } = {}) {
  if (!/^[a-zA-Z0-9_-]{1,255}$/.test(secret)) throw Error('PARIS_APP_SECRET_NAME_INVALID');
  if (dispatchSha !== undefined && !/^[a-f0-9]{40}$/.test(dispatchSha)) throw Error('PARIS_APP_RELEASE_SHA_INVALID');
  // AccessSecretVersion includes the resolved numeric version and payload.
  // Avoid versions.describe: Secret Accessor permits access, not metadata reads.
  let raw;
  try {
    raw = run(['secrets', 'versions', 'access', 'latest', '--secret', secret,
      '--project', PROJECT, '--format=json(name,payload.data)']);
  } catch (error) {
    const codes = {
      permission_denied: 'PARIS_APP_SECRET_ACCESS_DENIED',
      not_found: 'PARIS_APP_SECRET_NOT_FOUND',
      authentication_failed: 'PARIS_APP_GOOGLE_AUTHENTICATION_FAILED',
      api_disabled: 'PARIS_APP_SECRET_API_DISABLED',
      quota_exceeded: 'PARIS_APP_SECRET_QUOTA_EXCEEDED',
    };
    throw Error(codes[error?.code] || 'PARIS_APP_GOOGLE_SECRET_UNAVAILABLE');
  }
  let accessed;
  try { accessed = JSON.parse(raw); }
  catch { throw Error('PARIS_APP_SECRET_RESPONSE_INVALID'); }
  const match = typeof accessed?.name === 'string'
    ? accessed.name.match(/^projects\/[^/]+\/secrets\/([^/]+)\/versions\/([1-9]\d*)$/)
    : null;
  if (!match || match[1] !== secret) throw Error('PARIS_APP_SECRET_VERSION_INVALID');
  const version = match[2];
  const encoded = accessed?.payload?.data;
  if (typeof encoded !== 'string' || !encoded ||
    !/^[A-Za-z0-9+/_-]+={0,2}$/.test(encoded) || encoded.length > 90_000) {
    throw Error('PARIS_APP_SECRET_RESPONSE_INVALID');
  }
  const pem = Buffer.from(encoded, 'base64').toString('utf8');
  let jwt;
  try {
    const key = createPrivateKey(pem.replace(/\\n/g, '\n'));
    if (key.asymmetricKeyType !== 'rsa') throw Error('RSA required');
    const now = Math.floor(Date.now() / 1000);
    const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    const payload = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iat: now - 60, exp: now + 540, iss: APP_ID })}`;
    jwt = `${payload}.${sign('RSA-SHA256', Buffer.from(payload), key).toString('base64url')}`;
  } catch { throw Error('PARIS_APP_PRIVATE_KEY_INVALID'); }
  async function api(path, bearer, body) {
    let response;
    try {
      response = await request('https://api.github.com' + path, {
        method: body ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${bearer}`, Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
      });
    } catch { throw Error('PARIS_APP_GITHUB_UNAVAILABLE'); }
    if (!response.ok) throw Error(`PARIS_APP_GITHUB_HTTP_${response.status}`);
    if (response.status === 204) return {};
    try {
      const result = await response.json();
      if (!result || typeof result !== 'object' || Array.isArray(result)) throw Error('Invalid shape');
      return result;
    } catch { throw Error('PARIS_APP_GITHUB_RESPONSE_INVALID'); }
  }
  const installation = await api(`/repos/${REPO}/installation`, jwt);
  if (String(installation.app_id) !== APP_ID || !Number.isSafeInteger(installation.id)
    || installation.id < 1 || installation.suspended_at) throw Error('PARIS_APP_INSTALLATION_INVALID');
  const issued = await api(`/app/installations/${installation.id}/access_tokens`, jwt, { repositories: ['Elevate-lms'] });
  if (typeof issued.token !== 'string' || issued.token.length < 20 || /\s/.test(issued.token)
    || !Number.isFinite(Date.parse(issued.expires_at)) || Date.parse(issued.expires_at) <= Date.now() + 60_000) {
    throw Error('PARIS_APP_TOKEN_INVALID');
  }
  if (issued.permissions?.contents !== 'write' || issued.permissions?.actions !== 'write'
    || issued.permissions?.pull_requests !== 'write') throw Error('PARIS_APP_WRITE_PERMISSIONS_REQUIRED');
  const ref = await api(`/repos/${REPO}/git/ref/heads/main`, issued.token);
  if (!/^[a-f0-9]{40}$/.test(ref.object?.sha || '')) throw Error('PARIS_APP_MAIN_REF_INVALID');
  const workflow = await api(`/repos/${REPO}/actions/workflows/paris-code-repair.yml`, issued.token);
  if (workflow.state !== 'active') throw Error('PARIS_APP_REPAIR_WORKFLOW_INACTIVE');
  if (dispatchSha) {
    await api(`/repos/${REPO}/actions/workflows/verify-paris-production-authorization.yml/dispatches`, issued.token,
      { ref: 'main', inputs: { expected_sha: dispatchSha, credential_source: 'github-app-installation' } });
  }
  return [
    `--update-env-vars=GITHUB_APP_ID=${APP_ID},GITHUB_APP_INSTALLATION_ID=${installation.id},GITHUB_APP_PRIVATE_KEY_FILE=${KEY_PATH}`,
    '--remove-env-vars=GITHUB_APP_PRIVATE_KEY',
    `--update-secrets=${KEY_PATH}=${secret}:${version}`,
  ];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dispatchSha = process.argv[2] === '--verify-live' ? process.argv[3] || 'invalid' : undefined;
  parisGitHubAppBinding({ dispatchSha }).then(flags => console.log(dispatchSha ? 'PARIS_APP_READ_ONLY_VERIFICATION_DISPATCHED' : flags.join('\n'))).catch(error => {
    // Neither Google CLI errors nor upstream bodies/credentials are emitted.
    const message = /^PARIS_APP_[A-Z0-9_]+$/.test(error.message) ? error.message : 'PARIS_APP_GOOGLE_SECRET_UNAVAILABLE';
    console.error(message);
    process.exitCode = 1;
  });
}
