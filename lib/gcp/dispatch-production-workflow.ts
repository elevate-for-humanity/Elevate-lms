/**
 * Google-only production deployment dispatch.
 * Dispatch acceptance is not Cloud Run readiness or successful deployment.
 * Never fall back to Northflank or to GitHub Contents API source mutations.
 */
import 'server-only';
import { getGitHubToken } from '@/lib/devstudio/github-token';

export type GoogleDeployTarget = 'admin' | 'marketing' | 'lms' | 'course-builder';
const WORKFLOWS: Record<GoogleDeployTarget, string> = {
  admin: 'deploy-admin.yml',
  lms: 'deploy-google-lms-trigger.yml',
  marketing: 'deploy-google-marketing-trigger.yml',
  'course-builder': 'dispatch-google-course-job.yml',
};
const REPOSITORY = 'elevate-for-humanity/Elevate-lms';

async function deploymentToken(): Promise<string> {
  const token = await getGitHubToken();
  if (!token) throw new Error('Google deployment dispatch token is not configured');
  return token;
}

export async function dispatchGoogleDeployment(target: GoogleDeployTarget) {
  const workflow = WORKFLOWS[target];
  if (!workflow) throw new Error('Unsupported Google deployment target');
  const token = await deploymentToken();
  const response = await fetch(
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
  if (response.status !== 204) {
    throw new Error(`Google GitHub dispatch refused: HTTP ${response.status}`);
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

export async function isGoogleDeploymentConfigured(): Promise<boolean> {
  try {
    return Boolean(await deploymentToken());
  } catch {
    return false;
  }
}
