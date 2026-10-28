/**
 * Resolve GITHUB_TOKEN for Dev Studio GitHub API routes.
 * Signed workflow identity, explicitly configured App, then the one saved runtime token.
 */

import { currentWorkflowGitHubToken } from './workflow-github-context';
import { getGitHubAppToken } from './github-app-token';
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

/** A present token can be expired or lack access to the requested repository. */
async function acceptedByGitHub(token: string): Promise<boolean> {
  const response = await fetch(
    'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/ref/heads/main',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    },
  );
  if (response.ok) return true;
  if ([401, 403, 404].includes(response.status)) return false;
  throw new Error(`GITHUB_CREDENTIAL_CHECK_UNAVAILABLE_HTTP_${response.status}`);
}

export async function getGitHubToken(): Promise<string | null> {
  const workflowToken=currentWorkflowGitHubToken();
  if(workflowToken)return workflowToken;
  const appToken = await getGitHubAppToken();
  if (appToken) return appToken;
  // One saved runtime source. Never retry a rejected credential through an
  // expired duplicate or silently change identities after a failed check.
  const stored = normalizeToken(await getDecryptedPlatformSecret('GITHUB_TOKEN'));
  const selected = stored ?? normalizeToken(process.env.GITHUB_TOKEN);
  if (selected && await acceptedByGitHub(selected)) return selected;
  if (selected) {
    throw new Error('GITHUB_TOKEN_REJECTED: The configured runtime credential was rejected for Elevate-lms. Update GITHUB_TOKEN in Admin Secrets.');
  }
  return null;
}

export async function getGitHubHeaders(): Promise<HeadersInit> {
  const token = await getGitHubToken();
  if (!token) {
    throw new Error('GitHub authentication is not configured. Bind GitHub App credentials in the server runtime or add GITHUB_TOKEN in Dev Studio > Secrets.');
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
    return 'GitHub token rejected (401). Check the configured GitHub App installation or legacy GITHUB_TOKEN.';
  }
  if (status === 403) {
    return 'GitHub API forbidden (403). Check the App installation or legacy token permissions on elevate-for-humanity/Elevate-lms.';
  }
  if (status === 404) {
    return 'Requested GitHub resource was not found in elevate-for-humanity/Elevate-lms.';
  }
  return `GitHub API error (${status}) — check GITHUB_TOKEN in Dev Studio > Secrets`;
}

/** Existing credentials for the same repository; never log or persist their values. */
export async function getGitHubTokenCandidates(): Promise<string[]> {
  const selected = await getGitHubToken();
  return selected ? [selected] : [];
}
