#!/usr/bin/env node
// Verifies the PARIS GitHub App can operate on elevate-for-humanity/Elevate-lms.
// Mirrors the JWT/installation-token flow in lib/devstudio/github-app-token.ts.
import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const OWNER = 'elevate-for-humanity';
const REPO = 'Elevate-lms';
const API = 'https://api.github.com';
const REQUIRED_WRITE = ['contents', 'actions', 'pull_requests'];

class Failure extends Error {}
const fail = (code, detail = '') => { throw new Failure(detail ? `${code}: ${detail}` : code); };

function loadConfig() {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID?.trim();
  const inline = process.env.GITHUB_APP_PRIVATE_KEY?.trim();
  const file = process.env.GITHUB_APP_PRIVATE_KEY_FILE?.trim();
  if (!appId || !/^\d+$/.test(appId)) fail('GITHUB_APP_ID_MISSING_OR_INVALID');
  if (!installationId || !/^\d+$/.test(installationId)) fail('GITHUB_APP_INSTALLATION_ID_MISSING_OR_INVALID');
  if (!inline && !file) fail('GITHUB_APP_PRIVATE_KEY_MISSING', 'set GITHUB_APP_PRIVATE_KEY or GITHUB_APP_PRIVATE_KEY_FILE');
  if (inline && file) fail('GITHUB_APP_PRIVATE_KEY_AMBIGUOUS', 'set only one of GITHUB_APP_PRIVATE_KEY / GITHUB_APP_PRIVATE_KEY_FILE');
  let key;
  try {
    key = createPrivateKey(inline ? inline.replace(/\\n/g, '\n') : readFileSync(file));
  } catch {
    fail('GITHUB_APP_PRIVATE_KEY_INVALID');
  }
  if (key.asymmetricKeyType !== 'rsa') fail('GITHUB_APP_PRIVATE_KEY_INVALID', 'RSA key required');
  return { appId, installationId, key };
}

function mintJwt(appId, key) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const payload = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iat: now - 60, exp: now + 540, iss: appId })}`;
  return `${payload}.${sign('RSA-SHA256', Buffer.from(payload), key).toString('base64url')}`;
}

async function github(route, token, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API}${route}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    fail('GITHUB_API_UNREACHABLE', `${method} ${route}`);
  }
  if (!response.ok) fail(`GITHUB_API_HTTP_${response.status}`, `${method} ${route}`);
  return response.json();
}

async function main() {
  const { appId, installationId, key } = loadConfig();
  const jwt = mintJwt(appId, key);

  const installations = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await github(`/app/installations?per_page=100&page=${page}`, jwt);
    if (!Array.isArray(batch)) fail('GITHUB_API_RESPONSE_INVALID', '/app/installations');
    installations.push(...batch);
    if (batch.length < 100) break;
  }
  const installation = installations.find((item) => String(item.id) === installationId);
  if (!installation) {
    fail('GITHUB_APP_INSTALLATION_NOT_FOUND',
      `installation ${installationId} not among ${installations.length} installation(s) of app ${appId}`);
  }
  if (String(installation.app_id) !== appId) fail('GITHUB_APP_INSTALLATION_APP_MISMATCH');
  if (installation.suspended_at) fail('GITHUB_APP_INSTALLATION_SUSPENDED');
  if (installation.account?.login?.toLowerCase() !== OWNER.toLowerCase()) {
    fail('GITHUB_APP_INSTALLATION_WRONG_ACCOUNT', String(installation.account?.login ?? 'unknown'));
  }
  const missing = REQUIRED_WRITE.filter((name) => installation.permissions?.[name] !== 'write');
  if (missing.length) fail('GITHUB_APP_PERMISSIONS_INSUFFICIENT', `write required for: ${missing.join(', ')}`);

  const access = await github(`/app/installations/${installationId}/access_tokens`, jwt, { method: 'POST', body: {} });
  if (typeof access?.token !== 'string') fail('GITHUB_APP_INSTALLATION_TOKEN_INVALID');

  let found = installation.repository_selection === 'all';
  for (let page = 1; !found && page <= 10; page++) {
    const result = await github(`/installation/repositories?per_page=100&page=${page}`, access.token);
    const repositories = Array.isArray(result?.repositories) ? result.repositories : [];
    found = repositories.some((repo) => repo.full_name?.toLowerCase() === `${OWNER}/${REPO}`.toLowerCase());
    if (repositories.length < 100) break;
  }
  if (!found) fail('GITHUB_APP_REPOSITORY_NOT_INSTALLED', `${OWNER}/${REPO} is not selected for installation ${installationId}`);

  const branch = await github(`/repos/${OWNER}/${REPO}/branches/main`, access.token);
  if (branch?.name !== 'main' || typeof branch?.commit?.sha !== 'string') fail('GITHUB_APP_BRANCH_PROBE_INVALID');

  console.log(`PASS app=${appId} installation=${installationId} repo=${OWNER}/${REPO} main=${branch.commit.sha.slice(0, 12)}`);
}

main().catch((error) => {
  console.error(`FAIL ${error instanceof Failure ? error.message : 'UNEXPECTED_ERROR'}`);
  process.exit(1);
});
