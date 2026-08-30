/**
 * Resolve GITHUB_TOKEN for Dev Studio GitHub API routes.
 * Canonical platform_secrets values are hydrated before process.env fallback.
 */

import { getDecryptedPlatformSecret } from '@/lib/secrets';

function normalizeToken(value: string | undefined | null): string | null {
  if (!value) return null;
  let token = value.trim();

  // Accept values copied from shell snippets or authorization headers.
  token = token.replace(/^(['"])(.*)\1$/, '$2').trim();
  token = token.replace(/^(?:token|bearer)\s+/i, '').trim();

  if (token.length < 10) return null;
  if (/placeholder/i.test(token)) return null;
  return token;
}

/**
 * Retained for route compatibility. GitHub credentials are now resolved by
 * exact key in getGitHubToken instead of hydrating every platform secret.
 */
export async function ensureDevStudioSecrets(): Promise<void> {
  await getGitHubToken();
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
  const deployedToken = normalizeToken(process.env.GITHUB_TOKEN);
  if (deployedToken) return deployedToken;

  const fromCanonicalStore = normalizeToken(
    await getDecryptedPlatformSecret('GITHUB_TOKEN'),
  );
  if (fromCanonicalStore) {
    process.env.GITHUB_TOKEN = fromCanonicalStore;
    return fromCanonicalStore;
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
