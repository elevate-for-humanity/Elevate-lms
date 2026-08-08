import { NextRequest } from 'next/server';
import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const tokenPresent = Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
    const repositoryPresent = Boolean(process.env.GITHUB_REPOSITORY || process.env.GITHUB_REPO);
    return buildCapabilityHealth('repository', [
      {
        name: 'github-token',
        passed: tokenPresent,
        required: true,
        message: tokenPresent ? 'GitHub token is configured.' : 'GitHub token is missing.',
      },
      {
        name: 'github-repository',
        passed: repositoryPresent,
        required: true,
        message: repositoryPresent ? 'GitHub repository is configured.' : 'GitHub repository is missing.',
      },
    ]);
  });
}
