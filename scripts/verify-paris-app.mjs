#!/usr/bin/env node
/**
 * Post-install proof for the PARIS GitHub App. Prints PASS/FAIL per check and
 * never prints tokens or key material.
 *
 * Env: GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID (optional; resolved from the
 * repository installation when absent), and GITHUB_APP_PRIVATE_KEY or
 * GITHUB_APP_PRIVATE_KEY_FILE. PARIS_REPOSITORY overrides the repository.
 */
import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const API = 'https://api.github.com';
export const REQUIRED_PERMISSIONS = { contents: 'write', actions: 'write', pull_requests: 'write' };

export function appJwt(appId, pem, now = Math.floor(Date.now() / 1000)) {
  const key = createPrivateKey(pem.replace(/\\n/g, '\n'));
  if (key.asymmetricKeyType !== 'rsa') throw Error('GITHUB_APP_PRIVATE_KEY_INVALID');
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const payload = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iat: now - 60, exp: now + 540, iss: String(appId) })}`;
  return `${payload}.${sign('RSA-SHA256', Buffer.from(payload), key).toString('base64url')}`;
}

export function permissionChecks(permissions = {}) {
  return Object.entries(REQUIRED_PERMISSIONS).map(([name, level]) => ({
    name: `permission ${name}:${level}`,
    passed: permissions[name] === level || (level === 'read' && permissions[name] === 'write'),
    detail: `${permissions[name] === level ? '' : 'GITHUB_APP_WRITE_PERMISSIONS_REQUIRED '}granted=${permissions[name] ?? 'none'}`,
  }));
}

export async function verifyParisApp({ env = process.env, request = fetch } = {}) {
  const repository = env.PARIS_REPOSITORY || 'elevate-for-humanity/Elevate-lms';
  const checks = [];
  const record = (name, passed, detail = '') => { checks.push({ name, passed, detail }); return passed; };
  const call = async (path, token, init = {}) => {
    const response = await request(API + path, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28', ...(init.body ? { 'Content-Type': 'application/json' } : {}) }, signal: AbortSignal.timeout(15000) });
    const body = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, body };
  };
  const appId = env.GITHUB_APP_ID?.trim();
  const keyFile = env.GITHUB_APP_PRIVATE_KEY_FILE?.trim();
  const pem = env.GITHUB_APP_PRIVATE_KEY || (keyFile ? readFileSync(keyFile, 'utf8') : '');
  if (!record('app credentials present', Boolean(appId && /^\d+$/.test(appId) && pem), appId ? '' : 'GITHUB_APP_ID missing')) return checks;
  let jwt;
  try { jwt = appJwt(appId, pem); record('app JWT minted', true); }
  catch { record('app JWT minted', false, 'GITHUB_APP_PRIVATE_KEY_INVALID'); return checks; }
  const app = await call('/app', jwt);
  if (!record('app identity', app.ok && String(app.body.id) === appId, `${app.ok ? 'GITHUB_APP_INSTALLATION_MISMATCH' : 'GITHUB_APP_REQUEST_HTTP_' + app.status}${app.body.slug ? ' slug=' + app.body.slug : ''}`)) return checks;
  const installation = await call(`/repos/${repository}/installation`, jwt);
  const expected = env.GITHUB_APP_INSTALLATION_ID?.trim();
  const resolved = installation.ok ? String(installation.body.id) : null;
  if (!record(`installation on ${repository}`, installation.ok && !installation.body.suspended_at && (!expected || expected === resolved),
    installation.ok ? `id=${resolved}${expected && expected !== resolved ? ' GITHUB_APP_INSTALLATION_MISMATCH (configured ' + expected + ')' : ''}${installation.body.suspended_at ? ' SUSPENDED' : ''}` : `GITHUB_APP_REQUEST_HTTP_${installation.status} — App not installed on repository`)) return checks;
  for (const check of permissionChecks(installation.body.permissions)) record(check.name, check.passed, check.detail);
  const minted = await call(`/app/installations/${resolved}/access_tokens`, jwt, { method: 'POST', body: JSON.stringify({ repositories: [repository.split('/')[1]] }) });
  if (!record('installation token minted', minted.ok && typeof minted.body.token === 'string', `GITHUB_APP_REQUEST_HTTP_${minted.status}`)) return checks;
  const ref = await call(`/repos/${repository}/git/ref/heads/main`, minted.body.token);
  record('main ref readable', ref.ok && /^[a-f0-9]{40}$/.test(ref.body.object?.sha ?? ''), ref.ok ? `sha=${ref.body.object.sha.slice(0, 12)}` : `GITHUB_APP_REQUEST_HTTP_${ref.status}`);
  await call('/installation/token', minted.body.token, { method: 'DELETE' }).catch(() => null);
  return checks;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyParisApp().then(checks => {
    for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'}  ${check.name}${check.detail ? '  (' + check.detail + ')' : ''}`);
    const failed = checks.filter(check => !check.passed).length;
    console.log(failed ? `\n${failed} check(s) failed` : '\nAll PARIS GitHub App checks passed');
    process.exitCode = failed ? 1 : 0;
  }).catch(error => { console.error('FAIL  verifier error (' + (error?.name ?? 'Error') + ')'); process.exitCode = 1; });
}
