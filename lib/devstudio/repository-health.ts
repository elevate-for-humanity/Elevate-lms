import 'server-only';
import { getGitHubToken } from './github-token';
import { buildCapabilityHealth } from './capability-health';
import { GOOGLE_DEPLOY_WORKFLOWS } from '@/lib/gcp/dispatch-production-workflow';

/** Use the same identity as repository operations, including GitHub Apps. */
export async function getRepositoryHealth() {
  let mainSha: string | null = null;
  let message = 'GitHub authentication is not configured.';
  try {
    const token = await getGitHubToken();
    if (token) {
      const response = await fetch(
        'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/ref/heads/main',
        {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28' },
          redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000),
        },
      );
      const body = response.ok ? await response.json() : null;
      if (response.ok && /^[a-f0-9]{40}$/.test(body?.object?.sha ?? '')) mainSha = body.object.sha;
      message = mainSha
        ? 'Elevate-lms main reference verified. Write and workflow execution require separate operation evidence.'
        : `Repository access could not be verified (HTTP ${response.status}).`;
    }
  } catch {
    message = 'Repository authentication or connectivity could not be verified.';
  }
  const ok = mainSha !== null;
  return {
    ...buildCapabilityHealth('repository', [
      { name: 'github-repository-access', passed: ok, required: true, message },
    ]),
    summary: mainSha ? `Elevate-lms main is ${mainSha}. Admin deploys through .github/workflows/${GOOGLE_DEPLOY_WORKFLOWS.admin}.` : message,
    ok, mainSha, repository: 'elevate-for-humanity/Elevate-lms', branch: 'main',
    configuredDeploymentWorkflows: GOOGLE_DEPLOY_WORKFLOWS,
  };
}
