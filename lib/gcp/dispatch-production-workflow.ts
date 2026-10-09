/**
 * Google-only production deployment dispatch.
 * Dispatch acceptance is not Cloud Run readiness or successful deployment.
 * Never fall back to Northflank or to GitHub Contents API source mutations.
 */
import 'server-only';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';

export type GoogleDeployTarget = 'admin' | 'marketing' | 'course-builder';
const WORKFLOWS: Record<GoogleDeployTarget, string> = {
  admin: 'deploy-admin.yml',
  marketing: 'deploy-google-marketing-trigger.yml',
  'course-builder': 'dispatch-google-course-job.yml',
};
const REPOSITORY = 'elevate-for-humanity/Elevate-lms';

async function deploymentToken(): Promise<string> {
  await hydrateProcessEnv();
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) return token;
  const db = await requireAdminClient();
  const { data, error } = await db.from('platform_secrets')
    .select('value_enc').eq('key', 'GITHUB_TOKEN').maybeSingle();
  if (error || !data?.value_enc?.trim()) {
    throw new Error('Google deployment dispatch token is not configured');
  }
  return data.value_enc.trim();
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
    target, workflow, provider: 'google-cloud-run' as const,
    project: 'elegant-racer-299721',
    status: 'dispatched' as const,
    verifiedLive: false,
    actionsUrl: `https://github.com/${REPOSITORY}/actions/workflows/${workflow}`,
  };
}
