/**
 * Resolve GITHUB_TOKEN for Dev Studio GitHub API routes.
 * Precedence: hydrate platform_secrets → process.env (see lib/secrets.ts).
 */

import { getSecret, hydrateProcessEnv } from '@/lib/secrets';

let tokenCache: { token: string; expiresAt: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

function looksLikeToken(value: string | undefined | null): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 10) return false;
  if (/placeholder/i.test(trimmed)) return false;
  return true;
}

/** Load platform_secrets into process.env before GitHub calls. */
export async function ensureDevStudioSecrets(): Promise<void> {
  await hydrateProcessEnv();
}

export async function getGitHubToken(): Promise<string | null> {
  await ensureDevStudioSecrets();

  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const fromEnv = process.env.GITHUB_TOKEN;
  if (looksLikeToken(fromEnv)) {
    tokenCache = { token: fromEnv.trim(), expiresAt: Date.now() + CACHE_MS };
    return tokenCache.token;
  }

  const fromDb = await getSecret('GITHUB_TOKEN');
  if (looksLikeToken(fromDb)) {
    const token = fromDb.trim();
    process.env.GITHUB_TOKEN = token;
    tokenCache = { token, expiresAt: Date.now() + CACHE_MS };
    return token;
  }

  return null;
}

export async function getGitHubHeaders(): Promise<HeadersInit> {
  const token = await getGitHubToken();
  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured. Add it in Dev Studio > Secrets tab.');
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

export function githubApiErrorMessage(status: number): string {
  if (status === 401) {
    return 'GitHub token rejected (401). Rotate GITHUB_TOKEN in Dev Studio > Secrets with repo + workflow scopes.';
  }
  if (status === 403) {
    return 'GitHub API forbidden (403). Ensure GITHUB_TOKEN has contents:read/write on elevate-for-humanity/Elevate-lms.';
  }
  if (status === 404) {
    return 'devcontainer.json not found in repo';
  }
  return `GitHub API error (${status}) — check GITHUB_TOKEN in Dev Studio > Secrets`;
}
