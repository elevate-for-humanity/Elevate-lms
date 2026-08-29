/**
 * Resolve GITHUB_TOKEN for Dev Studio GitHub API routes.
 * Canonical platform_secrets values are hydrated before process.env fallback.
 */

import { getSecret, hydrateProcessEnv } from '@/lib/secrets';

function looksLikeToken(value: string | undefined | null): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 10) return false;
  if (/placeholder/i.test(trimmed)) return false;
  return true;
}

/** Load current runtime secrets into process.env before GitHub calls. */
export async function ensureDevStudioSecrets(): Promise<void> {
  await hydrateProcessEnv();
}

/**
 * Do not keep a second token cache here. lib/secrets already owns the runtime
 * cache and refreshSecrets() invalidates it after Studio rotations. A duplicate
 * cache made a newly-rotated GitHub token remain stale for up to five minutes.
 */
export async function getGitHubToken(): Promise<string | null> {
  // Capture the deployment value before hydration. hydrateProcessEnv may load
  // a canonical fallback into process.env, but must not replace a valid token
  // supplied directly by the production service.
  const deployedToken = process.env.GITHUB_TOKEN;
  if (looksLikeToken(deployedToken)) return deployedToken.trim();

  await ensureDevStudioSecrets();

  const fromCanonicalStore = await getSecret('GITHUB_TOKEN');
  if (looksLikeToken(fromCanonicalStore)) {
    const token = fromCanonicalStore.trim();
    process.env.GITHUB_TOKEN = token;
    return token;
  }

  return null;
}

export async function getGitHubHeaders(): Promise<HeadersInit> {
  const token = await getGitHubToken();
  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured. Add it in Dev Studio > Secrets.');
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
    return 'GitHub token rejected (401). Rotate GITHUB_TOKEN in Dev Studio > Secrets.';
  }
  if (status === 403) {
    return 'GitHub API forbidden (403). Ensure GITHUB_TOKEN has contents read/write permission on elevate-for-humanity/Elevate-lms.';
  }
  if (status === 404) {
    return 'Requested GitHub resource was not found in elevate-for-humanity/Elevate-lms.';
  }
  return `GitHub API error (${status}) — check GITHUB_TOKEN in Dev Studio > Secrets`;
}
