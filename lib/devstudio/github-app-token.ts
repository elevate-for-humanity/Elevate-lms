import 'server-only';
import { createHash, createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const REPOSITORY = 'elevate-for-humanity/Elevate-lms';
const API = 'https://api.github.com';
let cached: { identity: string; token: string; expires: number } | undefined;
let pending: { identity: string; promise: Promise<string> } | undefined;

/** Server-only, opt-in App authentication. Never persist installation tokens. */
export async function getGitHubAppToken(): Promise<string | null> {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID?.trim();
  const pem = process.env.GITHUB_APP_PRIVATE_KEY;
  const path = process.env.GITHUB_APP_PRIVATE_KEY_FILE?.trim();
  if (!appId && !installationId && !pem && !path) return null;
  if (!appId || !installationId || !/^\d+$/.test(appId) || !/^\d+$/.test(installationId) || Boolean(pem) === Boolean(path)) {
    throw new Error('GITHUB_APP_CONFIGURATION_INVALID');
  }

  let key;
  let identity: string;
  try {
    key = createPrivateKey(pem ? pem.replace(/\\n/g, '\n') : readFileSync(path!));
    if (key.asymmetricKeyType !== 'rsa') throw new Error('RSA required');
    identity = createHash('sha256').update(appId).update(':').update(installationId)
      .update(key.export({ type: 'pkcs8', format: 'der' })).digest('hex');
  } catch {
    throw new Error('GITHUB_APP_PRIVATE_KEY_INVALID');
  }
  if (cached?.identity === identity && cached.expires > Date.now() + 60_000) return cached.token;
  if (pending?.identity === identity) return pending.promise;

  const promise = (async () => {
    const now = Math.floor(Date.now() / 1000);
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const payload = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iat: now - 60, exp: now + 540, iss: appId })}`;
    const jwt = `${payload}.${sign('RSA-SHA256', Buffer.from(payload), key).toString('base64url')}`;
    const headers = {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    };
    async function request(route: string, body?: object) {
      let response;
      try {
        response = await fetch(`${API}${route}`, {
          headers, method: body ? 'POST' : 'GET',
          body: body ? JSON.stringify(body) : undefined,
          redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000),
        });
      } catch {
        throw new Error('GITHUB_APP_REQUEST_UNAVAILABLE');
      }
      if (!response.ok) throw new Error(`GITHUB_APP_REQUEST_HTTP_${response.status}`);
      try {
        const result = await response.json();
        if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Invalid shape');
        return result;
      } catch { throw new Error('GITHUB_APP_RESPONSE_INVALID'); }
    }
    // Confirm this installation belongs to this App and the intended repository.
    const installation = await request(`/repos/${REPOSITORY}/installation`);
    if (String(installation.id) !== installationId || String(installation.app_id) !== appId || installation.suspended_at) {
      throw new Error('GITHUB_APP_INSTALLATION_MISMATCH');
    }
    const result = await request(`/app/installations/${installationId}/access_tokens`, { repositories: ['Elevate-lms'] });
    const expires = Date.parse(result.expires_at);
    if (typeof result.token !== 'string' || result.token.length < 20 || /\s/.test(result.token)
      || !Number.isFinite(expires) || expires <= Date.now() + 60_000 || expires > Date.now() + 3_660_000) {
      throw new Error('GITHUB_APP_TOKEN_RESPONSE_INVALID');
    }
    cached = { identity, token: result.token, expires };
    return result.token as string;
  })();
  pending = { identity, promise };
  try { return await promise; } finally { if (pending?.promise === promise) pending = undefined; }
}
