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
/** Verify a credential against this exact repository before selecting it. */
async function acceptedByGitHub(token: string): Promise<boolean> {
  const response = await fetch(
    'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/ref/heads/main',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    },
  );
  if (response.ok) return true;
  if ([401, 403, 404].includes(response.status)) return false;
  throw new Error(`GITHUB_CREDENTIAL_CHECK_UNAVAILABLE_HTTP_${response.status}`);
}

export async function getGitHubToken(): Promise<string | null> {
  // A nonempty environment token is not necessarily accepted by GitHub.
  // Do not overwrite a valid canonical secret with an expired deployment token.
  const deployed = normalizeToken(process.env.GITHUB_TOKEN);
  const canonical = normalizeToken(await getDecryptedPlatformSecret('GITHUB_TOKEN'));
  const candidates = [...new Set([deployed, canonical].filter(
    (value): value is string => Boolean(value),
  ))];
  if (!candidates.length) return null;

  for (const token of candidates) {
    if (await acceptedByGitHub(token)) return token;
  }
  throw new Error('GITHUB_TOKEN_REJECTED: Both configured credential sources were rejected for Elevate-lms; reconnect an authorized credential in Dev Studio Secrets.');
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
