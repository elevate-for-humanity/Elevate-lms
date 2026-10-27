/**
 * Google-only production deployment dispatch.
 * Dispatch acceptance is not Cloud Run readiness or successful deployment.
 * Never fall back to Northflank or to GitHub Contents API source mutations.
 */
import 'server-only';
import { getGitHubTokenCandidates } from '@/lib/devstudio/github-token';

export type GoogleDeployTarget = 'admin' | 'marketing' | 'lms' | 'store' | 'course-builder';
const WORKFLOWS: Record<GoogleDeployTarget, string> = {
  admin: 'deploy-admin.yml',
  lms: 'deploy-google-lms-trigger.yml',
  marketing: 'deploy-google-marketing-trigger.yml',
  store: 'deploy-google-store-runtime.yml',
  'course-builder': 'dispatch-google-course-job.yml',
};
const REPOSITORY = 'elevate-for-humanity/Elevate-lms';

export async function dispatchGoogleDeployment(target: GoogleDeployTarget, dependencies: {
  request?: typeof fetch;
  tokens?: () => Promise<string[]>;
} = {}) {
  const workflow = WORKFLOWS[target];
  if (!workflow) throw new Error('Unsupported Google deployment target');
  const tokens = await (dependencies.tokens ?? getGitHubTokenCandidates)();
  if (!tokens.length) throw new Error('Google deployment dispatch token is not configured');
  let response: Response | undefined;
  for (const token of tokens) {
    response = await (dependencies.request ?? fetch)(
    `https://api.github.com/repos/${REPOSITORY}/actions/workflows/${workflow}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    },
  );
    if (response.status === 204) break;
    // Try the other already configured credential only after an auth rejection.
    if (![401, 403].includes(response.status)) break;
  }
  if (response?.status !== 204) {
    throw new Error(`Google GitHub dispatch refused: HTTP ${response?.status ?? 'unavailable'}` +
      (response?.status === 403 ? ' (Actions write permission is required)' : ''));
  }
  return {
    target,
    workflow,
    provider: 'google-cloud-run' as const,
    project: 'elegant-racer-299721',
    status: 'dispatched' as const,
    verifiedLive: false,
    actionsUrl: `https://github.com/${REPOSITORY}/actions/workflows/${workflow}`,
  };
}

export async function isGoogleDeploymentConfigured(dependencies: {
  request?: typeof fetch;
  tokens?: () => Promise<string[]>;
} = {}): Promise<boolean> {
  try {
    const tokens = await (dependencies.tokens ?? getGitHubTokenCandidates)();
    for (const token of tokens) {
      const response = await (dependencies.request ?? fetch)(
        `https://api.github.com/repos/${REPOSITORY}/actions/workflows/deploy-admin.yml`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
          cache: 'no-store', signal: AbortSignal.timeout(8000),
        },
      );
      if ([401, 403].includes(response.status)) continue;
      if (!response.ok) return false;
      return (await response.json()).state === 'active';
    }
    return false;
  } catch { return false; }
}
